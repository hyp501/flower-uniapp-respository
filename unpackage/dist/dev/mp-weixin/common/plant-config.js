"use strict";
const ACTIONS = [
  { key: "water", label: "浇水" },
  { key: "fertilize", label: "施肥" },
  { key: "weed", label: "除草" }
];
function safeNumber(value, defaultValue = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
}
exports.ACTIONS = ACTIONS;
exports.safeNumber = safeNumber;
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/plant-config.js.map
