"use strict";
const common_vendor = require("../../common/vendor.js");
const common_auth = require("../../common/auth.js");
const _sfc_main = {
  data() {
    return {
      page: 1,
      pageSize: 10,
      total: 0,
      list: [],
      loading: false
    };
  },
  onLoad() {
    this.fetchList(true);
  },
  methods: {
    async fetchList(reset) {
      if (this.loading)
        return;
      if (!common_auth.hasLogin()) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return;
      }
      this.loading = true;
      try {
        const targetPage = reset ? 1 : this.page;
        const { result } = await common_vendor.nr.callFunction({
          name: "plant_timeline",
          data: {
            ...common_auth.getAuthPayload(),
            page: targetPage,
            pageSize: this.pageSize
          }
        });
        if (result.code !== 0) {
          common_vendor.index.showToast({ title: result.msg || "加载失败", icon: "none" });
          return;
        }
        const payload = result.data || {};
        const incoming = payload.list || [];
        this.total = (payload.pagination || {}).total || 0;
        this.list = reset ? incoming : this.list.concat(incoming);
        this.page = targetPage + 1;
      } catch (error) {
        common_vendor.index.showToast({ title: "网络异常，请重试", icon: "none" });
      } finally {
        this.loading = false;
      }
    },
    loadMore() {
      this.fetchList(false);
    }
  },
  computed: {
    hasMore() {
      return this.list.length < this.total;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.list.length === 0
  }, $data.list.length === 0 ? {} : {}, {
    b: common_vendor.f($data.list, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.action_label),
        b: common_vendor.t(item.growth_delta),
        c: common_vendor.t(item.action_date),
        d: item._id
      };
    }),
    c: $options.hasMore
  }, $options.hasMore ? {
    d: common_vendor.o((...args) => $options.loadMore && $options.loadMore(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/timeline.js.map
