'use strict';

const db = uniCloud.database();
const userPlantsCol = db.collection('pf_user_plants');
const plantsCol = db.collection('pf_plants');
const ordersCol = db.collection('pf_exchange_orders');
const uniID = require('uni-id');

async function getUid(event, context) {
  const contextUid = context && context.auth && context.auth.uid;
  if (contextUid) return contextUid;
  if (event && event.uniIdToken) {
    const payload = await uniID.checkToken(event.uniIdToken);
    if (!payload.code && payload.uid) return payload.uid;
    return '';
  }
  return '';
}

function trimString(value) {
  return String(value || '').trim();
}

exports.main = async (event, context) => {
  const uid = await getUid(event, context);
  if (!uid) {
    return { code: 401, msg: '请先登录' };
  }

  const userPlantId = trimString(event.user_plant_id);
  const consignee = trimString(event.consignee);
  const mobile = trimString(event.mobile);
  const region = trimString(event.region);
  const address = trimString(event.address);

  if (!userPlantId) return { code: 400, msg: '请选择兑换花朵' };
  if (!consignee) return { code: 400, msg: '请填写收货人' };
  if (!/^1\d{10}$/.test(mobile)) return { code: 400, msg: '手机号格式不正确' };
  if (!region) return { code: 400, msg: '请填写所在地区' };
  if (!address || address.length < 5) return { code: 400, msg: '请填写详细地址' };

  const userPlantRes = await userPlantsCol.doc(userPlantId).get();
  const userPlant = (userPlantRes.data || [])[0];
  if (!userPlant || userPlant.uid !== uid) {
    return { code: 403, msg: '该花朵不存在或无权限操作' };
  }
  if (userPlant.stage !== 'bloom') {
    return { code: 403, msg: '仅盛开状态花朵可兑换' };
  }
  if (userPlant.exchange_status === 'ordered' || userPlant.exchange_status === 'ordering' || userPlant.exchange_status === 'shipped' || userPlant.exchange_status === 'received') {
    return { code: 409, msg: '该花朵已兑换过' };
  }
  const existedOrderRes = await ordersCol.where({
    uid,
    user_plant_id: userPlant._id,
    status: 'pending_ship'
  }).limit(1).get();
  const existedOrder = (existedOrderRes.data || [])[0];
  if (existedOrder && existedOrder._id) {
    await userPlantsCol.doc(userPlant._id).update({
      exchange_status: 'ordered',
      exchange_order_id: existedOrder._id,
      update_time: Date.now()
    });
    return {
      code: 0,
      msg: '兑换订单已存在',
      data: {
        order_id: existedOrder._id,
        status: existedOrder.status || 'pending_ship',
        duplicate: true
      }
    };
  }

  await userPlantsCol.doc(userPlant._id).update({
    exchange_status: 'ordering',
    update_time: Date.now()
  });

  const plantRes = await plantsCol.doc(userPlant.plant_id).get();
  const plant = (plantRes.data || [])[0] || {};

  let addOrderRes = null;
  try {
    addOrderRes = await ordersCol.add({
      uid,
      user_plant_id: userPlant._id,
      plant_id: userPlant.plant_id || '',
      plant_name: plant.name || '未知花种',
      consignee,
      mobile,
      region,
      address,
      status: 'pending_ship'
    });
  } catch (error) {
    await userPlantsCol.doc(userPlant._id).update({
      exchange_status: 'none',
      update_time: Date.now()
    });
    return {
      code: 500,
      msg: '兑换下单失败，请稍后重试'
    };
  }

  await userPlantsCol.doc(userPlant._id).update({
    exchange_status: 'ordered',
    exchange_order_id: addOrderRes.id,
    exchange_time: Date.now(),
    update_time: Date.now()
  });

  return {
    code: 0,
    msg: '兑换订单创建成功',
    data: {
      order_id: addOrderRes.id,
      status: 'pending_ship'
    }
  };
};
