<template>
  <view class="page">
    <view class="hero-card">
      <view class="status-safe" :style="{ height: statusBarHeight + 'px' }"></view>
      <view class="nav-row">
        <view class="back-btn" @click="goBack">← 返回</view>
        <!-- <view class="fav-pill">我的最爱</view> -->
      </view>

      <view class="plant-row">
        <view class="plant-cover">
          <image class="plant-image" :src="getFlowerImage(plant)" mode="aspectFit"></image>
        </view>
        <view class="plant-info">
          <view class="plant-name">{{ plant.name || '未命名花朵' }}</view>
          <view class="plant-meta">{{ plant.stage_label || '成长中' }} · 种植{{ plantedDaysText }}天前</view>
          <view class="dot-row">
            <text v-for="idx in 4" :key="idx" class="dot" :class="{ active: idx <= stageIndex }"></text>
          </view>
          <view class="stage-tip">{{ stageFlowText }}</view>
        </view>
      </view>
    </view>

    <view class="content">
      <view class="tab-row">
        <view class="tab active">护理</view>
        <view class="tab" @click="toastDeveloping">生长记录</view>
        <view class="tab" @click="toastDeveloping">花语</view>
      </view>

      <view class="status-grid">
        <view v-for="item in statusCards" :key="item.key" class="status-item">
          <view class="status-icon" :class="'status-' + item.key">{{ item.short }}</view>
          <view class="status-name">{{ item.label }}</view>
          <view class="status-bar">
            <view class="status-bar-inner" :class="item.key" :style="{ width: item.value + '%' }"></view>
          </view>
          <view class="status-value">{{ item.value }}%</view>
        </view>
      </view>

      <view class="section-title">护理操作</view>
      <view class="action-grid">
        <view
          v-for="card in actionCards"
          :key="card.key"
          class="action-card"
          :class="[{ 'share-card': card.key === 'share' }, { disabled: card.disabled || loading }]"
          @click="onActionTap(card.key)"
        >
          <button
            v-if="card.key === 'share'"
            class="share-action-btn"
            open-type="share"
            :data-action="card.key"
            :disabled="card.disabled || loading || shareRewardLoading"
            @click.stop="onShareButtonTap"
          ></button>
          <view class="action-icon" :class="'action-' + card.key">{{ card.short }}</view>
          <view class="action-name">{{ card.label }}</view>
          <view class="action-desc">{{ card.desc }}</view>
          <view class="action-foot">{{ card.foot }}</view>
        </view>
      </view>

      <view v-if="canRedeem" class="redeem-box">
        <view class="redeem-title">花朵已盛开，可兑换实物鲜花</view>
        <view class="redeem-desc">填写收货信息后我们会按地址安排寄送</view>
        <view class="redeem-btn" @click="goRedeem">去兑换下单</view>
      </view>

      <view class="section-title">护理记录</view>
      <view v-if="records.length === 0" class="empty-record">暂无护理记录</view>
      <view v-for="item in records" :key="item._id || item.id" class="record-item">
        <view class="record-left">
          <text class="record-icon">{{ getActionIcon(item.action_type) }}</text>
          <view>
            <view class="record-title">{{ item.action_label || getActionLabel(item.action_type) }} · 恢复成长 +{{ item.growth_delta || 0 }}</view>
            <view class="record-date">{{ item.action_date || '--' }}</view>
          </view>
        </view>
        <view class="record-score">+{{ item.growth_delta || 0 }}分</view>
      </view>
    </view>
  </view>
</template>

