<template>
  <view class="page">
    <view v-if="my_rank !== null" class="sticky-me">
      <view class="me-card" :class="{ highlight: true }">
        <view class="me-rank">#{{ my_rank }}</view>
        <view class="me-info">
          <view class="me-name">{{ my_display_name }}</view>
          <view class="me-sub">我的累计成长值</view>
        </view>
        <view class="me-score">{{ my_total_growth }}</view>
      </view>
    </view>

    <view class="card list-card">
      <view class="panel-head">
        <view class="panel-title-wrap">
          <view class="panel-dot"></view>
          <view class="panel-title">成长值排行榜</view>
        </view>
        <view class="panel-meta">TOP {{ list.length }}</view>
      </view>

      <view v-if="loading" class="empty">加载中...</view>
      <view v-else-if="!list.length" class="empty">暂无排行数据，快去花园积累成长值吧</view>
      <view v-else class="rank-list">
        <view
          v-for="item in list"
          :key="item.rank + '-' + item.display_name"
          class="rank-row"
          :class="{ me: item.is_me, top3: item.rank <= 3 }"
        >
          <view class="rank-num">
            <text v-if="item.rank === 1" class="medal">🥇</text>
            <text v-else-if="item.rank === 2" class="medal">🥈</text>
            <text v-else-if="item.rank === 3" class="medal">🥉</text>
            <text v-else class="rank-text">{{ item.rank }}</text>
          </view>
          <view class="rank-name">{{ item.display_name }}</view>
          <view class="rank-growth">{{ item.total_growth }}</view>
        </view>
      </view>
    </view>

    <view class="tip">按累计成长值从高到低排序，相同分值按注册先后。</view>
  </view>
</template>

<script>
import { getAuthPayload, hasLogin } from '@/common/auth.js';

export default {
  data() {
    return {
      loading: false,
      list: [],
      my_rank: null,
      my_total_growth: 0,
      my_display_name: '花友'
    };
  },
  onShow() {
    this.loadBoard();
  },
  onPullDownRefresh() {
    this.loadBoard().finally(() => {
      uni.stopPullDownRefresh();
    });
  },
  methods: {
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
    }
  }
};
</script>

<style>
.page {
  min-height: 100vh;
  padding: 28rpx;
  padding-bottom: 48rpx;
  background: linear-gradient(180deg, #edf8ef 0%, #f8fcf5 40%, #ffffff 100%);
}

.sticky-me {
  margin-bottom: 22rpx;
}

.me-card {
  display: flex;
  align-items: center;
  border-radius: var(--pf-radius-card);
  padding: 22rpx 24rpx;
  background: linear-gradient(135deg, #e8f8ed 0%, #ffffff 70%);
  box-shadow: var(--pf-shadow-card);
  border: 2rpx solid #c8e9d2;
}

.me-card.highlight {
  border-color: #7bc990;
}

.me-rank {
  width: 72rpx;
  font-size: 34rpx;
  font-weight: 800;
  color: var(--pf-color-primary-dark);
}

.me-info {
  flex: 1;
  min-width: 0;
}

.me-name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--pf-color-text-main);
}

.me-sub {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #7a9280;
}

.me-score {
  font-size: 40rpx;
  font-weight: 800;
  color: var(--pf-color-primary-dark);
}

.list-card {
  background: var(--pf-color-surface);
  border-radius: var(--pf-radius-card);
  padding: 28rpx;
  box-shadow: var(--pf-shadow-card);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
}

.panel-title-wrap {
  display: flex;
  align-items: center;
}

.panel-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 7rpx;
  margin-right: 10rpx;
  background: linear-gradient(180deg, #5ec57c 0%, #3da85e 100%);
}

.panel-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--pf-color-text-main);
}

.panel-meta {
  font-size: 22rpx;
  color: #6f8a76;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #edf7f0;
}

.empty {
  text-align: center;
  color: #8aa08e;
  font-size: 26rpx;
  padding: 40rpx 0;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.rank-row {
  display: flex;
  align-items: center;
  padding: 18rpx 16rpx;
  border-radius: 16rpx;
  background: #f8fbf7;
  border: 2rpx solid #e8f2ea;
}

.rank-row.top3 {
  background: linear-gradient(90deg, #fff9e8 0%, #f8fcf7 100%);
  border-color: #f0e6c8;
}

.rank-row.me {
  border-color: #7bc990;
  background: #eef9f1;
}

.rank-num {
  width: 72rpx;
  text-align: center;
}

.medal {
  font-size: 36rpx;
}

.rank-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #6b8574;
}

.rank-name {
  flex: 1;
  font-size: 28rpx;
  color: #2f5f3c;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-growth {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--pf-color-primary-dark);
}

.tip {
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #8ca18f;
  text-align: center;
  line-height: 1.5;
}
</style>
