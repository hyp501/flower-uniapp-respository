<template>
  <view class="page">
    <view class="hero-board">
    
      <view class="hero-title">🏆 花园排行榜</view>
      <view class="hero-sub">本月花达人 · 每天更新</view>
      <view class="hero-share-wrap">
        <button
          class="hero-share-btn"
          open-type="share"
          :class="{ claimed: shareRewardClaimed }"
          :disabled="shareRewardLoading || shareRewardClaimed"
          @click.stop="onShareButtonTap"
        >{{ shareButtonText }}</button>
      </view>

      <view class="podium-wrap">
        <view class="podium-item second">
          <view class="podium-avatar">{{ getAvatarText(topThree[1]) }}</view>
          <view class="podium-name">{{ getName(topThree[1]) }}</view>
          <view class="podium-score">{{ getScore(topThree[1]) }}分</view>
          <view class="podium-step">2</view>
        </view>
        <view class="podium-item first">
          <view class="podium-avatar champion">{{ getAvatarText(topThree[0]) }}</view>
          <view class="podium-name">{{ getName(topThree[0]) }}</view>
          <view class="podium-score">{{ getScore(topThree[0]) }}分</view>
          <view class="podium-step">1</view>
        </view>
        <view class="podium-item third">
          <view class="podium-avatar">{{ getAvatarText(topThree[2]) }}</view>
          <view class="podium-name">{{ getName(topThree[2]) }}</view>
          <view class="podium-score">{{ getScore(topThree[2]) }}分</view>
          <view class="podium-step">3</view>
        </view>
      </view>
    </view>

    <view v-if="my_rank !== null" class="my-bar">
      <view class="my-stat">
        <view class="my-label">我的排名</view>
        <view class="my-value">#{{ my_rank }}</view>
      </view>
      <view class="my-stat center">
        <view class="my-label">当前积分</view>
        <view class="my-value score">{{ my_total_growth }}</view>
      </view>
      <view class="my-stat right">
        <view class="my-label">距上一名</view>
        <view class="my-value up">+{{ gapToPrev }}</view>
      </view>
    </view>

    <view class="list-panel">
      <view v-if="loading" class="empty">加载中...</view>
      <view v-else-if="!list.length" class="empty">暂无排行数据，快去花园积累成长值吧</view>
      <view v-else>
        <view
          v-for="item in list"
          :key="item.rank + '-' + item.display_name"
          class="rank-card"
          :class="{ me: item.is_me }"
        >
          <view class="rank-left">
            <view class="rank-num">{{ item.rank }}</view>
            <view class="rank-avatar">{{ getAvatarText(item) }}</view>
            <view class="rank-meta">
              <view class="name-row">
                <view class="rank-name">{{ item.display_name }}</view>
                <view v-if="item.is_me" class="me-tag">我</view>
              </view>
              <view class="rank-sub">🌸 已种 {{ item.flower_count || 0 }} 株</view>
            </view>
          </view>
          <view class="rank-right">
            <view class="rank-score">{{ item.total_growth }}</view>
            <view class="rank-unit">积分</view>
          </view>
        </view>
      </view>
    </view>
    <bottom-menu active-key="rank" />
  </view>
</template>

<script>
import { getAuthPayload, hasLogin } from '@/common/auth.js';
import BottomMenu from '@/components/bottom-menu/index.vue';

