'use strict';

const db = uniCloud.database();
const actionsCol = db.collection('pf_actions_log');
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

const actionLabelMap = {
  water: '浇水',
  fertilize: '施肥',
  weed: '除草',
  prune: '修剪'
};

exports.main = async (event, context) => {
  const uid = await getUid(event, context);
  if (!uid) {
    return { code: 401, msg: '请先登录', data: null };
  }

  const page = Math.max(1, Number(event.page || 1));
  const pageSize = Math.max(1, Math.min(Number(event.pageSize || 10), 50));
  if (!Number.isFinite(page) || !Number.isFinite(pageSize)) {
    return { code: 400, msg: '分页参数无效', data: null };
  }
  const skip = (page - 1) * pageSize;
  const userPlantId = String(event.user_plant_id || '').trim();
  const where = { uid };
  if (userPlantId) {
    where.user_plant_id = userPlantId;
  }

  const listRes = await actionsCol
    .where(where)
    .orderBy('create_time', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get();

  const countRes = await actionsCol.where(where).count();

  const list = (listRes.data || []).map((item) => ({
    _id: item._id,
    user_plant_id: item.user_plant_id || '',
    action_type: item.action_type,
    action_label: actionLabelMap[item.action_type] || item.action_type,
    growth_delta: item.growth_delta || 0,
    action_date: item.action_date || '',
    create_time: item.create_time || null
  }));

  return {
    code: 0,
    msg: 'ok',
    data: {
      list,
      pagination: {
        page,
        pageSize,
        total: countRes.total
      }
    }
  };
};
