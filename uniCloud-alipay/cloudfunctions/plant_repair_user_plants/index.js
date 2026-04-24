'use strict';

const db = uniCloud.database();
const usersCol = db.collection('pf_users');
const userPlantsCol = db.collection('pf_user_plants');
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

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

exports.main = async (event, context) => {
  const uid = await getUid(event, context);
  const dryRun = event && event.dry_run !== false;
  const confirm = !!(event && event.confirm);

  if (!uid) {
    return { code: 401, msg: '请先登录' };
  }
  if (!dryRun && !confirm) {
    return { code: 400, msg: '执行写入修复必须传 confirm=true' };
  }

  const userRes = await usersCol.where({ uid }).limit(1).get();
  const user = (userRes.data || [])[0];
  if (!user) {
    return { code: 404, msg: '用户不存在，请先进入首页初始化' };
  }

  const plantRes = await userPlantsCol.where({ uid }).get();
  const allPlants = plantRes.data || [];
  const plantMap = {};
  allPlants.forEach((item) => {
    if (item && item._id) plantMap[item._id] = item;
  });

  const patches = [];
  const currentId = user.current_user_plant_id || '';
  let currentExists = !!(currentId && plantMap[currentId]);

  allPlants.forEach((item) => {
    if (!item || !item._id) return;
    const patch = {};
    const hasIsPlanted = typeof item.is_planted === 'boolean';
    if (!hasIsPlanted) {
      patch.is_planted = item._id === currentId;
    }
    if (!isFiniteNumber(item.water_level)) patch.water_level = 60;
    if (!isFiniteNumber(item.fertilizer_level)) patch.fertilizer_level = 60;
    if (!isFiniteNumber(item.health_score)) patch.health_score = 100;
    if (Object.keys(patch).length > 0) {
      patches.push({ _id: item._id, patch });
    }
  });

  const virtualPlants = allPlants.map((item) => {
    const found = patches.find((p) => p._id === item._id);
    if (!found) return item;
    return { ...item, ...found.patch };
  });

  if (currentExists) {
    const currentPlant = virtualPlants.find((item) => item._id === currentId);
    if (currentPlant && currentPlant.is_planted !== true) {
      patches.push({
        _id: currentPlant._id,
        patch: {
          is_planted: true
        }
      });
    }
  }

  const plantedPlants = virtualPlants.filter((item) => item && item.is_planted === true);
  let nextCurrentId = currentId;
  if (!currentExists) {
    nextCurrentId = plantedPlants[0] ? plantedPlants[0]._id : '';
  } else {
    const matched = virtualPlants.find((item) => item && item._id === currentId && item.is_planted === true);
    if (!matched) {
      nextCurrentId = plantedPlants[0] ? plantedPlants[0]._id : '';
    }
  }

  const needUserPatch = (user.current_user_plant_id || '') !== nextCurrentId;
  const now = Date.now();
  const patchPreview = patches.map((item) => ({
    user_plant_id: item._id,
    patch: item.patch
  }));

  if (!dryRun) {
    for (const item of patches) {
      await userPlantsCol.doc(item._id).update({
        ...item.patch,
        update_time: now
      });
    }
    if (needUserPatch) {
      await usersCol.doc(user._id).update({
        current_user_plant_id: nextCurrentId,
        update_time: now
      });
    }
  }

  return {
    code: 0,
    msg: dryRun ? '修复预览完成' : '修复完成',
    data: {
      uid,
      dry_run: dryRun,
      touched_user_plants: patchPreview.length,
      touched_user: needUserPatch,
      current_user_plant_id_before: user.current_user_plant_id || '',
      current_user_plant_id_after: nextCurrentId,
      user_plant_patches: patchPreview
    }
  };
};
