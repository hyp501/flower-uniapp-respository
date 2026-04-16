"use strict";
const common_vendor = require("./vendor.js");
function getAuthPayload() {
  const token = common_vendor.index.getStorageSync("uni_id_token") || "";
  const current = common_vendor.nr.getCurrentUserInfo ? common_vendor.nr.getCurrentUserInfo() : {};
  const uid = current && current.uid ? current.uid : "";
  return {
    uniIdToken: token,
    uid
  };
}
function hasLogin() {
  const current = common_vendor.nr.getCurrentUserInfo ? common_vendor.nr.getCurrentUserInfo() : {};
  return !!(current && current.uid);
}
exports.getAuthPayload = getAuthPayload;
exports.hasLogin = hasLogin;
//# sourceMappingURL=../../.sourcemap/mp-weixin/common/auth.js.map
