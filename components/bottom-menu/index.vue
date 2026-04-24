<template>
  <view class="app-bottom-menu-wrap">
    <view class="app-bottom-menu">
      <view
        v-for="item in menuItems"
        :key="item.key"
        class="app-bottom-menu-item"
        :class="{ active: activeKey === item.key }"
        @click="onTabTap(item)"
      >
        <image class="app-bottom-menu-icon" :src="item.icon" mode="aspectFit"></image>
        <view class="app-bottom-menu-text">{{ item.label }}</view>
      </view>
    </view>
  <!--  <view
      v-if="showCenterAction"
      class="app-bottom-menu-center"
      :class="{ disabled: centerDisabled }"
      @click="onCenterTap"
    >
      <view class="app-bottom-menu-center-inner">
        <image class="app-bottom-menu-center-icon" :src="centerIcon" mode="aspectFit"></image>
      </view>
    </view> -->
  </view>
</template>

<script>
const MENU_ITEMS = [
  { key: 'home', label: '花园', icon: '/static/flowers/rose.svg', type: 'switch', url: '/pages/home/index' },
  { key: 'seed', label: '种子', icon: '/static/flowers/rose-seed.svg', type: 'navigate', url: '/pages/flower/seed-shop' },
  { key: 'rank', label: '排行', icon: '/static/flowers/sunflower.svg', type: 'navigate', url: '/pages/profile/ranking' },
  { key: 'mine', label: '我的', icon: '/static/flowers/lily.svg', type: 'switch', url: '/pages/profile/index' }
];

export default {
  props: {
    activeKey: {
      type: String,
      default: 'home'
    },
    showCenterAction: {
      type: Boolean,
      default: false
    },
    centerDisabled: {
      type: Boolean,
      default: false
    },
    centerIcon: {
      type: String,
      default: '/static/flowers/default.svg'
    }
  },
  data() {
    return {
      menuItems: MENU_ITEMS
    };
  },
  methods: {
    onCenterTap() {
      if (this.centerDisabled) return;
      this.$emit('centerTap');
    },
    onTabTap(item) {
      if (!item || item.key === this.activeKey) return;
      if (item.type === 'switch' && item.url) {
        uni.switchTab({ url: item.url });
        return;
      }
      if (item.type === 'navigate' && item.url) {
        uni.navigateTo({ url: item.url });
      }
    }
  }
};
</script>

<style>
.app-bottom-menu-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0 18rpx calc(env(safe-area-inset-bottom) + 8rpx);
  z-index: 20;
}

.app-bottom-menu {
  height: 136rpx;
  border-radius: 34rpx 34rpx 0 0;
  background: rgba(251, 252, 251, 0.96);
  box-shadow: 0 -10rpx 30rpx rgba(49, 83, 42, 0.18);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18rpx;
}

.app-bottom-menu-item {
  width: 24.5%;
  text-align: center;
  color: #73827a;
}

.app-bottom-menu-item.active {
  color: #4ea94f;
}

.app-bottom-menu-icon {
  width: 44rpx;
  height: 44rpx;
}

.app-bottom-menu-text {
  margin-top: 6rpx;
  font-size: 25rpx;
  font-weight: 600;
}

.app-bottom-menu-center {
  position: absolute;
  left: 50%;
  top: -36rpx;
  transform: translateX(-50%);
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  padding: 8rpx;
  background: rgba(120, 207, 92, 0.32);
  box-shadow: 0 12rpx 28rpx rgba(69, 155, 64, 0.4);
}

.app-bottom-menu-center-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(180deg, #7ccd5c, #5eb648);
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-bottom-menu-center-icon {
  width: 64rpx;
  height: 64rpx;
  opacity: 0.95;
}

.app-bottom-menu-center.disabled {
  opacity: 0.58;
}
</style>
