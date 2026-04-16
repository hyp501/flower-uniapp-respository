"use strict";
const common_vendor = require("../../common/vendor.js");
const common_plantConfig = require("../../common/plant-config.js");
const common_auth = require("../../common/auth.js");
const DEFAULT_FLOWER_IMAGE = "/static/flowers/default.svg";
const FLOWER_IMAGE_MAP = {
  "rose-basic": {
    seed: "/static/flowers/rose-seed.svg",
    sprout: "/static/flowers/rose-sprout.svg",
    bloom: "/static/flowers/rose.svg"
  },
  "sunflower-basic": {
    seed: "/static/flowers/sunflower-seed.svg",
    sprout: "/static/flowers/sunflower-sprout.svg",
    bloom: "/static/flowers/sunflower.svg"
  },
  "lily-basic": {
    seed: "/static/flowers/lily-seed.svg",
    sprout: "/static/flowers/lily-sprout.svg",
    bloom: "/static/flowers/lily.svg"
  }
};
const _sfc_main = {
  data() {
    return {
      loading: false,
      actions: common_plantConfig.ACTIONS,
      user: {},
      garden: {
        current_user_plant_id: "",
        total_flowers: 0,
        flowers: []
      },
      plant: {
        growth_per_action: {},
        daily_action_limit: {},
        today_action_count: {}
      },
      heroPulse: false,
      showFloatScore: false,
      floatScore: 0,
      showStageUp: false
    };
  },
  onShow() {
    this.loadProfile();
  },
  methods: {
    async loadProfile() {
      if (!common_auth.hasLogin()) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return;
      }
      this.loading = true;
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
        this.garden = result.data.garden || {
          current_user_plant_id: "",
          total_flowers: 0,
          flowers: []
        };
        this.plant = result.data.plant || {};
        if (!this.plant.user_plant_id && this.garden.flowers.length > 0) {
          this.plant = this.garden.flowers[0];
          this.garden.current_user_plant_id = this.plant.user_plant_id;
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "网络异常，请重试", icon: "none" });
      } finally {
        this.loading = false;
      }
    },
    async doAction(actionType) {
      if (!common_auth.hasLogin()) {
        common_vendor.index.showToast({ title: "请先登录", icon: "none" });
        return;
      }
      this.loading = true;
      try {
        const { result } = await common_vendor.nr.callFunction({
          name: "plant_action",
          data: {
            ...common_auth.getAuthPayload(),
            action_type: actionType,
            user_plant_id: this.plant.user_plant_id,
            request_id: String(Date.now())
          }
        });
        if (result.code !== 0) {
          common_vendor.index.showToast({ title: result.msg || "操作失败", icon: "none" });
          return;
        }
        const prevStage = this.plant.stage || "seed";
        const growthDelta = common_plantConfig.safeNumber(result.data && result.data.growth_delta, 0);
        this.playEnergyAnimation(growthDelta);
        if (result.data && result.data.stage && result.data.stage !== prevStage) {
          this.playStageUpAnimation();
        }
        common_vendor.index.showToast({
          title: `+${growthDelta}成长值`,
          icon: "none"
        });
        await this.loadProfile();
      } catch (error) {
        common_vendor.index.showToast({ title: "网络异常，请重试", icon: "none" });
      } finally {
        this.loading = false;
      }
    },
    getActionLimit(actionType) {
      return common_plantConfig.safeNumber((this.plant.daily_action_limit || {})[actionType], 1);
    },
    getTodayCount(actionType) {
      return common_plantConfig.safeNumber((this.plant.today_action_count || {})[actionType], 0);
    },
    isActionDisabled(actionType) {
      return this.getTodayCount(actionType) >= this.getActionLimit(actionType);
    },
    onActionTap(actionType) {
      if (this.loading || this.isActionDisabled(actionType))
        return;
      this.doAction(actionType);
    },
    onSelectFlower(userPlantId) {
      if (!userPlantId || userPlantId === this.garden.current_user_plant_id)
        return;
      const target = this.garden.flowers.find((item) => item.user_plant_id === userPlantId);
      if (!target)
        return;
      this.garden.current_user_plant_id = userPlantId;
      this.plant = target;
    },
    isCurrentFlower(userPlantId) {
      return this.garden.current_user_plant_id === userPlantId;
    },
    getFlowerImage(flower) {
      const code = flower && flower.code || "";
      const stage = flower && flower.stage || "seed";
      const stageMap = FLOWER_IMAGE_MAP[code];
      if (!stageMap)
        return DEFAULT_FLOWER_IMAGE;
      return stageMap[stage] || stageMap.bloom || DEFAULT_FLOWER_IMAGE;
    },
    getActionIcon(actionType) {
      const map = { water: "💧", fertilize: "🧪", weed: "🌿" };
      return map[actionType] || "⭐";
    },
    getActionScore(actionType) {
      return common_plantConfig.safeNumber((this.plant.growth_per_action || {})[actionType], 1);
    },
    playEnergyAnimation(growthDelta) {
      this.floatScore = growthDelta;
      this.showFloatScore = true;
      this.heroPulse = true;
      setTimeout(() => {
        this.showFloatScore = false;
      }, 900);
      setTimeout(() => {
        this.heroPulse = false;
      }, 520);
    },
    playStageUpAnimation() {
      this.showStageUp = true;
      this.heroPulse = true;
      setTimeout(() => {
        this.showStageUp = false;
      }, 1200);
      setTimeout(() => {
        this.heroPulse = false;
      }, 700);
    },
    getGrowthPercent() {
      const value = common_plantConfig.safeNumber(this.plant.growth_value, 0);
      const percent = Math.round(value / 18 * 100);
      if (percent < 8)
        return 8;
      if (percent > 100)
        return 100;
      return percent;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.plant.stage_label || "待成长"),
    b: $data.heroPulse ? 1 : "",
    c: $options.getFlowerImage($data.plant),
    d: $data.heroPulse ? 1 : "",
    e: $data.showFloatScore
  }, $data.showFloatScore ? {
    f: common_vendor.t($data.floatScore)
  } : {}, {
    g: $data.showStageUp
  }, $data.showStageUp ? {} : {}, {
    h: common_vendor.t($data.plant.name || "未命名花种"),
    i: common_vendor.t($data.plant.description || "快来照料你的花花吧"),
    j: common_vendor.t($data.plant.growth_value || 0),
    k: $options.getGrowthPercent() + "%",
    l: common_vendor.t($data.user.total_actions || 0),
    m: common_vendor.t($data.user.total_growth || 0),
    n: common_vendor.t($data.garden.total_flowers || 0),
    o: common_vendor.f($data.garden.flowers, (flower, k0, i0) => {
      return {
        a: $options.getFlowerImage(flower),
        b: common_vendor.t(flower.name),
        c: common_vendor.t(flower.stage_label),
        d: common_vendor.t(flower.growth_value || 0),
        e: flower.user_plant_id,
        f: $options.isCurrentFlower(flower.user_plant_id) ? 1 : "",
        g: common_vendor.o(($event) => $options.onSelectFlower(flower.user_plant_id), flower.user_plant_id)
      };
    }),
    p: common_vendor.f($data.actions, (item, k0, i0) => {
      return {
        a: common_vendor.t($options.getActionIcon(item.key)),
        b: common_vendor.t(item.label),
        c: common_vendor.t($options.getActionScore(item.key)),
        d: common_vendor.t($options.getTodayCount(item.key)),
        e: common_vendor.t($options.getActionLimit(item.key)),
        f: item.key,
        g: $data.loading || $options.isActionDisabled(item.key) ? 1 : "",
        h: common_vendor.o(($event) => $options.onActionTap(item.key), item.key)
      };
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/home/index.js.map
