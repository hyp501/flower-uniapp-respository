<template>
  <view class="page-profile">
   
    <view class="profile-hero">
      <view class="hero-orb hero-orb-1"></view>
      <view class="hero-orb hero-orb-2"></view>
      <view class="hero-orb hero-orb-3"></view>

      <view class="profile-identity">
        <view class="avatar-ring">
          <view class="avatar-inner">🧑</view>
        </view>
        <view class="profile-meta">
          <view class="profile-name">{{ displayName }}</view>
          <view class="level-chip">
            <text class="level-gem earned">💎</text>
            <text>花匠 · Lv.{{ currentLevel }}</text>
          </view>
        </view>
      </view>

      <view class="level-progress-wrap">
        <view class="level-labels">
          <text>🌱 Lv.{{ currentLevel }} 资深园丁</text>
        <text class="level-next">
          {{ isMaxLevel ? '已达满级 Lv.' + currentLevel : '再攒 ' + nextLevelNeed + ' 积分升 Lv.' + (currentLevel + 1) }}
        </text>
        <text>🌸 Lv.{{ isMaxLevel ? currentLevel : currentLevel + 1 }} 花神</text>
        </view>
        <view class="level-track">
          <view class="level-fill" :style="{ width: `${levelProgress}%` }"></view>
        </view>
        <view class="level-hint">总积分 {{ totalGrowth }} · 持续种植中</view>
      </view>
    </view>

    <view class="stats-row">
      <view class="stat-item">
        <view class="stat-num">{{ totalGrowth }}</view>
        <view class="stat-unit">我的积分</view>
      </view>
      <view class="stat-item">
        <view class="stat-num">{{ totalFlowers }}</view>
        <view class="stat-unit">已种花卉</view>
      </view>
      <view class="stat-item">
        <view class="stat-num">{{ totalActions }}</view>
        <view class="stat-unit">培育天数</view>
      </view>
      <view class="stat-item">
        <view class="stat-num">#{{ rankText }}</view>
        <view class="stat-unit">我的排名</view>
      </view>
    </view>

    <scroll-view scroll-y class="menu-scroll-area">
      <view class="menu-group-label">📂 资产</view>
      <view class="menu-card">
        <view class="menu-row">
          <view class="menu-icon-box icon-green">🌿</view>
          <view class="menu-content">
            <view class="menu-primary">我的积分</view>
            <view class="menu-secondary">当前积分总数</view>
          </view>
          <view class="menu-meta">
            <text class="menu-sub">{{ totalGrowth }}</text>
            <text class="menu-arrow-icon">›</text>
          </view>
        </view>
        <view class="menu-row">
          <view class="menu-icon-box icon-pink">🌺</view>
          <view class="menu-content">
            <view class="menu-primary">我的花卉收藏</view>
            <view class="menu-secondary">已解锁 {{ totalFlowers }}/20 种花卉</view>
          </view>
          <view class="menu-meta">
            <text class="menu-arrow-icon">›</text>
          </view>
        </view>

      </view>

      <view class="menu-group-label">🏅 成就</view>
      <view class="menu-card">
        <view class="menu-row" @click="goRanking">
          <view class="menu-icon-box icon-orange">🏆</view>
          <view class="menu-content">
            <view class="menu-primary">排行榜</view>
            <view class="menu-secondary">当前排名第 {{ rankText }} 位 · 继续浇水冲榜</view>
          </view>
          <view class="menu-meta">
            <text class="menu-arrow-icon">›</text>
          </view>
        </view>
       <!-- <view class="menu-row">
          <view class="menu-icon-box icon-teal">📜</view>
          <view class="menu-content">
            <view class="menu-primary">我的成就</view>
            <view class="menu-secondary">已解锁 {{ unlockedBadgeCount }}/15 枚成就徽章</view>
          </view>
          <view class="menu-meta">
            <text class="menu-badge-orange">{{ unlockedBadgeCount }}/15</text>
            <text class="menu-arrow-icon">›</text>
          </view>
        </view> -->
      </view>

      <view class="menu-group-label">🌐 工具</view>
      <view class="menu-card">
        <view class="menu-row">
          <view class="menu-icon-box icon-blue">📖</view>
          <view class="menu-content">
            <view class="menu-primary">花卉百科</view>
            <view class="menu-secondary">了解每种花卉的养护知识与故事</view>
          </view>
          <view class="menu-meta">
            <text class="menu-badge">NEW</text>
            <text class="menu-arrow-icon">›</text>
          </view>
        </view>
     <!--   <view class="menu-row">
          <view class="menu-icon-box icon-purple">🎁</view>
          <view class="menu-content">
            <view class="menu-primary">领取奖励</view>
            <view class="menu-secondary">每日登录礼包 · 待领取 3 件</view>
          </view>
          <view class="menu-meta">
            <text class="menu-badge">3</text>
            <text class="menu-arrow-icon">›</text>
          </view>
        </view> -->
