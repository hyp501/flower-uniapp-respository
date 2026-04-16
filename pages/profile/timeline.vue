<template>
  <view class="page">
    <view class="header-card">
      <view class="title">成长日志</view>
      <view class="subtitle">记录你照料花朵的每一步</view>
    </view>
    <view v-if="list.length === 0" class="empty-card">暂无行为记录</view>
    <view v-for="item in list" :key="item._id" class="item">
      <view class="top">
        <view class="action-chip">{{ item.action_label }}</view>
        <text class="growth">+{{ item.growth_delta }}</text>
      </view>
      <view class="date">{{ item.action_date }}</view>
    </view>
    <view v-if="hasMore" class="load-more" @click="loadMore">加载更多</view>
  </view>
</template>

<script>
import { getAuthPayload, hasLogin } from '@/common/auth.js';

export default {
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
      if (this.loading) return;
      if (!hasLogin()) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      this.loading = true;
      try {
        const targetPage = reset ? 1 : this.page;
        const { result } = await uniCloud.callFunction({
          name: 'plant_timeline',
          data: {
            ...getAuthPayload(),
            page: targetPage,
            pageSize: this.pageSize
          }
        });
        if (result.code !== 0) {
          uni.showToast({ title: result.msg || '加载失败', icon: 'none' });
          return;
        }
        const payload = result.data || {};
        const incoming = payload.list || [];
        this.total = (payload.pagination || {}).total || 0;
        this.list = reset ? incoming : this.list.concat(incoming);
        this.page = targetPage + 1;
      } catch (error) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
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
</script>

<style>
.page {
  min-height: 100vh;
  padding: 28rpx;
  background: linear-gradient(180deg, #eef8ef 0%, #f8fcf5 45%, #ffffff 100%);
}

.header-card {
  border-radius: var(--pf-radius-card);
  padding: 26rpx;
  margin-bottom: 20rpx;
  background: linear-gradient(145deg, #f6fff6 0%, #ffffff 70%);
  box-shadow: var(--pf-shadow-card);
}

.title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--pf-color-text-main);
}

.subtitle {
  margin-top: 8rpx;
  color: #859888;
  font-size: 24rpx;
}

.empty-card {
  text-align: center;
  color: #91a293;
  margin-top: 120rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  background: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(40, 110, 54, 0.07);
}

.item {
  background: var(--pf-color-surface);
  border-radius: 18rpx;
  margin-bottom: 16rpx;
  padding: 22rpx;
  box-shadow: var(--pf-shadow-card);
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-chip {
  border-radius: var(--pf-radius-pill);
  padding: 8rpx 20rpx;
  font-size: 24rpx;
  background: var(--pf-color-tag);
  color: var(--pf-color-tag-text);
}

.growth {
  color: #2a9d5b;
  font-size: 30rpx;
  font-weight: 700;
}

.date {
  margin-top: 14rpx;
  color: #90a294;
  font-size: 24rpx;
}

.load-more {
  margin: 26rpx auto 20rpx;
  width: 220rpx;
  text-align: center;
  border-radius: var(--pf-radius-pill);
  background: var(--pf-color-primary);
  color: #ffffff;
  font-size: 26rpx;
  padding: 14rpx 0;
}
</style>