export default {
  components: {
    BottomMenu
  },
  data() {
    return {
      loading: false,
      shareRewardLoading: false,
      shareRewardClaimed: false,
      pendingShareReward: false,
      currentUserPlantId: '',
      list: [],
      my_rank: null,
      my_total_growth: 0,
      my_display_name: '花友'
    };
  },
  onLoad() {
    if (typeof uni.showShareMenu === 'function') {
      uni.showShareMenu({ withShareTicket: true });
    }
  },
  onShow() {
    this.refreshShareRewardState();
    if (this.pendingShareReward && !this.shareRewardLoading) {
      this.rewardShareAction();
    }
    this.loadBoard();
  },
  onShareAppMessage() {
    return {
      title: '快来看花园积分排行，和我一起冲榜吧',
      path: '/pages/profile/ranking',
      success: () => {
        this.pendingShareReward = true;
        this.rewardShareAction();
      }
    };
  },
  onPullDownRefresh() {
    Promise.all([this.loadBoard(), this.refreshShareRewardState()]).finally(() => {
      uni.stopPullDownRefresh();
    });
  },
  methods: {
    onShareButtonTap() {
      if (this.shareRewardClaimed) {
        uni.showToast({ title: '今日分享奖励已领取', icon: 'none' });
        return;
      }
      this.pendingShareReward = true;
      if (!hasLogin()) {
        uni.showToast({ title: '请先登录后再领取奖励', icon: 'none' });
      }
    },
    async refreshShareRewardState() {
      if (!hasLogin()) {
        this.shareRewardClaimed = false;
        return;
      }
      try {
        const { result } = await uniCloud.callFunction({
          name: 'plant_profile',
          data: {
            ...getAuthPayload()
          }
        });
        if (result.code !== 0) return;
        const plant = (result.data && result.data.plant) || {};
        this.currentUserPlantId = plant.user_plant_id || '';
        const todayCount = Number((plant.today_action_count || {}).share || 0);
        const dailyLimit = Number((plant.daily_action_limit || {}).share || 1);
        this.shareRewardClaimed = todayCount >= dailyLimit;
      } catch (e) {
        // 静默失败，不阻断排行榜加载
      }
    },
    async rewardShareAction() {
      if (this.shareRewardLoading) return;
      if (!hasLogin()) {
        uni.showToast({ title: '请先登录后再领取奖励', icon: 'none' });
        return;
      }
      this.shareRewardLoading = true;
      try {
        const { result } = await uniCloud.callFunction({
          name: 'plant_action',
          data: {
            ...getAuthPayload(),
            action_type: 'share',
            user_plant_id: this.currentUserPlantId || '',
            request_id: `rank_share_${Date.now()}`
          }
        });
        if (result.code !== 0) {
          uni.showToast({ title: result.msg || '分享奖励领取失败', icon: 'none' });
          return;
        }
        this.pendingShareReward = false;
        const delta = Number((result.data && result.data.growth_delta) || 0);
        if (delta <= 0 || (result.data && result.data.idempotent)) {
          this.shareRewardClaimed = true;
          uni.showToast({ title: '今日分享奖励已领取', icon: 'none' });
          return;
        }
        this.shareRewardClaimed = true;
        uni.showToast({ title: `分享成功 +${delta}`, icon: 'none' });
        await this.loadBoard();
      } catch (e) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
      } finally {
        this.shareRewardLoading = false;
      }
    },
    async loadBoard() {
      this.loading = true;
      try {
        const payload = hasLogin() ? getAuthPayload() : {};
        const { result } = await uniCloud.callFunction({
          name: 'plant_leaderboard',
          data: {
            ...payload,
            limit: 50
          }
        });
        if (result.code !== 0) {
          uni.showToast({ title: result.msg || '加载失败', icon: 'none' });
          return;
        }
        const d = result.data || {};
        this.list = d.list || [];
        this.my_rank = typeof d.my_rank === 'number' ? d.my_rank : null;
        this.my_total_growth = d.my_total_growth || 0;
        this.my_display_name = d.my_display_name || '花友';
      } catch (e) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    getAvatarText(item) {
      const name = (item && item.display_name) || '花友';
      return name.slice(0, 1);
    },
    getName(item) {
      return (item && item.display_name) || '--';
    },
    getScore(item) {
      return (item && item.total_growth) || 0;
    }
  },
  computed: {
    shareButtonText() {
      if (this.shareRewardLoading) return '领奖中...';
      return this.shareRewardClaimed ? '今日已领' : '分享排行榜 +2';
    },
    topThree() {
      const firstThree = this.list.slice(0, 3);
      while (firstThree.length < 3) {
        firstThree.push(null);
      }
      return firstThree;
    },
    gapToPrev() {
      if (!this.list.length || this.my_rank === null || this.my_rank <= 1) return 0;
      const me = this.list.find((item) => item.is_me || item.rank === this.my_rank);
      const prev = this.list.find((item) => item.rank === this.my_rank - 1);
      if (!me || !prev) return 0;
      const gap = Number(prev.total_growth || 0) - Number(me.total_growth || 0);
      return gap > 0 ? gap : 0;
    }
  }
};
</script>

<style>
.page {
  min-height: 100vh;
  background: #e8eef4;
  padding-bottom: calc(env(safe-area-inset-bottom) + 170rpx);
}

