'use strict';

const db = uniCloud.database();
const usersCol = db.collection('pf_users');
const plantsCol = db.collection('pf_plants');
const userPlantsCol = db.collection('pf_user_plants');
const actionsCol = db.collection('pf_actions_log');
const uniID = require('uni-id');

const defaultPlantSeed = [
  {
    code: 'rose-basic',
    name: '玫瑰',
    description: '热烈浪漫，适合每天细心浇灌',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '幼苗', min_growth: 9 },
      { stage: 'bloom', label: '盛放', min_growth: 18 }
    ],
    growth_per_action: { water: 1, fertilize: 2, weed: 1 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'sunflower-basic',
    name: '向日葵',
    description: '阳光型花种，施肥收益更高',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '挺拔幼苗', min_growth: 9 },
      { stage: 'bloom', label: '向阳开花', min_growth: 18 }
    ],
    growth_per_action: { water: 1, fertilize: 2, weed: 1 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'lily-basic',
    name: '百合',
    description: '洁白优雅，除草收益更高',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '青嫩芽叶', min_growth: 9 },
      { stage: 'bloom', label: '清雅盛开', min_growth: 18 }
    ],
    growth_per_action: { water: 1, fertilize: 2, weed: 1 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  }
];

async function getUid(event, context) {
  if (event && event.uniIdToken) {
    const payload = await uniID.checkToken(event.uniIdToken);
    if (!payload.code && payload.uid) return payload.uid;
  }
  return (event && event.uid) || (context && context.auth && context.auth.uid) || '';
}

function resolveStageLabel(stageRules, growthValue) {
  const rules = (stageRules || []).slice().sort((a, b) => a.min_growth - b.min_growth);
  let label = '种子';
  for (const rule of rules) {
    if (growthValue >= rule.min_growth) {
      label = rule.label;
    }
  }
  return label;
}

async function ensureDefaultPlants() {
  const plantsRes = await plantsCol.where({ is_enabled: true }).get();
  const currentPlants = plantsRes.data || [];
  const codeMap = {};
  currentPlants.forEach((item) => {
    codeMap[item.code] = item;
  });

  for (const seed of defaultPlantSeed) {
    const existing = codeMap[seed.code];
    if (!existing) {
      await plantsCol.add(seed);
      continue;
    }
    await plantsCol.doc(existing._id).update({
      name: seed.name,
      description: seed.description,
      stage_rules: seed.stage_rules,
      growth_per_action: seed.growth_per_action,
      daily_action_limit: seed.daily_action_limit,
      is_enabled: seed.is_enabled,
      update_time: Date.now()
    });
  }

  const latestRes = await plantsCol.where({ is_enabled: true }).get();
  return latestRes.data || [];
}

async function ensureUser(uid) {
  const userRes = await usersCol.where({ uid }).limit(1).get();
  let user = userRes.data[0];

  if (!user) {
    const addUserRes = await usersCol.add({
      uid,
      display_name: '花友',
      total_growth: 0,
      total_actions: 0
    });
    const newUserRes = await usersCol.doc(addUserRes.id).get();
    user = newUserRes.data[0];
  }
  return user;
}

async function ensureUserPlants(uid, enabledPlants) {
  const userPlantsRes = await userPlantsCol.where({ uid }).get();
  const userPlants = userPlantsRes.data || [];
  const plantedMap = {};
  userPlants.forEach((item) => {
    plantedMap[item.plant_id] = true;
  });

  for (const plant of enabledPlants) {
    if (!plantedMap[plant._id]) {
      await userPlantsCol.add({
        uid,
        plant_id: plant._id,
        growth_value: 0,
        stage: 'seed',
        health_score: 100
      });
    }
  }

  const latestUserPlantsRes = await userPlantsCol.where({ uid }).get();
  return latestUserPlantsRes.data || [];
}

async function ensureDefaultGarden(uid) {
  const enabledPlants = await ensureDefaultPlants();
  let user = await ensureUser(uid);
  const userPlants = await ensureUserPlants(uid, enabledPlants);

  let currentUserPlant = null;
  if (user.current_user_plant_id) {
    currentUserPlant = userPlants.find((item) => item._id === user.current_user_plant_id) || null;
  }
  if (!currentUserPlant) {
    currentUserPlant = userPlants[0] || null;
    if (currentUserPlant) {
      await usersCol.doc(user._id).update({
        current_user_plant_id: currentUserPlant._id,
        update_time: Date.now()
      });
      user.current_user_plant_id = currentUserPlant._id;
    }
  }

  return { user, userPlants, enabledPlants, currentUserPlant };
}

exports.main = async (event, context) => {
  const uid = await getUid(event, context);
  if (!uid) {
    return { code: 401, msg: '请先登录', data: null };
  }

  const { user, userPlants, enabledPlants, currentUserPlant } = await ensureDefaultGarden(uid);
  if (!currentUserPlant) {
    return { code: 500, msg: '初始化花园失败', data: null };
  }

  const plantsById = {};
  enabledPlants.forEach((item) => {
    plantsById[item._id] = item;
  });
  const today = new Date().toISOString().slice(0, 10);

  const actionCountMap = { water: 0, fertilize: 0, weed: 0 };
  const todayActionRes = await actionsCol.where({
    uid,
    user_plant_id: currentUserPlant._id,
    action_date: today
  }).get();
  (todayActionRes.data || []).forEach((item) => {
    const actionType = item.action_type;
    if (Object.prototype.hasOwnProperty.call(actionCountMap, actionType)) {
      actionCountMap[actionType] += 1;
    }
  });

  const flowers = userPlants.map((userPlantItem) => {
    const plant = plantsById[userPlantItem.plant_id] || {};
    return {
      user_plant_id: userPlantItem._id,
      plant_id: plant._id || userPlantItem.plant_id,
      code: plant.code || '',
      name: plant.name || '未知花种',
      description: plant.description || '',
      growth_value: userPlantItem.growth_value || 0,
      stage: userPlantItem.stage || 'seed',
      stage_label: resolveStageLabel(plant.stage_rules, userPlantItem.growth_value || 0),
      growth_per_action: plant.growth_per_action || { water: 1, fertilize: 2, weed: 1 },
      daily_action_limit: plant.daily_action_limit || { water: 1, fertilize: 1, weed: 1 },
      today_action_count: userPlantItem._id === currentUserPlant._id ? actionCountMap : { water: 0, fertilize: 0, weed: 0 }
    };
  });
  const currentFlower = flowers.find((item) => item.user_plant_id === currentUserPlant._id) || flowers[0];

  return {
    code: 0,
    msg: 'ok',
    data: {
      user: {
        uid,
        display_name: user.display_name || '花友',
        avatar: user.avatar || '',
        total_growth: user.total_growth || 0,
        total_actions: user.total_actions || 0
      },
      plant: {
        ...currentFlower
      },
      garden: {
        current_user_plant_id: currentFlower.user_plant_id,
        total_flowers: flowers.length,
        flowers
      }
    }
  };
};
