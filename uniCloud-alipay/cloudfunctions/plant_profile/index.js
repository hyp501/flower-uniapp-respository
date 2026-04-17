'use strict';

const db = uniCloud.database();
const usersCol = db.collection('pf_users');
const plantsCol = db.collection('pf_plants');
const userPlantsCol = db.collection('pf_user_plants');
const actionsCol = db.collection('pf_actions_log');
const uniID = require('uni-id');
const { getLevelInfoByGrowth } = require('plant-level');

const defaultPlantSeed = [
  {
    code: 'rose-basic',
    name: '玫瑰',
    unlock_level: 1,
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
    unlock_level: 2,
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
    unlock_level: 3,
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
  // 优先使用数据库里的花种配置；仅在空库时写入默认种子
  if (currentPlants.length > 0) {
    return currentPlants;
  }
  for (const seed of defaultPlantSeed) {
    await plantsCol.add(seed);
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

async function getUserPlants(uid) {
  const userPlantsRes = await userPlantsCol.where({ uid }).get();
  return userPlantsRes.data || [];
}

async function ensureDefaultGarden(uid) {
  const enabledPlants = await ensureDefaultPlants();
  let user = await ensureUser(uid);
  const allUserPlants = await getUserPlants(uid);
  let userPlants = allUserPlants.filter((item) => item && item.is_planted === true);

  // 兼容历史数据：老版本没有 is_planted 字段，至少把当前选择的花记为已种下
  if (!userPlants.length && user.current_user_plant_id) {
    const legacyCurrent = allUserPlants.find((item) => item._id === user.current_user_plant_id);
    if (legacyCurrent) {
      await userPlantsCol.doc(legacyCurrent._id).update({
        is_planted: true,
        update_time: Date.now()
      });
      userPlants = [{ ...legacyCurrent, is_planted: true }];
    }
  }

  let currentUserPlant = null;
  if (user.current_user_plant_id) {
    currentUserPlant = userPlants.find((item) => item._id === user.current_user_plant_id) || null;
  }
  if (!currentUserPlant) {
    currentUserPlant = userPlants[0] || null;
    await usersCol.doc(user._id).update({
      current_user_plant_id: currentUserPlant ? currentUserPlant._id : '',
      update_time: Date.now()
    });
    user.current_user_plant_id = currentUserPlant ? currentUserPlant._id : '';
  }

  return { user, userPlants, allUserPlants, enabledPlants, currentUserPlant };
}

exports.main = async (event, context) => {
  const uid = await getUid(event, context);
  if (!uid) {
    return { code: 401, msg: '请先登录', data: null };
  }

  const { user, userPlants, allUserPlants, enabledPlants, currentUserPlant } = await ensureDefaultGarden(uid);
  const plantsById = {};
  enabledPlants.forEach((item) => {
    plantsById[item._id] = item;
  });
  const userPlantByPlantId = {};
  allUserPlants.forEach((item) => {
    userPlantByPlantId[item.plant_id] = item;
  });
  const today = new Date().toISOString().slice(0, 10);

  const actionCountMap = { water: 0, fertilize: 0, weed: 0 };
  if (currentUserPlant && currentUserPlant._id) {
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
  }

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
      today_action_count: (currentUserPlant && userPlantItem._id === currentUserPlant._id)
        ? actionCountMap
        : { water: 0, fertilize: 0, weed: 0 }
    };
  });
  const currentFlower = currentUserPlant
    ? flowers.find((item) => item.user_plant_id === currentUserPlant._id) || flowers[0]
    : null;
  const seedCatalog = enabledPlants.map((plant) => {
    const userPlant = userPlantByPlantId[plant._id];
    return {
      plant_id: plant._id,
      code: plant.code || '',
      name: plant.name || '未知花种',
      description: plant.description || '',
        unlock_level: Number(plant.unlock_level) > 0 ? Number(plant.unlock_level) : 1,
      is_enabled: !!plant.is_enabled,
      user_plant_id: userPlant ? userPlant._id : '',
      is_planted: !!userPlant,
      is_current: !!(userPlant && currentUserPlant && userPlant._id === currentUserPlant._id)
    };
  });

  return {
    code: 0,
    msg: 'ok',
    data: {
      user: {
        uid,
        display_name: user.display_name || '花友',
        avatar: user.avatar || '',
        total_growth: user.total_growth || 0,
        total_actions: user.total_actions || 0,
        ...getLevelInfoByGrowth(user.total_growth || 0)
      },
      plant: {
        ...(currentFlower || {})
      },
      garden: {
        current_user_plant_id: currentFlower ? currentFlower.user_plant_id : '',
        total_flowers: flowers.length,
        flowers
      },
      seed_catalog: seedCatalog
    }
  };
};
