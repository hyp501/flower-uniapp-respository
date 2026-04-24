<template>
  <view class="page">
    <view class="hero-header">
      <view class="hero-row">
        <view class="profile-pill">
          <view class="avatar">
            <view class="avatar-inner">{{ displayName.slice(0, 1) }}</view>
          </view>
          <view class="profile-text">
            <view class="profile-name">{{ displayName }}</view>
            <view class="profile-level">园丁 Lv.{{ levelText }}</view>
          </view>
        </view>
        <view class="weather-pill">
          <view class="weather-icon">
            <view class="sun-core"></view>
            <view class="sun-ring"></view>
          </view>
          <text class="weather-text">{{ weatherText }}</text>
        </view>
      </view>

      <view class="stats-card">
        <view class="stats-col">
          <view class="stats-label">花朵积分</view>
          <view class="stats-value">{{ user.total_growth || 0 }}</view>
        </view>
        <view class="stats-divider"></view>
        <view class="stats-col">
          <view class="stats-label">种植数</view>
          <view class="stats-value">{{ garden.total_flowers || 0 }} 株</view>
        </view>
        <view class="stats-divider"></view>
        <view class="stats-col">
          <view class="stats-label">排名</view>
          <view class="stats-value">#{{ rankText }}</view>
        </view>
      </view>

      <view v-if="remindText" class="notice-bubble" @click="onActionTap('water')">
        <text class="notice-dot"></text>
        <text>{{ remindText }}</text>
      </view>
    </view>

    <view class="garden-stage">
      <view class="ground-hill"></view>
      <view class="plot">
        <view v-if="displayFlowers.length === 0" class="empty-garden">
          <view class="empty-title">花园空空的</view>
          <view class="empty-desc">还没有种下花朵，去种子商店选一颗开始种植吧</view>
          <view class="empty-btn" @click="goSeedShop">去选花种</view>
        </view>
        <view
          v-else
          v-for="(flower, index) in displayFlowers"
          :key="flower.user_plant_id || index"
          class="flower-point"
          :class="{ active: isHoveredFlower(flower.user_plant_id), pulse: heroPulse && isPulseFlower(flower.user_plant_id) }"
          :style="{ left: getFlowerLeft(index, displayFlowers.length) }"
          @mouseenter="onFlowerEnter(flower.user_plant_id)"
          @mouseleave="onFlowerLeave"
          @touchstart="onFlowerEnter(flower.user_plant_id)"
          @touchend="onFlowerLeave"
          @click="onSelectFlower(flower.user_plant_id)"
        >
          <image class="flower-image" :src="getFlowerImage(flower)" mode="aspectFit"></image>
          <view class="flower-name">{{ flower.name || '未命名' }}</view>
        </view>
      </view>
      <view v-if="showFloatScore" class="float-score">+{{ floatScore }}</view>
      <view v-if="showStageUp" class="stage-up-tip">升级啦！</view>
    </view>

    <bottom-menu
      active-key="home"
      :show-center-action="true"
      :center-disabled="loading || !plant.user_plant_id || isActionDisabled('water')"
      @centerTap="onWaterTap"
    />
  </view>
</template>

<script>
import { ACTIONS, safeNumber } from '@/common/plant-config.js';
import { getAuthPayload, hasLogin } from '@/common/auth.js';
import BottomMenu from '@/components/bottom-menu/index.vue';

const DEFAULT_FLOWER_IMAGE = '/static/flowers/default.svg';
const FLOWER_IMAGE_MAP = {
  'rose-basic': {
    seed: '/static/flowers/rose-seed.svg',
    sprout: '/static/flowers/rose-sprout.svg',
    bloom: '/static/flowers/rose.svg'
  },
  'sunflower-basic': {
    seed: '/static/flowers/sunflower-seed.svg',
    sprout: '/static/flowers/sunflower-sprout.svg',
    bloom: '/static/flowers/sunflower.svg'
  },
  'lily-basic': {
    seed: '/static/flowers/lily-seed.svg',
    sprout: '/static/flowers/lily-sprout.svg',
    bloom: '/static/flowers/lily.svg'
  }
};