<!--        <view class="menu-row">
          <view class="menu-icon-box icon-grey">📨</view>
          <view class="menu-content">
            <view class="menu-primary">意见反馈</view>
            <view class="menu-secondary">帮助我们做得更好</view>
          </view>
          <view class="menu-meta">
            <text class="menu-arrow-icon">›</text>
          </view>
        </view> -->
        <view class="menu-row">
          <view class="menu-icon-box icon-grey">ℹ️</view>
          <view class="menu-content">
            <view class="menu-primary">关于小程序</view>
            <view class="menu-secondary">版本 1.0.0 · 2026年4月</view>
          </view>
          <view class="menu-meta">
            <text class="menu-arrow-icon">›</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="logout-btn-wrap">
      <button class="logout-btn" @click="onLogout">🚪 退出登录</button>
    </view>
    <bottom-menu active-key="mine" />
  </view>
</template>

<script>
import { getAuthPayload, hasLogin } from '@/common/auth.js';
import BottomMenu from '@/components/bottom-menu/index.vue';
import { getLevelInfoByGrowth } from '@/common/level-config.js';

export default {
  components: {
    BottomMenu
  },
  data() {
    return {
      loading: false,
      myRank: null,
      user: {
        display_name: '',
        total_growth: 0,
        total_actions: 0,
        user_level: 1,
        level_progress: 0,
        next_level_need: 80,
        is_max_level: false
      },
      garden: {
        total_flowers: 0
      }
    };
  },
  computed: {
    displayName() {
      return this.user.display_name || '花友的花园';
    },
    totalGrowth() {
      return this.toNumber(this.user.total_growth);
    },
    totalActions() {
      return this.toNumber(this.user.total_actions);
    },
    totalFlowers() {
      return this.toNumber(this.garden.total_flowers);
    },
    currentLevel() {
      const level = Number(this.user.user_level);
      if (Number.isFinite(level) && level > 0) return level;
      return getLevelInfoByGrowth(this.totalGrowth).user_level;
    },
    levelProgress() {
      const progress = Number(this.user.level_progress);
      if (Number.isFinite(progress)) return Math.max(0, Math.min(100, progress));
      return getLevelInfoByGrowth(this.totalGrowth).level_progress;
    },
    nextLevelNeed() {
      const need = Number(this.user.next_level_need);
      if (Number.isFinite(need)) return Math.max(0, need);
      return getLevelInfoByGrowth(this.totalGrowth).next_level_need;
    },
    isMaxLevel() {
      if (typeof this.user.is_max_level === 'boolean') return this.user.is_max_level;
      return getLevelInfoByGrowth(this.totalGrowth).is_max_level;
    },
    rankText() {
      return this.myRank || '--';
    },
    unlockedBadgeCount() {
      return Math.min(15, Math.max(1, Math.floor(this.totalGrowth / 180) + 1));
    }
  },
  onShow() {
    if (!hasLogin()) {
      uni.reLaunch({ url: '/pages/auth/login' });
      return;
    }
    uni.hideTabBar();
    this.loadProfile();
  },
  onHide() {
    uni.showTabBar();
  },
  onUnload() {
    uni.showTabBar();
  },
  methods: {
    async loadProfile() {
      if (!hasLogin()) {
        return;
      }
      this.loading = true;
      try {
        const authPayload = getAuthPayload();
        const [{ result: profileResult }, { result: rankResult }] = await Promise.all([
          uniCloud.callFunction({
            name: 'plant_profile',
            data: {
              ...authPayload
            }
          }),
          uniCloud.callFunction({
            name: 'plant_leaderboard',
            data: {
              ...authPayload,
              limit: 50
            }
          })
        ]);
        if (!profileResult || profileResult.code !== 0) {
          uni.showToast({ title: (profileResult && profileResult.msg) || '加载失败', icon: 'none' });
          return;
        }
        const profileUser = (profileResult.data && profileResult.data.user) || {};
        const levelInfo = getLevelInfoByGrowth(profileUser.total_growth || 0);
        this.user = {
          ...this.user,
          ...profileUser,
          ...levelInfo,
          ...profileUser
        };
        this.garden = (profileResult.data && profileResult.data.garden) || this.garden;
        if (rankResult && rankResult.code === 0) {
          const rank = rankResult.data && rankResult.data.my_rank;
          this.myRank = typeof rank === 'number' ? rank : null;
        } else {
          this.myRank = null;
        }
      } catch (error) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    toNumber(value) {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    },
    goRanking() {
      uni.navigateTo({ url: '/pages/profile/ranking' });
    },
    async onLogout() {
      const modalRes = await new Promise((resolve) => {
        uni.showModal({
          title: '提示',
          content: '确定要退出登录吗？',
          success: (res) => resolve(res),
          fail: () => resolve({ confirm: false })
        });
      });
      if (!modalRes.confirm) return;
      this.loading = true;
      try {
        const token = uni.getStorageSync('uni_id_token') || '';
        if (token) {
          await uniCloud.callFunction({
            name: 'user-center',
            data: {
              action: 'logout',
              uniIdToken: token
            }
          });
        }
      } catch (error) {
        // 服务端退出失败不阻塞本地清理，避免用户卡在已失效态
      } finally {
        const clearKeys = [
          'uni_id_token',
          'uni_id_uid',
          'uni-id-pages-userInfo'
        ];
        clearKeys.forEach((key) => {
          uni.removeStorageSync(key);
        });
        uni.setStorageSync('uni_id_token_expired', 0);
        // 清空当前页面态，避免切账号后短暂闪现上一个用户数据
        this.user = {
          display_name: '',
          total_growth: 0,
          total_actions: 0,
          user_level: 1,
          level_progress: 0,
          next_level_need: 80,
          is_max_level: false
        };
        this.garden = { total_flowers: 0 };
        this.myRank = null;
        this.loading = false;
      }
      uni.showToast({ title: '已退出登录', icon: 'none' });
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/auth/login'
        });
      }, 200);
    }
  }
};
</script>

