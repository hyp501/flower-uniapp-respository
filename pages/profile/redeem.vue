<template>
  <view class="page">
    <view class="hero-card">
      <view class="title">鲜花兑换中心</view>
      <view class="subtitle">选择已盛开的花朵，填写收货信息后提交兑换订单</view>
    </view>

    <view class="card">
      <view class="card-title">可兑换花朵</view>
      <view v-if="availableFlowers.length === 0" class="empty">
        暂无可兑换花朵（需花朵进入盛开阶段且未兑换）
      </view>
      <view
        v-for="item in availableFlowers"
        :key="item.user_plant_id"
        class="flower-item"
        :class="{ active: selectedUserPlantId === item.user_plant_id }"
        @click="selectedUserPlantId = item.user_plant_id"
      >
        <view class="flower-name">{{ item.name }}</view>
        <view class="flower-meta">阶段：{{ item.stage_label || item.stage }}</view>
      </view>
    </view>

    <view class="card form-card">
      <view class="card-title">收货信息</view>
      <view class="form-item">
        <view class="label">收货人</view>
        <input v-model.trim="form.consignee" class="input" placeholder="请输入收货人姓名" placeholder-class="input-placeholder" />
      </view>
      <view class="form-item">
        <view class="label">手机号</view>
        <input v-model.trim="form.mobile" class="input" type="number" maxlength="11" placeholder="请输入手机号" placeholder-class="input-placeholder" />
      </view>
      <view class="form-item">
        <view class="label">所在地区</view>
        <input v-model.trim="form.region" class="input" placeholder="如：广东省 深圳市 南山区" placeholder-class="input-placeholder" />
      </view>
      <view class="form-item">
        <view class="label">详细地址</view>
        <textarea v-model.trim="form.address" class="textarea" placeholder="请输入街道、门牌号等详细地址" placeholder-class="input-placeholder" />
      </view>
      <button class="submit-btn" :disabled="loading || availableFlowers.length === 0" @click="submitOrder">
        {{ loading ? '提交中...' : '提交兑换订单' }}
      </button>
    </view>
  </view>
</template>

<script>
import { getAuthPayload, hasLogin } from '@/common/auth.js';

export default {
  data() {
    return {
      loading: false,
      availableFlowers: [],
      selectedUserPlantId: '',
      form: {
        consignee: '',
        mobile: '',
        region: '',
        address: ''
      }
    };
  },
  onLoad(query) {
    this.selectedUserPlantId = (query && query.user_plant_id) || '';
  },
  onShow() {
    if (!hasLogin()) {
      uni.reLaunch({ url: '/pages/auth/login' });
      return;
    }
    this.loadFlowers();
  },
  methods: {
    async loadFlowers() {
      this.loading = true;
      try {
        const { result } = await uniCloud.callFunction({
          name: 'plant_profile',
          data: {
            ...getAuthPayload()
          }
        });
        if (!result || result.code !== 0) {
          uni.showToast({ title: (result && result.msg) || '加载失败', icon: 'none' });
          return;
        }
        const flowers = ((result.data || {}).garden || {}).flowers || [];
        this.availableFlowers = flowers.filter((item) => item.stage === 'bloom' && item.exchange_status !== 'ordered');
        const hasPreset = this.availableFlowers.some((item) => item.user_plant_id === this.selectedUserPlantId);
        if (!hasPreset && this.availableFlowers.length > 0) {
          this.selectedUserPlantId = this.availableFlowers[0].user_plant_id;
        }
      } catch (error) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    validateForm() {
      if (!this.selectedUserPlantId) return '请选择可兑换花朵';
      if (!this.form.consignee) return '请填写收货人';
      if (!/^1\d{10}$/.test(this.form.mobile)) return '请输入正确手机号';
      if (!this.form.region) return '请填写所在地区';
      if (!this.form.address || this.form.address.length < 5) return '请填写详细地址';
      return '';
    },
    async submitOrder() {
      const err = this.validateForm();
      if (err) {
        uni.showToast({ title: err, icon: 'none' });
        return;
      }
      this.loading = true;
      try {
        const { result } = await uniCloud.callFunction({
          name: 'plant_exchange_order',
          data: {
            ...getAuthPayload(),
            user_plant_id: this.selectedUserPlantId,
            consignee: this.form.consignee,
            mobile: this.form.mobile,
            region: this.form.region,
            address: this.form.address
          }
        });
        if (!result || result.code !== 0) {
          uni.showToast({ title: (result && result.msg) || '下单失败', icon: 'none' });
          return;
        }
        uni.showToast({ title: '兑换成功，等待发货', icon: 'none' });
        this.form.address = '';
        this.loadFlowers();
      } catch (error) {
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
  padding: 24rpx;
  background: linear-gradient(180deg, #eef8ef 0%, #f8fcf5 45%, #ffffff 100%);
}

.hero-card,
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(40, 110, 54, 0.07);
  margin-bottom: 18rpx;
}

.form-card {
  padding-bottom: 30rpx;
}

.title {
  font-size: 34rpx;
  font-weight: 700;
  color: #2f4a33;
}

.subtitle {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7d9580;
}

.card-title {
  font-size: 30rpx;
  color: #2f4a33;
  font-weight: 700;
  margin-bottom: 14rpx;
}

.empty {
  font-size: 24rpx;
  color: #8da08f;
}

.flower-item {
  border: 1rpx solid #dce9de;
  border-radius: 16rpx;
  padding: 16rpx;
  margin-bottom: 12rpx;
}

.flower-item.active {
  border-color: #47af63;
  background: #f1fbf3;
}

.flower-name {
  font-size: 28rpx;
  color: #27422c;
  font-weight: 600;
}

.flower-meta {
  margin-top: 6rpx;
  font-size: 23rpx;
  color: #7f9682;
}

.form-item {
  margin-bottom: 22rpx;
}

.label {
  font-size: 26rpx;
  color: #3f5d44;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.input,
.textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1rpx solid #d6e7d8;
  border-radius: 16rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #2a452f;
  background: #fbfefb;
  line-height: 1.2;
}

.input {
  height: 88rpx;
}

.textarea {
  min-height: 220rpx;
  padding: 20rpx;
}

.input-placeholder {
  color: #9cb3a0;
  font-size: 24rpx;
}

.submit-btn {
  margin-top: 14rpx;
  height: 92rpx;
  border-radius: 999rpx;
  background: #47af63;
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
  box-shadow: 0 10rpx 22rpx rgba(71, 175, 99, 0.28);
}
</style>