export default {
  components: {
    BottomMenu
  },
  data() {
    return {
      loading: false,
      actions: ACTIONS,
      weatherText: '晴天 26°',
      user: {},
      garden: {
        current_user_plant_id: '',
        total_flowers: 0,
        flowers: []
      },
      plant: {
        growth_per_action: {},
        daily_action_limit: {},
        today_action_count: {}
      },
      heroPulse: false,
      hoveredFlowerId: '',
      showFloatScore: false,
      floatScore: 0,
      showStageUp: false
    };
  },
  computed: {
    displayName() {
      return this.user.display_name || this.user.nickname || this.user.username || '芸萍的花园';
    },
    levelText() {
      const totalGrowth = safeNumber(this.user.total_growth, 0);
      return Math.max(1, Math.floor(totalGrowth / 120) + 1);
    },
    rankText() {
      const rank = safeNumber(this.user.rank, 0);
      return rank > 0 ? rank : 47;
    },
    displayFlowers() {
      return (this.garden.flowers || []).filter((item) => {
        if (!item || !item.user_plant_id) return false;
        const name = String(item.name || '').trim();
        if (!name) return false;
        if (name === '未命名' || name === '未知花种') return false;
        return true;
      });
    },
    remindText() {
      if (!this.plant.user_plant_id) return '';
      if (this.isActionDisabled('water')) return `${this.plant.name || '花朵'}今天已喝饱啦`;
      return `${this.plant.name || '花朵'}需要浇水了！`;
    }
  },
  onShow() {
    if (!hasLogin()) {
      uni.reLaunch({ url: '/pages/auth/login' });
      return;
    }
    this.safeHideTabBar();
    this.loadProfile();
  },
  onHide() {
    this.safeShowTabBar();
  },
  onUnload() {
    this.safeShowTabBar();
  },
  methods: {
    safeHideTabBar() {
      uni.hideTabBar({
        fail: () => {}
      });
    },
    safeShowTabBar() {
      uni.showTabBar({
        fail: () => {}
      });
    },
    async loadProfile() {
      if (!hasLogin()) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      this.loading = true;
      try {
        const { result } = await uniCloud.callFunction({
          name: 'plant_profile',
          data: {
            ...getAuthPayload()
          }
        });
        if (result.code !== 0) {
          uni.showToast({ title: result.msg || '加载失败', icon: 'none' });
          return;
        }
        this.user = result.data.user || {};
        this.garden = result.data.garden || {
          current_user_plant_id: '',
          total_flowers: 0,
          flowers: []
        };
        this.plant = result.data.plant || {};
        const visibleFlowers = (this.garden.flowers || []).filter((item) => {
          if (!item || !item.user_plant_id) return false;
          const name = String(item.name || '').trim();
          if (!name) return false;
          return name !== '未命名' && name !== '未知花种';
        });
        if (!this.plant.user_plant_id && visibleFlowers.length > 0) {
          this.plant = visibleFlowers[0];
          this.garden.current_user_plant_id = this.plant.user_plant_id;
        }
      } catch (error) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    async doAction(actionType) {
      if (!hasLogin()) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      this.loading = true;
      try {
        const { result } = await uniCloud.callFunction({
          name: 'plant_action',
          data: {
            ...getAuthPayload(),
            action_type: actionType,
            user_plant_id: this.plant.user_plant_id,
            request_id: String(Date.now())
          }
        });
        if (result.code !== 0) {
          uni.showToast({ title: result.msg || '操作失败', icon: 'none' });
          return;
        }
        const isIdempotent = !!(result.data && result.data.idempotent);
        const growthDelta = safeNumber(result.data && result.data.growth_delta, 0);
        if (isIdempotent || growthDelta <= 0) {
          const nextCount = this.getActionLimit(actionType);
          this.plant = {
            ...this.plant,
            today_action_count: {
              ...(this.plant.today_action_count || {}),
              [actionType]: nextCount
            }
          };
          uni.showToast({ title: '今日次数已达上限', icon: 'none' });
          return;
        }
        const prevStage = this.plant.stage || 'seed';
        const nextCount = this.getTodayCount(actionType) + 1;
        this.plant = {
          ...this.plant,
          growth_value: safeNumber(this.plant.growth_value, 0) + growthDelta,
          stage: (result.data && result.data.stage) || this.plant.stage,
          stage_label: (result.data && result.data.stage_label) || this.plant.stage_label,
          water_level: result.data && typeof result.data.water_level === 'number' ? result.data.water_level : this.plant.water_level,
          fertilizer_level: result.data && typeof result.data.fertilizer_level === 'number' ? result.data.fertilizer_level : this.plant.fertilizer_level,
          health_score: result.data && typeof result.data.health_score === 'number' ? result.data.health_score : this.plant.health_score,
          today_action_count: {
            ...(this.plant.today_action_count || {}),
            [actionType]: nextCount
          }
        };
        this.user = {
          ...this.user,
          total_growth: safeNumber(this.user.total_growth, 0) + growthDelta
        };
        this.playEnergyAnimation(growthDelta);
        if (result.data && result.data.stage && result.data.stage !== prevStage) {
          this.playStageUpAnimation();
        }
        uni.showToast({
          title: `+${growthDelta}成长值`,
          icon: 'none'
        });
        await this.loadProfile();
      } catch (error) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    getActionLimit(actionType) {
      return safeNumber((this.plant.daily_action_limit || {})[actionType], 1);
    },
    getTodayCount(actionType) {
      return safeNumber((this.plant.today_action_count || {})[actionType], 0);
    },
    isActionDisabled(actionType) {
      return this.getTodayCount(actionType) >= this.getActionLimit(actionType);
    },
    onActionTap(actionType) {
      if (this.loading || this.isActionDisabled(actionType)) return;
      this.doAction(actionType);
    },
    onWaterTap() {
      if (!this.plant.user_plant_id) {
        uni.showToast({ title: '先去种子商店选一颗花种', icon: 'none' });
        return;
      }
      this.onActionTap('water');
    },
    getFlowerLeft(index, total) {
      if (!total) return '50%';
      if (total === 1) return '50%';
      const start = 14;
      const end = 86;
      const step = (end - start) / (total - 1);
      return `${Math.round(start + step * index)}%`;
    },
    goSeedShop() {
      uni.navigateTo({ url: '/pages/flower/seed-shop' });
    },
    onSelectFlower(userPlantId) {
      if (!userPlantId) return;
      uni.navigateTo({
        url: `/pages/flower/care?user_plant_id=${userPlantId}`
      });
    },
    onFlowerEnter(userPlantId) {
      this.hoveredFlowerId = userPlantId || '';
    },
    onFlowerLeave() {
      this.hoveredFlowerId = '';
    },
    isHoveredFlower(userPlantId) {
      return !!userPlantId && this.hoveredFlowerId === userPlantId;
    },
    isPulseFlower(userPlantId) {
      if (!userPlantId || !this.plant.user_plant_id) return false;
      return this.plant.user_plant_id === userPlantId;
    },
    getFlowerImage(flower) {
      const code = (flower && flower.code) || '';
      const stage = (flower && flower.stage) || 'seed';
      const stageMap = FLOWER_IMAGE_MAP[code];
      if (!stageMap) return DEFAULT_FLOWER_IMAGE;
      return stageMap[stage] || stageMap.bloom || DEFAULT_FLOWER_IMAGE;
    },
    getActionIcon(actionType) {
      const map = { water: '💧', fertilize: '🧪', weed: '🌿' };
      return map[actionType] || '⭐';
    },
    getActionScore(actionType) {
      return safeNumber((this.plant.growth_per_action || {})[actionType], 1);
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
      const value = safeNumber(this.plant.growth_value, 0);
      const percent = Math.round((value / 18) * 100);
      if (percent < 8) return 8;
      if (percent > 100) return 100;
      return percent;
    }
  }
};
</script>

<style>
.page {
  min-height: calc(100vh - 88rpx);
  position: relative;
  background: linear-gradient(180deg, #76c6ef 0%, #abd8f2 34%, #c4e4bb 62%, #8eb257 100%);
  padding: 30rpx 24rpx 246rpx;
  box-sizing: border-box;
}

.hero-header {
  position: relative;
  z-index: 3;
}

.hero-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8rpx;
}

.profile-pill,
.weather-pill {
  background: rgba(255, 255, 255, 0.84);
  border-radius: 999rpx;
  box-shadow: 0 8rpx 24rpx rgba(55, 99, 130, 0.16);
}

.profile-pill {
  display: flex;
  align-items: center;
  padding: 10rpx 22rpx 10rpx 10rpx;
}

.avatar {
  width: 62rpx;
  height: 62rpx;
  border-radius: 50%;
  background: linear-gradient(180deg, #f8f6ff 0%, #ecebfd 100%);
  margin-right: 14rpx;
  padding: 4rpx;
  box-sizing: border-box;
}

.avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(180deg, #ffd4a3 0%, #ffbe88 100%);
  color: #7a4e2d;
  text-align: center;
  line-height: 54rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.profile-name {
  font-size: 32rpx;
  color: #3f4d52;
  font-weight: 700;
}

.profile-level {
  margin-top: 4rpx;
  font-size: 21rpx;
  color: #5f8f57;
}

.profile-level::before {
  content: '';
  display: inline-block;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #69b85a;
  margin-right: 8rpx;
  vertical-align: middle;
}

.weather-pill {
  padding: 12rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.weather-icon {
  width: 32rpx;
  height: 32rpx;
  position: relative;
  margin-right: 2rpx;
}

.sun-core {
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  background: #ffd35f;
  position: absolute;
  left: 5rpx;
  top: 5rpx;
}

.sun-ring {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(255, 211, 95, 0.45);
  box-sizing: border-box;
  position: absolute;
  left: 0;
  top: 0;
}

.weather-text {
  font-size: 27rpx;
  color: #566772;
}

.stats-card {
  margin-top: 18rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 12rpx;
  box-shadow: 0 8rpx 20rpx rgba(47, 94, 124, 0.16);
}

.stats-col {
  flex: 1;
  text-align: center;
}

.stats-card .stats-label {
  font-size: 23rpx;
  color: #66757b;
}

.stats-card .stats-value {
  margin-top: 6rpx;
  font-size: 44rpx;
  line-height: 1.05;
  font-weight: 700;
  color: #273a43;
}

.stats-divider {
  width: 2rpx;
  height: 68rpx;
  background: #e5edf0;
}

.notice-bubble {
  margin-top: 14rpx;
  margin-left: auto;
  width: fit-content;
  max-width: 78%;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #5b6170;
  font-size: 27rpx;
  padding: 10rpx 18rpx;
  box-shadow: 0 8rpx 20rpx rgba(59, 102, 132, 0.16);
  display: flex;
  align-items: center;
}

.notice-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #ff5f95;
  margin-right: 10rpx;
}

.garden-stage {
}

.garden-stage::before {
  content: '';
  position: absolute;
  bottom:0;
  right: 22rpx;
  width: 156rpx;
  height: 156rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 212, 104, 0.95) 18%, rgba(255, 255, 255, 0.2) 60%, rgba(255, 255, 255, 0) 78%);
  box-shadow: 0 0 46rpx rgba(255, 219, 128, 0.56);
}

.ground-hill {
  position: absolute;
  left: -44rpx;
  right: -44rpx;
  bottom: 0;
  height: 640rpx;
  border-top-left-radius: 20%;
  border-top-right-radius: 20%;
  background: linear-gradient(180deg, #8aca54 0%, #7f2b3a 100%);
}

.plot {
  position: absolute;
  left: 40rpx;
  right: 40rpx;
  bottom: 320rpx;
  height: 122rpx;
  border-radius: 26rpx;
  background: linear-gradient(180deg, #915c35 0%, #754625 100%);
  box-shadow: inset 0 -10rpx 0 #512f19, 0 8rpx 12rpx rgba(63, 38, 21, 0.2);
}

.empty-garden {
  height: 100%;
  padding: 16rpx 26rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.empty-title {
  color: #f4e9db;
  font-size: 30rpx;
  font-weight: 700;
}

.empty-desc {
  margin-top: 10rpx;
  color: rgba(255, 238, 218, 0.9);
  font-size: 22rpx;
  line-height: 1.45;
}

.empty-btn {
  margin-top: 14rpx;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: #f4d18d;
  color: #6f411d;
  font-size: 22rpx;
  font-weight: 700;
}

.flower-point {
  position: absolute;
  bottom: 76rpx;
  width: 106rpx;
  transform: translateX(-50%);
  transform-origin: center bottom;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.flower-point.active {
  transform: translateX(-50%) scale(1.12);
}

.flower-point.pulse {
  animation: heroPulse 520ms ease;
}

.flower-image {
  width: 106rpx;
  height: 176rpx;
}

.flower-name {
  margin-top: -16rpx;
  text-align: center;
  color: #f0f6ff;
  font-size: 22rpx;
  text-shadow: 0 2rpx 8rpx rgba(25, 56, 32, 0.5);
}

.float-score {
  position: absolute;
  left: 50%;
  bottom: 410rpx;
  transform: translateX(-50%);
  z-index: 5;
  color: #2a9a4d;
  font-size: 42rpx;
  font-weight: 700;
  text-shadow: 0 4rpx 12rpx rgba(62, 145, 86, 0.3);
  animation: floatUp 900ms ease forwards;
}

.stage-up-tip {
  position: absolute;
  left: 50%;
  bottom: 490rpx;
  transform: translateX(-50%);
  z-index: 5;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #ffd35d, #ffb347);
  color: #7a4e12;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 6rpx 16rpx rgba(255, 191, 87, 0.45);
  animation: stagePop 1200ms ease forwards;
}

@keyframes heroPulse {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.09);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes floatUp {
  0% {
    transform: translateY(10rpx) scale(0.92);
    opacity: 0;
  }
  18% {
    opacity: 1;
  }
  100% {
    transform: translateY(-72rpx) scale(1.06);
    opacity: 0;
  }
}

@keyframes stagePop {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(12rpx) scale(0.88);
  }
  20% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1.04);
  }
  72% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-10rpx) scale(0.96);
  }
}
</style>