.hero-board {
  padding: 24rpx 22rpx 0;
  border-radius: 0 0 40rpx 40rpx;
  background: linear-gradient(150deg, #2583de 0%, #3a98ea 70%);
  position: relative;
  overflow: hidden;
}

.hero-board::after {
  content: '';
  position: absolute;
  right: -56rpx;
  top: -34rpx;
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.hero-date {
  text-align: center;
  font-size: 30rpx;
  color: #70d35c;
  font-weight: 700;
}

.hero-title {
  margin-top: 26rpx;
  font-size: 54rpx;
  color: #fff;
  font-weight: 700;
  position: relative;
  z-index: 2;
}

.hero-sub {
  margin-top: 8rpx;
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.88);
  position: relative;
  z-index: 2;
}

.hero-share-wrap {
  margin-top: 14rpx;
  position: relative;
  z-index: 2;
}

.hero-share-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 58rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  border: 0;
  font-size: 24rpx;
  font-weight: 600;
  color: #1b61ab;
  background: #eaf5ff;
}

.hero-share-btn.claimed {
  color: #6c8196;
  background: rgba(255, 255, 255, 0.8);
}

.hero-share-btn::after {
  border: none;
}

.podium-wrap {
  margin-top: 28rpx;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 10rpx;
  padding-bottom: 18rpx;
  position: relative;
  z-index: 2;
}

.podium-item {
  width: 31%;
  text-align: center;
}

.podium-item.first {
  transform: translateY(-12rpx);
}

.podium-avatar {
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  background: #b6d9c7;
  margin: 0 auto;
  text-align: center;
  line-height: 84rpx;
  font-size: 36rpx;
  color: #39545e;
  border: 4rpx solid rgba(255, 255, 255, 0.55);
}

.podium-avatar.champion {
  width: 102rpx;
  height: 102rpx;
  line-height: 102rpx;
  border-color: #ffd55f;
  background: #fff9df;
}

.podium-name {
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #fff;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.podium-score {
  margin-top: 4rpx;
  font-size: 34rpx;
  color: #ffd34f;
  font-weight: 700;
}

.podium-step {
  margin-top: 8rpx;
  height: 48rpx;
  line-height: 48rpx;
  border-radius: 16rpx 16rpx 0 0;
  background: rgba(255, 255, 255, 0.14);
  color: #cbe6ff;
  font-size: 40rpx;
  font-weight: 700;
}

.my-bar {
  margin: -2rpx 20rpx 20rpx;
  border-radius: 0 0 28rpx 28rpx;
  background: linear-gradient(145deg, #1d70c5 0%, #297fd4 100%);
  display: flex;
  padding: 16rpx 18rpx;
  color: #fff;
  box-shadow: 0 10rpx 20rpx rgba(27, 93, 156, 0.24);
}

.my-stat {
  flex: 1;
}

.my-stat.center {
  text-align: center;
}

.my-stat.right {
  text-align: right;
}

.my-label {
  font-size: 22rpx;
  opacity: 0.92;
}

.my-value {
  margin-top: 4rpx;
  font-size: 52rpx;
  font-weight: 700;
  line-height: 1.05;
}

.my-value.score {
  color: #ffd953;
}

.my-value.up {
  font-size: 40rpx;
}

.list-panel {
  padding: 0 16rpx;
}

.empty {
  text-align: center;
  color: #7c919f;
  font-size: 28rpx;
  padding: 40rpx 0;
}

.rank-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 24rpx;
  margin-bottom: 12rpx;
  padding: 16rpx 18rpx;
  box-shadow: 0 8rpx 16rpx rgba(90, 112, 128, 0.08);
}

.rank-card.me {
  border: 2rpx solid #7bb8f2;
  background: #eaf4fe;
}

.rank-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.rank-num {
  width: 52rpx;
  text-align: center;
  font-size: 34rpx;
  font-weight: 700;
  color: #d09048;
}

.rank-avatar {
  width: 62rpx;
  height: 62rpx;
  line-height: 62rpx;
  text-align: center;
  border-radius: 50%;
  background: #d8ebd7;
  color: #476150;
  font-size: 30rpx;
  margin-right: 12rpx;
}

.rank-meta {
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
}

.me-tag {
  margin-left: 10rpx;
  font-size: 20rpx;
  color: #fff;
  background: #2f85db;
  border-radius: 999rpx;
  padding: 2rpx 10rpx;
}

.rank-name {
  font-size: 30rpx;
  color: #21364a;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-sub {
  margin-top: 4rpx;
  font-size: 23rpx;
  color: #8092a1;
}

.rank-right {
  text-align: right;
}

.rank-score {
  font-size: 40rpx;
  font-weight: 700;
  color: #1956b8;
}

.rank-unit {
  margin-top: 2rpx;
  font-size: 22rpx;
  color: #8ca0b8;
}
</style>
