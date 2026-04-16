<template>
  <view class="page">
    <view class="hero-card">
      <view class="avatar">{{ getAvatarText() }}</view>
      <view class="name">{{ user.display_name || '花友' }}</view>
      <view class="stage-tag">{{ plant.stage_label || '成长中' }}</view>
      <view class="summary">继续照料你的花园，记录每一次成长。</view>
    </view>

    <view class="card">
      <view class="title">成长数据</view>
      <view class="row">
        <text class="label">累计成长值</text>
        <text class="value">{{ user.total_growth || 0 }}</text>
      </view>
      <view class="row">
        <text class="label">累计行为次数</text>
        <text class="value">{{ user.total_actions || 0 }}</text>
      </view>
      <view class="row">
        <text class="label">当前阶段</text>
        <text class="value">{{ plant.stage_label || '--' }}</text>
      </view>
    </view>

    <view class="card action-card">
      <view class="action-main" @click="goRanking">积分排行榜</view>
      <view class="action-secondary" @click="goTimeline">查看成长日志</view>
      <view class="action-secondary" @click="goRules">游戏规则说明</view>
      <view class="action-secondary" @click="goLogin">登录 / 切换账号</view>
    </view>
  </view>
</template>

<script>
import { getAuthPayload, hasLogin } from '@/common/auth.js';

export default {
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
      if (!hasLogin()) {
        this.user = {};
        this.plant = {};
        return;
      }
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
        this.plant = result.data.plant || {};
      } catch (error) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
      }
    },
    goRanking() {
      uni.navigateTo({
        url: '/pages/profile/ranking'
      });
    },
    goTimeline() {
      uni.navigateTo({
        url: '/pages/profile/timeline'
      });
    },
    goLogin() {
      uni.navigateTo({
        url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
      });
    },
    goRules() {
      uni.navigateTo({
        url: '/pages/profile/rules'
      });
    },
    getAvatarText() {
      const name = this.user.display_name || '花友';
      return name.slice(0, 1);
    }
  }
};
</script>

<style>
.page {
  min-height: 100vh;
  padding: 28rpx;
  background: linear-gradient(180deg, #edf8ef 0%, #f8fcf5 40%, #ffffff 100%);
}

.hero-card,
.card {
  background: var(--pf-color-surface);
  border-radius: var(--pf-radius-card);
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: var(--pf-shadow-card);
}

.hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(145deg, #f6fff6 0%, #ffffff 68%);
}

.avatar {
  width: 110rpx;
  height: 110rpx;
  border-radius: 55rpx;
  line-height: 110rpx;
  text-align: center;
  font-size: 42rpx;
  font-weight: 700;
  color: var(--pf-color-primary-dark);
  background: #dff3e4;
}

.name {
  margin-top: 14rpx;
  font-size: 36rpx;
  color: var(--pf-color-text-main);
  font-weight: 700;
}

.stage-tag {
  margin-top: 12rpx;
  border-radius: var(--pf-radius-pill);
  padding: 8rpx 20rpx;
  background: var(--pf-color-tag);
  color: var(--pf-color-tag-text);
  font-size: 22rpx;
}

.summary {
  margin-top: 16rpx;
  color: #829584;
  font-size: 24rpx;
}

.title {
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
  color: var(--pf-color-text-main);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14rpx;
  padding: 16rpx 18rpx;
  border-radius: 16rpx;
  background: #f8fbf7;
}

.label {
  font-size: 25rpx;
  color: var(--pf-color-text-sub);
}

.value {
  font-size: 30rpx;
  color: var(--pf-color-primary-dark);
  font-weight: 700;
}

.action-card {
  padding: 0;
  overflow: hidden;
}

.action-main,
.action-secondary {
  text-align: center;
  padding: 24rpx 20rpx;
  font-size: 28rpx;
}

.action-main {
  background: var(--pf-color-primary);
  color: #fff;
  font-weight: 600;
}

.action-secondary {
  background: #f6faf4;
  color: #4a6e53;
}
</style>
