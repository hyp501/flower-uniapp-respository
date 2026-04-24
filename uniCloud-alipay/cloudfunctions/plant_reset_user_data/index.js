'use strict';

const db = uniCloud.database();
const usersCol = db.collection('pf_users');
const userPlantsCol = db.collection('pf_user_plants');
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

exports.main = async (event, context) => {
  const uid = await getUid(event, context);
  const dryRun = event && event.dry_run !== false;
  const confirm = !!(event && event.confirm);
  const keepScore = !!(event && event.keep_score);

  if (!uid) {
    return { code: 401, msg: '请先登录' };
  }
  if (!dryRun && !confirm) {
    return { code: 400, msg: '执行重置必须传 confirm=true' };
  }

  const userRes = await usersCol.where({ uid }).limit(1).get();
  const user = (userRes.data || [])[0];
  if (!user) {
    return { code: 404, msg: '用户不存在，请先进入首页初始化' };
  }

  const userPlantsRes = await userPlantsCol.where({ uid }).get();
  const userPlants = userPlantsRes.data || [];
  const userPlantIds = userPlants.map((item) => item && item._id).filter(Boolean);

  const actionCountByPlant = {};
  let totalActionLogs = 0;
  for (const id of userPlantIds) {
    const countRes = await actionsCol.where({ uid, user_plant_id: id }).count();
    const total = Number((countRes && countRes.total) || 0);
    actionCountByPlant[id] = total;
    totalActionLogs += total;
  }

  const summary = {
    uid,
    dry_run: dryRun,
    keep_score: keepScore,
    before: {
      total_growth: Number(user.total_growth || 0),
      total_actions: Number(user.total_actions || 0),
      current_user_plant_id: user.current_user_plant_id || '',
      user_plant_count: userPlantIds.length,
      action_log_count: totalActionLogs
    },
    reset_actions: {
      remove_user_plants: userPlantIds.length,
      remove_action_logs: totalActionLogs,
      reset_user_fields: keepScore
        ? ['current_user_plant_id']
        : ['total_growth', 'total_actions', 'current_user_plant_id']
    }
  };

  if (dryRun) {
    return {
      code: 0,
      msg: '重置预览完成',
      data: summary
    };
  }

  for (const id of userPlantIds) {
    await actionsCol.where({ uid, user_plant_id: id }).remove();
  }
  await userPlantsCol.where({ uid }).remove();

  const userPatch = {
    current_user_plant_id: '',
    update_time: Date.now()
  };
  if (!keepScore) {
    userPatch.total_growth = 0;
    userPatch.total_actions = 0;
  }
  await usersCol.doc(user._id).update(userPatch);

  return {
    code: 0,
    msg: '重置完成',
    data: {
      ...summary,
      after: {
        total_growth: keepScore ? Number(user.total_growth || 0) : 0,
        total_actions: keepScore ? Number(user.total_actions || 0) : 0,
        current_user_plant_id: '',
        user_plant_count: 0,
        action_log_count: 0
      }
    }
  };
};
