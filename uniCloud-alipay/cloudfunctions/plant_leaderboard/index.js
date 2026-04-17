'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const usersCol = db.collection('pf_users');
const uniID = require('uni-id');
const { getLevelInfoByGrowth } = require('plant-level');

async function getUid(event, context) {
  if (event && event.uniIdToken) {
    const payload = await uniID.checkToken(event.uniIdToken);
    if (!payload.code && payload.uid) return payload.uid;
  }
  return (event && event.uid) || (context && context.auth && context.auth.uid) || '';
}

exports.main = async (event, context) => {
  const uid = await getUid(event, context);
  const limit = Math.min(Math.max(Number(event.limit) || 50, 1), 100);

  const listRes = await usersCol
    .orderBy('total_growth', 'desc')
    .orderBy('create_time', 'asc')
    .limit(limit)
    .get();

  const rows = listRes.data || [];
  const list = rows.map((item, index) => ({
    rank: index + 1,
    display_name: item.display_name || '花友',
    total_growth: item.total_growth || 0,
    user_level: getLevelInfoByGrowth(item.total_growth || 0).user_level,
    is_me: uid ? item.uid === uid : false
  }));

  let my_rank = null;
  let my_total_growth = 0;
  let my_display_name = '花友';
  let my_level = 1;

  if (uid) {
    const mineRes = await usersCol.where({ uid }).limit(1).get();
    const mine = mineRes.data[0];
    if (mine) {
      my_total_growth = mine.total_growth || 0;
      my_display_name = mine.display_name || '花友';
      my_level = getLevelInfoByGrowth(my_total_growth).user_level;
      const higherRes = await usersCol
        .where({
          total_growth: dbCmd.gt(my_total_growth)
        })
        .count();
      my_rank = (higherRes.total || 0) + 1;
    }
  }

  return {
    code: 0,
    msg: 'ok',
    data: {
      list,
      my_rank,
      my_total_growth,
      my_display_name,
      my_level
    }
  };
};
