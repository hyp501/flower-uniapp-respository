'use strict';

const db = uniCloud.database();
const usersCol = db.collection('pf_users');
const plantsCol = db.collection('pf_plants');
const userPlantsCol = db.collection('pf_user_plants');
const uniID = require('uni-id');
const { getLevelInfoByGrowth, getUnlockLevelByPrice } = require('plant-level');

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

exports.main = async (event, context) => {
  const uid = await getUid(event, context);
  const userPlantId = event.user_plant_id || '';
  const plantId = event.plant_id || '';
  const plantCode = event.code || '';

  if (!uid) {
    return { code: 401, msg: '请先登录' };
  }
  if (!userPlantId && !plantId && !plantCode) {
    return { code: 400, msg: '缺少种子信息' };
  }

  const userRes = await usersCol.where({ uid }).limit(1).get();
  const user = userRes.data[0];
  if (!user) {
    return { code: 404, msg: '用户不存在，请先进入首页初始化' };
  }

  let userPlant = null;
  if (userPlantId) {
    const userPlantRes = await userPlantsCol.doc(userPlantId).get();
    userPlant = userPlantRes.data[0];
    if (userPlant && userPlant.uid !== uid) {
      return { code: 403, msg: '无权限种下该种子' };
    }
  }

  if (!userPlant) {
    let targetPlant = null;
    if (plantId) {
      const plantRes = await plantsCol.doc(plantId).get();
      targetPlant = (plantRes.data || [])[0] || null;
    } else if (plantCode) {
      const plantRes = await plantsCol.where({ code: plantCode, is_enabled: true }).limit(1).get();
      targetPlant = (plantRes.data || [])[0] || null;
    }
    if (!targetPlant || !targetPlant._id) {
      return { code: 404, msg: '花种不存在或未启用' };
    }
    const userLevel = getLevelInfoByGrowth(user.total_growth || 0).user_level;
    const plantPrice = Math.max(0, Math.floor(Number(targetPlant.price) || 0));
    const unlockLevel = getUnlockLevelByPrice(plantPrice);
    if (userLevel < unlockLevel) {
      return { code: 403, msg: `该花种需达到Lv${unlockLevel}才可解锁` };
    }

    const existedRes = await userPlantsCol.where({ uid, plant_id: targetPlant._id }).limit(1).get();
    userPlant = (existedRes.data || [])[0] || null;
    if (!userPlant) {
      const addRes = await userPlantsCol.add({
        uid,
        plant_id: targetPlant._id,
        is_planted: true,
        growth_value: 0,
        stage: 'seed',
        water_level: 60,
        fertilizer_level: 60,
        health_score: 100
      });
      const freshRes = await userPlantsCol.doc(addRes.id).get();
      userPlant = (freshRes.data || [])[0] || null;
    } else {
      const patch = {
        is_planted: true,
        update_time: Date.now()
      };
      if (typeof userPlant.water_level !== 'number') patch.water_level = 60;
      if (typeof userPlant.fertilizer_level !== 'number') patch.fertilizer_level = 60;
      if (typeof userPlant.health_score !== 'number') patch.health_score = 100;
      await userPlantsCol.doc(userPlant._id).update(patch);
      userPlant = {
        ...userPlant,
        ...patch
      };
    }
  }

  if (!userPlant || !userPlant._id) {
    return { code: 500, msg: '种下失败，请重试' };
  }

  if (userPlant.is_planted !== true) {
    const patch = {
      is_planted: true,
      update_time: Date.now()
    };
    if (typeof userPlant.water_level !== 'number') patch.water_level = 60;
    if (typeof userPlant.fertilizer_level !== 'number') patch.fertilizer_level = 60;
    if (typeof userPlant.health_score !== 'number') patch.health_score = 100;
    await userPlantsCol.doc(userPlant._id).update(patch);
  }

  await usersCol.doc(user._id).update({
    current_user_plant_id: userPlant._id,
    update_time: Date.now()
  });

  return {
    code: 0,
    msg: '种下成功',
    data: {
      user_plant_id: userPlant._id
    }
  };
};
