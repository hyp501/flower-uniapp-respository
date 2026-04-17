const LEVEL_THRESHOLDS = [0, 80, 180, 320, 520, 800, 1180, 1680];

function toGrowth(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

function getLevelByGrowth(totalGrowth) {
  const growth = toGrowth(totalGrowth);
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (growth >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

function getLevelProgress(totalGrowth) {
  const growth = toGrowth(totalGrowth);
  const level = getLevelByGrowth(growth);
  const isMaxLevel = level >= LEVEL_THRESHOLDS.length;
  if (isMaxLevel) return 100;
  const currentLevelThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextLevelThreshold = LEVEL_THRESHOLDS[level];
  const range = nextLevelThreshold - currentLevelThreshold;
  if (range <= 0) return 0;
  const ratio = (growth - currentLevelThreshold) / range;
  const percent = Math.floor(ratio * 100);
  return Math.max(0, Math.min(99, percent));
}

function getNextLevelNeed(totalGrowth) {
  const growth = toGrowth(totalGrowth);
  const level = getLevelByGrowth(growth);
  if (level >= LEVEL_THRESHOLDS.length) return 0;
  return Math.max(0, LEVEL_THRESHOLDS[level] - growth);
}

function getLevelInfoByGrowth(totalGrowth) {
  const growth = toGrowth(totalGrowth);
  const userLevel = getLevelByGrowth(growth);
  const maxLevel = LEVEL_THRESHOLDS.length;
  return {
    user_level: userLevel,
    level_progress: getLevelProgress(growth),
    next_level_need: getNextLevelNeed(growth),
    is_max_level: userLevel >= maxLevel,
    max_level: maxLevel
  };
}

module.exports = {
  LEVEL_THRESHOLDS,
  getLevelByGrowth,
  getLevelProgress,
  getNextLevelNeed,
  getLevelInfoByGrowth
};
