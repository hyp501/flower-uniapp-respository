'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const usersCol = db.collection('pf_users');
const plantsCol = db.collection('pf_plants');
const userPlantsCol = db.collection('pf_user_plants');
const actionsCol = db.collection('pf_actions_log');
const uniID = require('uni-id');

const actionNameMap = {
  water: '浇水',
  fertilize: '施肥',
  weed: '除草',
  prune: '修剪',
  share: '分享'
};

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

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function resolveStageLabel(stageRules, growthValue) {
  const rules = (stageRules || []).slice().sort((a, b) => a.min_growth - b.min_growth);
  let label = '种子';
  let stage = 'seed';
  for (const item of rules) {
    if (growthValue >= item.min_growth) {
      label = item.label;
      stage = item.stage;
    }
  }
  return { stage, stageLabel: label };
}

function clamp(value, min = 0, max = 100) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  if (num < min) return min;
  if (num > max) return max;
  return Math.round(num);
}

function normalizeStat(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return clamp(num, 0, 100);
}

exports.main = async (event, context) => {
  const uid = await getUid(event, context);
  const actionType = event.action_type;
  const requestId = event.request_id || '';
  const selectedUserPlantId = event.user_plant_id || '';

  if (!uid) {
    return { code: 401, msg: '请先登录' };
  }

  if (!['water', 'fertilize', 'weed', 'prune', 'share'].includes(actionType)) {
    return { code: 400, msg: '无效动作类型' };
  }

  const userRes = await usersCol.where({ uid }).limit(1).get();
  const user = userRes.data[0];
  if (!user) {
    return { code: 404, msg: '未找到用户信息，请先进入首页初始化' };
  }

  let userPlant = null;
  const targetUserPlantId = selectedUserPlantId || user.current_user_plant_id;
  if (targetUserPlantId) {
    const userPlantRes = await userPlantsCol.doc(targetUserPlantId).get();
    userPlant = userPlantRes.data[0] || null;
  }
  if (!userPlant) {
    const fallbackRes = await userPlantsCol.where({ uid }).limit(1).get();
    userPlant = fallbackRes.data[0] || null;
  }
  if (!userPlant || userPlant.uid !== uid) {
    return { code: 404, msg: '用户花朵不存在' };
  }

  const plantRes = await plantsCol.doc(userPlant.plant_id).get();
  const plant = plantRes.data[0];
  if (!plant) {
    return { code: 404, msg: '花种配置不存在' };
  }

  const today = getTodayStr();
  const idempotencyKey = `${uid}:${userPlant._id}:${actionType}:${today}`;

  // 幂等命中：同一用户同一天同一动作重复请求返回首次成功结果
  const existingRes = await actionsCol.where({ idempotency_key: idempotencyKey }).limit(1).get();
  if (existingRes.data.length > 0) {
    return {
      code: 429,
      msg: `${actionNameMap[actionType]}今日次数已达上限`,
      data: {
        idempotent: true,
        action_type: actionType,
        growth_delta: 0
      }
    };
  }

  const dailyLimit = ((plant.daily_action_limit || {})[actionType] || 1);
  const todayCountRes = await actionsCol.where({
    uid,
    user_plant_id: userPlant._id,
    action_date: today,
    action_type: actionType
  }).count();
  if (todayCountRes.total >= dailyLimit) {
    return { code: 429, msg: `${actionNameMap[actionType]}今日次数已达上限` };
  }

  const growthDelta = actionType === 'share' ? 2 : ((plant.growth_per_action || {})[actionType] || 1);
  const nextGrowth = (userPlant.growth_value || 0) + growthDelta;
  const stageInfo = resolveStageLabel(plant.stage_rules, nextGrowth);
  const baseWater = normalizeStat(userPlant.water_level, 60);
  const baseFertilizer = normalizeStat(userPlant.fertilizer_level, 60);
  const baseHealth = normalizeStat(userPlant.health_score, 100);

  let nextWater = baseWater;
  let nextFertilizer = baseFertilizer;
  let nextHealth = baseHealth;

  if (actionType === 'water') {
    nextWater = clamp(baseWater + 24);
    nextFertilizer = clamp(baseFertilizer - 6);
    nextHealth = clamp(baseHealth + 6);
  } else if (actionType === 'fertilize') {
    nextFertilizer = clamp(baseFertilizer + 24);
    nextWater = clamp(baseWater - 6);
    nextHealth = clamp(baseHealth + 5);
  } else if (actionType === 'weed') {
    nextHealth = clamp(baseHealth + 14);
    nextWater = clamp(baseWater + 4);
    nextFertilizer = clamp(baseFertilizer + 4);
  } else if (actionType === 'prune') {
    nextHealth = clamp(baseHealth + 10);
    nextWater = clamp(baseWater - 3);
    nextFertilizer = clamp(baseFertilizer - 3);
  }

  await actionsCol.add({
    uid,
    user_plant_id: userPlant._id,
    action_type: actionType,
    growth_delta: growthDelta,
    action_date: today,
    idempotency_key: idempotencyKey,
    request_id: requestId
  });

  await userPlantsCol.doc(userPlant._id).update({
    growth_value: dbCmd.inc(growthDelta),
    stage: stageInfo.stage,
    water_level: nextWater,
    fertilizer_level: nextFertilizer,
    health_score: nextHealth,
    last_action_date: today,
    update_time: Date.now()
  });

  await usersCol.doc(user._id).update({
    total_growth: dbCmd.inc(growthDelta),
    total_actions: dbCmd.inc(1),
    current_user_plant_id: userPlant._id,
    update_time: Date.now()
  });

  return {
    code: 0,
    msg: `${actionNameMap[actionType]}成功`,
    data: {
      idempotent: false,
      action_type: actionType,
      user_plant_id: userPlant._id,
      growth_delta: growthDelta,
      growth_value: nextGrowth,
      stage: stageInfo.stage,
      stage_label: stageInfo.stageLabel,
      water_level: nextWater,
      fertilizer_level: nextFertilizer,
      health_score: nextHealth
    }
  };
};
