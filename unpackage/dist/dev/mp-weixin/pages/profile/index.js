"use strict";
const common_vendor = require("../../common/vendor.js");
const common_auth = require("../../common/auth.js");
const _sfc_main = {
  data() {
    return {
      user: {},
      plant: {}
    };
  },
  onShow() {
    this.loadProfile();
  },
  methods: {
    async loadProfile() {
      if (!common_auth.hasLogin()) {
        this.user = {};
        this.plant = {};
        return;
      }
      try {
        const { result } = await common_vendor.nr.callFunction({
          name: "plant_profile",
          data: {
            ...common_auth.getAuthPayload()
          }
        });
        if (result.code !== 0) {
          common_vendor.index.showToast({ title: result.msg || "加载失败", icon: "none" });
          return;
        }
        this.user = result.data.user || {};
        this.plant = result.data.plant || {};
      } catch (error) {
        common_vendor.index.showToast({ title: "网络异常，请重试", icon: "none" });
      }
    },
    goRanking() {
      common_vendor.index.navigateTo({
        url: "/pages/profile/ranking"
      });
    },
    goTimeline() {
      common_vendor.index.navigateTo({
        url: "/pages/profile/timeline"
      });
    },
    goLogin() {
      common_vendor.index.navigateTo({
        url: "/uni_modules/uni-id-pages/pages/login/login-withoutpwd"
      });
    },
    goRules() {
      common_vendor.index.navigateTo({
        url: "/pages/profile/rules"
      });
    },
    getAvatarText() {
      const name = this.user.display_name || "花友";
      return name.slice(0, 1);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.t($options.getAvatarText()),
    b: common_vendor.t($data.user.display_name || "花友"),
    c: common_vendor.t($data.plant.stage_label || "成长中"),
    d: common_vendor.t($data.user.total_growth || 0),
    e: common_vendor.t($data.user.total_actions || 0),
    f: common_vendor.t($data.plant.stage_label || "--"),
    g: common_vendor.o((...args) => $options.goRanking && $options.goRanking(...args)),
    h: common_vendor.o((...args) => $options.goTimeline && $options.goTimeline(...args)),
    i: common_vendor.o((...args) => $options.goRules && $options.goRules(...args)),
    j: common_vendor.o((...args) => $options.goLogin && $options.goLogin(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/index.js.map