<script>
import { ACTIONS, safeNumber } from '@/common/plant-config.js';
import { getAuthPayload, hasLogin } from '@/common/auth.js';

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
  data() {
    return {
      loading: false,
      userPlantId: '',
      plant: {
        growth_per_action: {},
        daily_action_limit: {},
        today_action_count: {}
      },
      gardenFlowers: [],
      records: [],
      shareRewardLoading: false,
      pendingShareReward: false,
      statusBarHeight: 20
    };
  },
  computed: {
    plantedDaysText() {
      const days = safeNumber(this.plant.planted_days, 3);
      return days > 0 ? days : 3;
    },
    stageIndex() {
      const stage = (this.plant.stage || 'seed').toLowerCase();
      const map = { seed: 1, sprout: 2, bud: 3, bloom: 4 };
      return map[stage] || 2;
    },
    stageFlowText() {
      const stage = this.plant.stage_label || '幼苗期';
      return `${stage} → 花蕾期`;
    },
    statusCards() {
      const waterPercent = this.getStatPercent('water_level', 60);
      const fertilizerPercent = this.getStatPercent('fertilizer_level', 60);
      const healthPercent = this.getStatPercent('health_score', 100);
      return [
        { key: 'water', label: '水分', value: waterPercent, short: '水' },
        { key: 'fertilize', label: '肥力', value: fertilizerPercent, short: '肥' },
        { key: 'health', label: '健康', value: healthPercent, short: '康' }
      ];
    },
    actionCards() {
      return [
        this.buildActionCard('water', '补充水分，加快生长速度'),
        this.buildActionCard('fertilize', '提升肥力，促进开花'),
        this.buildActionCard('weed', '清除杂草，保护养分'),
        this.buildActionCard('prune', '修剪枝条，保持株型美观'),
        this.buildActionCard('share', '邀请好友来玩，每次分享获得 2 积分')
      ];
    },
    canRedeem() {
      return (this.plant.stage || '') === 'bloom';
    }
  },
  onLoad(query) {
    this.initSafeArea();
    // 允许获取群分享 ticket，兼容分享到群领奖励场景
    if (typeof uni.showShareMenu === 'function') {
      uni.showShareMenu({ withShareTicket: true });
    }
    if (!hasLogin()) {
      uni.redirectTo({ url: '/pages/auth/login' });
      return;
    }
    this.userPlantId = query.user_plant_id || '';
    this.loadDetail();
  },
  onShow() {
    if (this.pendingShareReward && !this.shareRewardLoading) {
      this.rewardShareAction();
    }
  },
  onShareAppMessage(res) {
    return {
      title: `我在养${this.plant.name || '花朵'}，来一起领积分吧`,
      path: '/pages/home/index?from=care_share',
      success: () => {
        this.pendingShareReward = true;
        this.rewardShareAction();
      }
    };
  },
  methods: {
    onShareButtonTap() {
      if (!this.isActionDisabled('share')) {
        this.pendingShareReward = true;
      }
      if (this.isActionDisabled('share')) {
        uni.showToast({ title: '今日分享奖励已领取', icon: 'none' });
      }
    },
    initSafeArea() {
      try {
        const info = uni.getSystemInfoSync();
        const height = Number(info && info.statusBarHeight);
        this.statusBarHeight = Number.isFinite(height) && height > 0 ? height : 20;
      } catch (error) {
        this.statusBarHeight = 20;
      }
    },
    async loadDetail() {
      if (!hasLogin()) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      this.loading = true;
      try {
        const profileRes = await uniCloud.callFunction({
          name: 'plant_profile',
          data: {
            ...getAuthPayload()
          }
        });
        const profile = profileRes.result || {};
        if (profile.code !== 0) {
          uni.showToast({ title: profile.msg || '加载失败', icon: 'none' });
          return;
        }
        const data = profile.data || {};
        this.gardenFlowers = (data.garden && data.garden.flowers) || [];
        this.plant = this.pickTargetPlant(data);
        await this.loadTimeline();
      } catch (error) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    pickTargetPlant(profileData) {
      const garden = profileData.garden || {};
      const flowers = garden.flowers || [];
      if (this.userPlantId) {
        const target = flowers.find((item) => item.user_plant_id === this.userPlantId);
        if (target) return target;
      }
      return profileData.plant || flowers[0] || { growth_per_action: {}, daily_action_limit: {}, today_action_count: {} };
    },
    async loadTimeline() {
      try {
        const { result } = await uniCloud.callFunction({
          name: 'plant_timeline',
          data: {
            ...getAuthPayload(),
            user_plant_id: this.plant.user_plant_id || '',
            page: 1,
            pageSize: 8
          }
        });
        if (result.code !== 0) return;
        this.records = (result.data && result.data.list) || [];
      } catch (error) {
        this.records = [];
      }
    },
    async onActionTap(actionType) {
      if (actionType === 'share') {
        if (this.isActionDisabled('share')) {
          uni.showToast({ title: '今日分享奖励已领取', icon: 'none' });
          return;
        }
        uni.showToast({ title: '点击按钮分享给朋友即可得分', icon: 'none' });
        return;
      }
      if (this.loading || this.isActionDisabled(actionType)) return;
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
        const delta = safeNumber(result.data && result.data.growth_delta, 0);
        if (isIdempotent || delta <= 0) {
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
        this.plant = {
          ...this.plant,
          growth_value: safeNumber(this.plant.growth_value, 0) + delta,
          stage: (result.data && result.data.stage) || this.plant.stage,
          stage_label: (result.data && result.data.stage_label) || this.plant.stage_label,
          water_level: result.data && typeof result.data.water_level === 'number' ? result.data.water_level : this.plant.water_level,
          fertilizer_level: result.data && typeof result.data.fertilizer_level === 'number' ? result.data.fertilizer_level : this.plant.fertilizer_level,
          health_score: result.data && typeof result.data.health_score === 'number' ? result.data.health_score : this.plant.health_score,
          today_action_count: {
            ...(this.plant.today_action_count || {}),
            [actionType]: this.getTodayCount(actionType) + 1
          }
        };
        uni.showToast({ title: `${this.getActionLabel(actionType)}成功 +${delta}`, icon: 'none' });
        await this.loadDetail();
      } catch (error) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    async rewardShareAction() {
      if (this.shareRewardLoading) return;
      if (this.isActionDisabled('share')) {
        uni.showToast({ title: '今日分享奖励已领取', icon: 'none' });
        return;
      }
      this.shareRewardLoading = true;
      try {
        const { result } = await uniCloud.callFunction({
          name: 'plant_action',
          data: {
            ...getAuthPayload(),
            action_type: 'share',
            user_plant_id: this.plant.user_plant_id,
            request_id: `share_${Date.now()}`
          }
        });
        if (result.code !== 0) {
          uni.showToast({ title: result.msg || '分享奖励领取失败', icon: 'none' });
          return;
        }
        this.pendingShareReward = false;
        const isIdempotent = !!(result.data && result.data.idempotent);
        const delta = safeNumber(result.data && result.data.growth_delta, 0);
        if (isIdempotent || delta <= 0) {
          const nextCount = this.getActionLimit('share');
          this.plant = {
            ...this.plant,
            today_action_count: {
              ...(this.plant.today_action_count || {}),
              share: nextCount
            }
          };
          uni.showToast({ title: '今日分享奖励已领取', icon: 'none' });
          return;
        }
        this.plant = {
          ...this.plant,
          growth_value: safeNumber(this.plant.growth_value, 0) + delta,
          stage: (result.data && result.data.stage) || this.plant.stage,
          stage_label: (result.data && result.data.stage_label) || this.plant.stage_label,
          water_level: result.data && typeof result.data.water_level === 'number' ? result.data.water_level : this.plant.water_level,
          fertilizer_level: result.data && typeof result.data.fertilizer_level === 'number' ? result.data.fertilizer_level : this.plant.fertilizer_level,
          health_score: result.data && typeof result.data.health_score === 'number' ? result.data.health_score : this.plant.health_score,
          today_action_count: {
            ...(this.plant.today_action_count || {}),
            share: this.getTodayCount('share') + 1
          }
        };
        uni.showToast({ title: `分享成功 +${delta}`, icon: 'none' });
        await this.loadDetail();
      } catch (error) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
      } finally {
        this.shareRewardLoading = false;
      }
    },
    getStatPercent(field, fallback) {
      const value = Number(this.plant[field]);
      if (!Number.isFinite(value)) return fallback;
      return Math.max(0, Math.min(100, Math.round(value)));
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
    buildActionCard(actionType, desc) {
      const disabled = this.isActionDisabled(actionType);
      const count = this.getTodayCount(actionType);
      const limit = this.getActionLimit(actionType);
      const shortMap = { water: '水', fertilize: '肥', weed: '草', prune: '剪' };
      return {
        key: actionType,
        label: this.getActionLabel(actionType),
        short: shortMap[actionType] || (actionType === 'share' ? '享' : '养'),
        desc,
        disabled,
        foot: disabled ? '今日次数已用完' : `今日可用 ${Math.max(limit - count, 0)} 次`
      };
    },
    getActionLabel(actionType) {
      const target = ACTIONS.find((item) => item.key === actionType);
      return (target && target.label) || '养护';
    },
    getActionIcon(actionType) {
      const map = { water: '💧', fertilize: '🌿', weed: '🌾', prune: '✂', share: '📤' };
      return map[actionType] || '🌸';
    },
    getFlowerImage(flower) {
      const code = (flower && flower.code) || '';
      const stage = (flower && flower.stage) || 'seed';
      const stageMap = FLOWER_IMAGE_MAP[code];
      if (!stageMap) return DEFAULT_FLOWER_IMAGE;
      return stageMap[stage] || stageMap.bloom || DEFAULT_FLOWER_IMAGE;
    },
    toastDeveloping() {
      uni.showToast({ title: '该模块开发中', icon: 'none' });
    },
    goRedeem() {
      const targetId = this.plant.user_plant_id || '';
      const query = targetId ? `?user_plant_id=${targetId}` : '';
      uni.navigateTo({ url: `/pages/profile/redeem${query}` });
    },
    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style>
.page {
  min-height: 100vh;
  padding:0;
  background: linear-gradient(180deg, #2f7f35 0%, #3f8e3d 34%, #d6e8ce 35%, #e9f2e3 100%);
}

.hero-card {
  padding: 26rpx 26rpx 30rpx;
  color: #fff;
  position: relative;
}

.status-safe {
  width: 100%;
}

.hero-card::after {
  content: '';
  position: absolute;
  right: 12rpx;
  top: -22rpx;
  width: 280rpx;
  height: 280rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 52%, rgba(255, 255, 255, 0) 74%);
}

.nav-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn {
  font-size: 42rpx;
  font-weight: 500;
}

.fav-pill {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999rpx;
  padding: 10rpx 22rpx;
  font-size: 26rpx;
  position: relative;
}

.fav-pill::before {
  content: '';
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #f0d463;
  display: inline-block;
  margin-right: 10rpx;
  vertical-align: middle;
}

.plant-row {
  margin-top: 24rpx;
  display: flex;
  gap: 20rpx;
  position: relative;
  z-index: 1;
}

.plant-cover {
  width: 216rpx;
  height: 216rpx;
  border-radius: 30rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.08));
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
}

.plant-image {
  width: 140rpx;
  height: 180rpx;
}

.plant-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.plant-name {
  font-size: 56rpx;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 1rpx;
}

.plant-meta {
  margin-top: 10rpx;
  font-size: 28rpx;
  opacity: 0.9;
}

.dot-row {
  margin-top: 10rpx;
}

.dot {
  display: inline-block;
  width: 13rpx;
  height: 13rpx;
  border-radius: 50%;
  margin-right: 10rpx;
  background: rgba(255, 255, 255, 0.35);
}

.dot.active {
  background: #f4de68;
}

.stage-tip {
  margin-top: 10rpx;
  font-size: 30rpx;
  opacity: 0.95;
}

.content {
  margin-top:100rpx;
  background: linear-gradient(180deg, #dce9d5 0%, #eaf3e5 100%);
  padding: 0 20rpx calc(env(safe-area-inset-bottom) + 24rpx);
}

.tab-row {
  position:relative;
  top:-80rpx;
  background: #fff;
  border-radius: 28rpx 28rpx 0 0;
  display: flex;
  box-shadow: 0 12rpx 24rpx rgba(56, 94, 58, 0.08);
}

.tab {
  flex: 1;
  text-align: center;
  font-size: 31rpx;
  padding: 24rpx 0 18rpx;
  color: #7f9782;
  font-weight: 600;
  border-bottom: 4rpx solid transparent;
}

.tab.active {
  color: #3e7d42;
  border-bottom-color: #3e7d42;
}

.status-grid {
  margin-top: 20rpx;
  display: flex;
  gap: 12rpx;
}

.status-item {
  flex: 1;
  background: #fff;
  border-radius: 22rpx;
  padding: 16rpx 14rpx 14rpx;
  text-align: center;
  box-shadow: 0 8rpx 16rpx rgba(67, 101, 73, 0.08);
}

.status-icon {
  width: 66rpx;
  height: 66rpx;
  border-radius: 18rpx;
  margin: 0 auto;
  line-height: 66rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #fff;
}

.status-water {
  background: linear-gradient(180deg, #63c4f6 0%, #43a9e4 100%);
}

.status-fertilize {
  background: linear-gradient(180deg, #c79be7 0%, #a96ed2 100%);
}

.status-health {
  background: linear-gradient(180deg, #f19abf 0%, #e06a9f 100%);
}

.status-name {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7a8d7f;
}

.status-bar {
  margin-top: 8rpx;
  height: 12rpx;
  border-radius: 999rpx;
  background: #ecf2ea;
  overflow: hidden;
}

.status-bar-inner {
  height: 100%;
}

.status-bar-inner.water {
  background: linear-gradient(90deg, #5ab8f0, #3d9de0);
}

.status-bar-inner.fertilize {
  background: linear-gradient(90deg, #d59be7, #b06ad2);
}

.status-bar-inner.health {
  background: linear-gradient(90deg, #ee87b2, #dd4f8e);
}

.status-value {
  margin-top: 8rpx;
  font-size: 30rpx;
  color: #455b49;
  font-weight: 700;
}

.section-title {
  margin: 26rpx 6rpx 14rpx;
  font-size: 38rpx;
  color: #2f4533;
  font-weight: 700;
}

.action-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.action-card {
  width: calc((100% - 16rpx) / 2);
  border-radius: 26rpx;
  background: #fff;
  padding: 20rpx 20rpx 18rpx;
  box-sizing: border-box;
  box-shadow: 0 10rpx 18rpx rgba(71, 104, 72, 0.08);
}

.action-card.share-card {
  position: relative;
}

.share-action-btn {
  position: absolute;
  inset: 0;
  opacity: 0;
  z-index: 2;
  border: none;
  background: transparent;
}

.share-action-btn::after {
  border: none;
}

.action-card.disabled {
  opacity: 0.6;
}

.action-icon {
  width: 84rpx;
  height: 84rpx;
  border-radius: 20rpx;
  text-align: center;
  line-height: 84rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
}

.action-water {
  background: linear-gradient(180deg, #65c6f6 0%, #47addf 100%);
}

.action-fertilize {
  background: linear-gradient(180deg, #c89ce9 0%, #a970d4 100%);
}

.action-weed {
  background: linear-gradient(180deg, #90c87a 0%, #67aa4f 100%);
}

.action-prune {
  background: linear-gradient(180deg, #f0a9c7 0%, #e286ae 100%);
}

.action-share {
  background: linear-gradient(180deg, #f5c36b 0%, #ea9d31 100%);
}

.action-card.disabled .action-icon {
  background: #d7ddd8;
  color: #7b8680;
}

.action-name {
  margin-top: 16rpx;
  font-size: 42rpx;
  color: #26392a;
  font-weight: 700;
}

.action-desc {
  margin-top: 10rpx;
  font-size: 28rpx;
  line-height: 1.48;
  color: #738875;
  min-height: 84rpx;
}

.action-foot {
  margin-top: 10rpx;
  display: inline-block;
  background: #f2f5f1;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #8b9a8d;
  padding: 8rpx 16rpx;
}

.redeem-box {
  margin: 24rpx 6rpx 8rpx;
  background: #ffffff;
  border-radius: 22rpx;
  padding: 22rpx 20rpx;
  box-shadow: 0 8rpx 16rpx rgba(74, 108, 79, 0.08);
}

.redeem-title {
  font-size: 30rpx;
  color: #275334;
  font-weight: 700;
}

.redeem-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #78917d;
}

.redeem-btn {
  margin-top: 16rpx;
  width: 240rpx;
  text-align: center;
  font-size: 26rpx;
  color: #fff;
  background: #47af63;
  border-radius: 999rpx;
  padding: 14rpx 0;
  font-weight: 700;
}

.empty-record {
  background: rgba(255, 255, 255, 0.8);
  color: #869789;
  text-align: center;
  padding: 22rpx 0;
  border-radius: 16rpx;
}

.record-item {
  margin-top: 12rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 18rpx;
  padding: 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8rpx 16rpx rgba(74, 108, 79, 0.06);
}

.record-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.record-icon {
  width: 58rpx;
  height: 58rpx;
  border-radius: 14rpx;
  background: #ecf3ea;
  text-align: center;
  line-height: 58rpx;
  font-size: 30rpx;
}

.record-title {
  font-size: 30rpx;
  color: #2d3f31;
  font-weight: 600;
}

.record-date {
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #849686;
}

.record-score {
  font-size: 34rpx;
  color: #328f4a;
  font-weight: 700;
}
</style>