<style>
.page-profile {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fffe 0%, #ffffff 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.status-bar-profile {
  height: calc(env(safe-area-inset-top) + 44rpx);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: env(safe-area-inset-top) 24rpx 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
}

.status-bar-profile .time {
  font-size: 30rpx;
  font-weight: 600;
  color: white;
}

.status-bar-profile .icons {
  font-size: 24rpx;
  color: white;
}

.profile-hero {
  background: linear-gradient(150deg, #2d5a27 0%, #4a8f3f 50%, #7ec850 100%);
  padding: calc(env(safe-area-inset-top) + 52rpx) 24rpx 36rpx;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}

.hero-orb-1 {
  width: 220rpx;
  height: 220rpx;
  top: -80rpx;
  right: -80rpx;
}

.hero-orb-2 {
  width: 160rpx;
  height: 160rpx;
  bottom: -60rpx;
  left: -40rpx;
}

.hero-orb-3 {
  width: 80rpx;
  height: 80rpx;
  top: 20rpx;
  left: 60rpx;
  background: rgba(255, 255, 255, 0.04);
}

.profile-identity {
  display: flex;
  align-items: center;
  gap: 16rpx;
  position: relative;
  z-index: 2;
}

.avatar-ring {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  padding: 3rpx;
  background: linear-gradient(135deg, #ffd54f, #ff9800);
  flex-shrink: 0;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.25);
}

.avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #fff8e1, #ffe082);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  border: 3rpx solid white;
}

.profile-meta {
  flex: 1;
}

.profile-name {
  font-size: 44rpx;
  font-weight: 800;
  color: white;
  margin-bottom: 5rpx;
  letter-spacing: 1rpx;
}

.level-chip {
  display: inline-flex;
  align-items: center;
  gap: 5rpx;
  background: rgba(255, 255, 255, 0.2);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  padding: 4rpx 12rpx;
  border-radius: 50rpx;
  font-size: 24rpx;
  color: white;
  font-weight: 600;
}

.level-gem {
  font-size: 26rpx;
}

