'use strict';

const db = uniCloud.database();
const usersCol = db.collection('pf_users');
const uniUsersCol = db.collection('uni-id-users');
const plantsCol = db.collection('pf_plants');
const userPlantsCol = db.collection('pf_user_plants');
const actionsCol = db.collection('pf_actions_log');
const uniID = require('uni-id');
const { getLevelInfoByGrowth, getUnlockLevelByPrice } = require('plant-level');

const defaultPlantSeed = [
  {
    code: 'rose-basic',
    name: '玫瑰',
    price: 60,
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
    price: 140,
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
    price: 240,
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
  },
  {
    code: 'tulip-pink',
    name: '郁金香',
    price: 120,
    description: '花形挺拔，色彩明快',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '展叶', min_growth: 10 },
      { stage: 'bloom', label: '盛放', min_growth: 20 }
    ],
    growth_per_action: { water: 2, fertilize: 2, weed: 1 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'carnation-red',
    name: '康乃馨',
    price: 160,
    description: '花瓣层叠，象征温暖',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '分枝', min_growth: 10 },
      { stage: 'bloom', label: '绽放', min_growth: 20 }
    ],
    growth_per_action: { water: 2, fertilize: 2, weed: 1 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'lavender-purple',
    name: '薰衣草',
    price: 220,
    description: '香气安宁，适合静心花园',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '抽穗', min_growth: 11 },
      { stage: 'bloom', label: '香氛花穗', min_growth: 22 }
    ],
    growth_per_action: { water: 2, fertilize: 3, weed: 1 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'hydrangea-blue',
    name: '绣球花',
    price: 260,
    description: '团簇饱满，色彩柔和',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '花球孕育', min_growth: 12 },
      { stage: 'bloom', label: '团簇盛放', min_growth: 24 }
    ],
    growth_per_action: { water: 2, fertilize: 3, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'peony-pink',
    name: '牡丹',
    price: 320,
    description: '雍容华贵，花型饱满',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '孕蕾', min_growth: 12 },
      { stage: 'bloom', label: '国色天香', min_growth: 25 }
    ],
    growth_per_action: { water: 2, fertilize: 3, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'camellia-red',
    name: '山茶花',
    price: 360,
    description: '花色浓艳，枝叶常青',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '抽芽', min_growth: 12 },
      { stage: 'bloom', label: '冬日绽放', min_growth: 25 }
    ],
    growth_per_action: { water: 2, fertilize: 3, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'jasmine-white',
    name: '茉莉',
    price: 420,
    description: '洁白清香，气质淡雅',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '攀援生长', min_growth: 13 },
      { stage: 'bloom', label: '清香四溢', min_growth: 26 }
    ],
    growth_per_action: { water: 2, fertilize: 3, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'orchid-green',
    name: '兰花',
    price: 460,
    description: '清雅高洁，观赏性强',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '新叶', min_growth: 13 },
      { stage: 'bloom', label: '幽兰绽香', min_growth: 26 }
    ],
    growth_per_action: { water: 2, fertilize: 3, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'hibiscus-red',
    name: '扶桑花',
    price: 520,
    description: '热带风情，花色鲜亮',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '伸枝', min_growth: 14 },
      { stage: 'bloom', label: '灿烂盛开', min_growth: 28 }
    ],
    growth_per_action: { water: 2, fertilize: 4, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'azalea-pink',
    name: '杜鹃',
    price: 560,
    description: '满枝花簇，热烈明艳',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '新梢', min_growth: 14 },
      { stage: 'bloom', label: '花团锦簇', min_growth: 28 }
    ],
    growth_per_action: { water: 2, fertilize: 4, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'plumeria-yellow',
    name: '鸡蛋花',
    price: 620,
    description: '香气柔和，热带感十足',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '展枝', min_growth: 15 },
      { stage: 'bloom', label: '暖香绽放', min_growth: 30 }
    ],
    growth_per_action: { water: 2, fertilize: 4, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'dahlia-red',
    name: '大丽花',
    price: 660,
    description: '花型丰富，色彩浓烈',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '繁叶', min_growth: 15 },
      { stage: 'bloom', label: '层层绽放', min_growth: 30 }
    ],
    growth_per_action: { water: 2, fertilize: 4, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'lotus-pink',
    name: '荷花',
    price: 720,
    description: '亭亭净植，夏日主角',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '浮叶', min_growth: 16 },
      { stage: 'bloom', label: '清莲盛放', min_growth: 32 }
    ],
    growth_per_action: { water: 3, fertilize: 4, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'cherry-blossom',
    name: '樱花',
    price: 760,
    description: '春日浪漫，轻盈绽放',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '抽枝', min_growth: 16 },
      { stage: 'bloom', label: '樱云满枝', min_growth: 32 }
    ],
    growth_per_action: { water: 3, fertilize: 4, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'wisteria-violet',
    name: '紫藤',
    price: 800,
    description: '垂穗成瀑，梦幻飘逸',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '攀援', min_growth: 16 },
      { stage: 'bloom', label: '紫瀑流光', min_growth: 33 }
    ],
    growth_per_action: { water: 3, fertilize: 4, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'iris-blue',
    name: '鸢尾',
    price: 880,
    description: '花瓣挺阔，线条凌厉',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '剑叶伸展', min_growth: 17 },
      { stage: 'bloom', label: '蓝紫绽放', min_growth: 34 }
    ],
    growth_per_action: { water: 3, fertilize: 4, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  },
  {
    code: 'magnolia-white',
    name: '玉兰',
    price: 920,
    description: '花姿端庄，气质高雅',
    stage_rules: [
      { stage: 'seed', label: '种子', min_growth: 0 },
      { stage: 'sprout', label: '抽芽', min_growth: 18 },
      { stage: 'bloom', label: '玉瓣初绽', min_growth: 35 }
    ],
    growth_per_action: { water: 3, fertilize: 4, weed: 2 },
    daily_action_limit: { water: 1, fertilize: 1, weed: 1 },
    is_enabled: true
  }
];

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
  let currentPlants = plantsRes.data || [];
  for (const plant of currentPlants) {
    if (!plant || !plant._id) continue;
    const growth = plant.growth_per_action || {};
    if (typeof growth.prune === 'number') continue;
    await plantsCol.doc(plant._id).update({
      growth_per_action: {
        water: Number(growth.water) || 1,
        fertilize: Number(growth.fertilize) || 1,
        weed: Number(growth.weed) || 1,
        prune: 1
      },
      update_time: Date.now()
    });
  }
  // 回读最新数据，确保返回给前端的是已补齐 prune 的配置
  const refreshedRes = await plantsCol.where({ is_enabled: true }).get();
  currentPlants = refreshedRes.data || [];
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
  const uniUserRes = await uniUsersCol.doc(uid).get();
  const uniUser = uniUserRes.data && uniUserRes.data[0] ? uniUserRes.data[0] : null;
  const candidateName = (uniUser && (uniUser.nickname || uniUser.username)) || '';
  const userRes = await usersCol.where({ uid }).limit(1).get();
  let user = userRes.data[0];

  if (!user) {
    const addUserRes = await usersCol.add({
      uid,
      display_name: candidateName || '花友',
      total_growth: 0,
      total_actions: 0
    });
    const newUserRes = await usersCol.doc(addUserRes.id).get();
    user = newUserRes.data[0];
  } else if (!user.display_name || user.display_name === '花友') {
    if (candidateName) {
      await usersCol.doc(user._id).update({
        display_name: candidateName,
        update_time: Date.now()
      });
      user.display_name = candidateName;
    }
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
    if (!item || !item.plant_id) return;
    // 商店“已种下”只认明确处于已种状态的记录，避免历史脏数据误判
    if (item.is_planted === true) {
      userPlantByPlantId[item.plant_id] = item;
    }
  });
  const today = new Date().toISOString().slice(0, 10);

  const actionCountByPlantId = {};
  const actionCounterTemplate = { water: 0, fertilize: 0, weed: 0, prune: 0, share: 0 };
  const todayActionRes = await actionsCol.where({
    uid,
    action_date: today
  }).get();
  (todayActionRes.data || []).forEach((item) => {
    const actionType = item.action_type;
    const userPlantId = item.user_plant_id;
    if (!userPlantId || !Object.prototype.hasOwnProperty.call(actionCounterTemplate, actionType)) {
      return;
    }
    if (!actionCountByPlantId[userPlantId]) {
      actionCountByPlantId[userPlantId] = { water: 0, fertilize: 0, weed: 0, prune: 0, share: 0 };
    }
    actionCountByPlantId[userPlantId][actionType] += 1;
  });

  const flowers = userPlants.map((userPlantItem) => {
    const plant = plantsById[userPlantItem.plant_id] || {};
    const waterLevel = Math.max(0, Math.min(100, Number(userPlantItem.water_level)));
    const fertilizerLevel = Math.max(0, Math.min(100, Number(userPlantItem.fertilizer_level)));
    const healthScore = Math.max(0, Math.min(100, Number(userPlantItem.health_score)));
    return {
      user_plant_id: userPlantItem._id,
      plant_id: plant._id || userPlantItem.plant_id,
      code: plant.code || '',
      name: plant.name || '未知花种',
      description: plant.description || '',
      growth_value: userPlantItem.growth_value || 0,
      stage: userPlantItem.stage || 'seed',
      stage_label: resolveStageLabel(plant.stage_rules, userPlantItem.growth_value || 0),
      water_level: Number.isFinite(waterLevel) ? waterLevel : 60,
      fertilizer_level: Number.isFinite(fertilizerLevel) ? fertilizerLevel : 60,
      health_score: Number.isFinite(healthScore) ? healthScore : 100,
      growth_per_action: {
        water: Number(((plant.growth_per_action || {}).water)) || 1,
        fertilize: Number(((plant.growth_per_action || {}).fertilize)) || 2,
        weed: Number(((plant.growth_per_action || {}).weed)) || 1,
        prune: Number(((plant.growth_per_action || {}).prune)) || 1,
        share: Number(((plant.growth_per_action || {}).share)) || 2
      },
      exchange_status: userPlantItem.exchange_status || 'none',
      exchange_order_id: userPlantItem.exchange_order_id || '',
      daily_action_limit: plant.daily_action_limit || { water: 1, fertilize: 1, weed: 1, prune: 1, share: 1 },
      today_action_count: actionCountByPlantId[userPlantItem._id] || { water: 0, fertilize: 0, weed: 0, prune: 0, share: 0 }
    };
  });
  const currentFlower = currentUserPlant
    ? flowers.find((item) => item.user_plant_id === currentUserPlant._id) || flowers[0]
    : null;
  const seedCatalog = enabledPlants.map((plant) => {
    const userPlant = userPlantByPlantId[plant._id];
    const price = Math.max(0, Math.floor(Number(plant.price) || 0));
    return {
      plant_id: plant._id,
      code: plant.code || '',
      name: plant.name || '未知花种',
      description: plant.description || '',
      price,
      unlock_level: getUnlockLevelByPrice(price),
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
