"use strict";
const common_vendor = require("../../common/vendor.js");
const common_auth = require("../../common/auth.js");
const _sfc_main = {
  data() {
    return {
      loading: false,
      list: [],
      my_rank: null,
      my_total_growth: 0,
      my_display_name: "花友"
    };
  },
  onShow() {
    this.loadBoard();
  },
  onPullDownRefresh() {
    this.loadBoard().finally(() => {
      common_vendor.index.stopPullDownRefresh();
    });
  },
  methods: {
    async loadBoard() {
      this.loading = true;
      try {
        const payload = common_auth.hasLogin() ? common_auth.getAuthPayload() : {};
        const { result } = await common_vendor.nr.callFunction({
          name: "plant_leaderboard",
          data: {
            ...payload,
            limit: 50
          }
        });
        if (result.code !== 0) {
          common_vendor.index.showToast({ title: result.msg || "加载失败", icon: "none" });
          return;
        }
        const d = result.data || {};
        this.list = d.list || [];
        this.my_rank = typeof d.my_rank === "number" ? d.my_rank : null;
        this.my_total_growth = d.my_total_growth || 0;
        this.my_display_name = d.my_display_name || "花友";
      } catch (e) {
        common_vendor.index.showToast({ title: "网络异常，请重试", icon: "none" });
      } finally {
        this.loading = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.my_rank !== null
  }, $data.my_rank !== null ? {
    b: common_vendor.t($data.my_rank),
    c: common_vendor.t($data.my_display_name),
    d: common_vendor.t($data.my_total_growth)
  } : {}, {
    e: common_vendor.t($data.list.length),
    f: $data.loading
  }, $data.loading ? {} : !$data.list.length ? {} : {
    h: common_vendor.f($data.list, (item, k0, i0) => {
      return common_vendor.e({
        a: item.rank === 1
      }, item.rank === 1 ? {} : item.rank === 2 ? {} : item.rank === 3 ? {} : {
        d: common_vendor.t(item.rank)
      }, {
        b: item.rank === 2,
        c: item.rank === 3,
        e: common_vendor.t(item.display_name),
        f: common_vendor.t(item.total_growth),
        g: item.rank + "-" + item.display_name,
        h: item.is_me ? 1 : "",
        i: item.rank <= 3 ? 1 : ""
      });
    })
  }, {
    g: !$data.list.length
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/ranking.js.map