.level-gem.earned {
  color: #ffd54f;
  animation: pulse-dot 2s ease-in-out infinite;
}

.level-progress-wrap {
  margin-top: 20rpx;
  position: relative;
  z-index: 2;
}

.level-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6rpx;
}

.level-labels text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

.level-labels .level-next {
  color: #ffd54f;
}

.level-track {
  width: 100%;
  height: 8rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4rpx;
  overflow: hidden;
  position: relative;
}

.level-fill {
  height: 100%;
  border-radius: 4rpx;
  background: linear-gradient(90deg, #ffe082, #ffd54f);
  width: 68%;
  position: relative;
}

.level-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%);
  animation: shine 2.5s ease-in-out infinite;
}

.level-hint {
  text-align: center;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 5rpx;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: white;
  margin: -18rpx 20rpx 0;
  border-radius: 18rpx;
  padding: 16rpx 0;
  position: relative;
  z-index: 10;
  box-shadow: 0 6rpx 24rpx rgba(45, 90, 39, 0.1);
  border: 1rpx solid rgba(45, 90, 39, 0.06);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rpx;
  border-right: 1rpx solid #f0f0f0;
}

.stat-item:last-child {
  border-right: none;
}

.stat-num {
  font-size: 36rpx;
  font-weight: 900;
  color: #253229;
}

.stat-item:first-child .stat-num {
  color: #4a8f3f;
}

.stat-item:nth-child(3) .stat-num {
  color: #f48fb1;
}

.stat-unit {
  font-size: 18rpx;
  color: #8e9a92;
  font-weight: 500;
}

.menu-scroll-area {
  flex: 1;
  padding: 18rpx 20rpx 100rpx;
  box-sizing: border-box;
}

.menu-group-label {
  font-size: 24rpx;
  font-weight: 700;
  color: #8e9a92;
  letter-spacing: 1rpx;
  margin: 14rpx 0 8rpx 4rpx;
}

.menu-group-label:first-child {
  margin-top: 0;
}

.menu-card {
  background: white;
  border-radius: 18rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  border: 1rpx solid rgba(0, 0, 0, 0.04);
}

.menu-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 14rpx 16rpx;
  border-bottom: 1rpx solid #f8f8f8;
}

.menu-row:last-child {
  border-bottom: none;
}

.menu-icon-box {
  width: 38rpx;
  height: 38rpx;
  border-radius: 11rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  flex-shrink: 0;
}

.icon-green { background: #e8f5e0; }
.icon-pink { background: #fce4ec; }
.icon-blue { background: #e3f2fd; }
.icon-orange { background: #fff3e0; }
.icon-purple { background: #f3e5f5; }
.icon-teal { background: #e0f2f1; }
.icon-red { background: #ffebee; }
.icon-grey { background: #f5f5f5; }

.menu-content { flex: 1; }

.menu-primary {
  font-size: 28rpx;
  font-weight: 600;
  color: #253229;
}

.menu-secondary {
  font-size: 22rpx;
  color: #8e9a92;
  margin-top: 1rpx;
}

.menu-meta {
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex-shrink: 0;
}

.menu-badge {
  background: #ff4757;
  color: white;
  font-size: 18rpx;
  font-weight: 800;
  padding: 2rpx 6rpx;
  border-radius: 50rpx;
  min-width: 16rpx;
  text-align: center;
}

.menu-badge-orange {
  background: #fff3e0;
  color: #ff9800;
  font-size: 20rpx;
  font-weight: 700;
  padding: 2rpx 8rpx;
  border-radius: 50rpx;
}

.menu-sub {
  font-size: 24rpx;
  color: #8e9a92;
  font-weight: 500;
}

.menu-arrow-icon {
  font-size: 32rpx;
  color: #d0d0d0;
}

.logout-btn-wrap {
  padding: 0 20rpx calc(env(safe-area-inset-bottom) + 186rpx);
  flex-shrink: 0;
}

.logout-btn {
  width: 100%;
  height: 96rpx;
  background: white;
  border: 2rpx solid #ffcdd2;
  border-radius: 14rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #ef5350;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  box-shadow: 0 2rpx 8rpx rgba(239, 83, 80, 0.08);
}

@keyframes shine {
  0% { transform: translateX(-100%); }
  50%, 100% { transform: translateX(200%); }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.8); }
}
</style>
