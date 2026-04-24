<template>
  <view class="login-page">
    <view class="status-safe" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="bg-orb orb-1"></view>
    <view class="bg-orb orb-2"></view>
    <view class="bg-orb orb-3"></view>

    <view class="hero-card">
      <view class="brand-row">
        <view class="brand-icon">🌸</view>
        <view class="brand-text">
          <view class="brand-title">花园日记</view>
          <view class="brand-subtitle">欢迎回来，继续照料你的花园</view>
        </view>
      </view>
    </view>

    <view class="form-card">
      <view class="section-title">账号登录</view>

      <view class="input-item">
        <text class="input-label">账号</text>
        <input
          v-model.trim="form.account"
          class="input-control"
          type="text"
          maxlength="40"
          placeholder="请输入用户名/手机号/邮箱"
          placeholder-class="placeholder"
        />
      </view>

      <view class="input-item">
        <text class="input-label">密码</text>
        <input
          v-model.trim="form.password"
          class="input-control"
          :password="!showPwd"
          type="text"
          placeholder="请输入密码"
          placeholder-class="placeholder"
        />
        <text class="pwd-toggle" @click="togglePwd">{{ showPwd ? '隐藏' : '显示' }}</text>
      </view>

      <view class="row-between">
        <label class="remember-wrap" @click="remember = !remember">
          <checkbox :checked="remember" color="#4BAF67" style="transform:scale(0.75)" />
          <text class="remember-text">记住我</text>
        </label>
        <text class="link-text" @click="goRetrieve">忘记密码？</text>
      </view>

      <button class="submit-btn" type="primary" @click="onLoginTap">登录</button>

      <view class="register-row">
        <text class="tips">还没有账号？</text>
        <text class="link-text" @click="goRegister">注册账号</text>
      </view>
    </view>
  </view>
</template>

<script>
import { mutations } from '@/uni_modules/uni-id-pages/common/store.js';

const uniIdCo = uniCloud.importObject('uni-id-co', {
  errorOptions: {
    type: 'toast'
  }
});

export default {
  data() {
    return {
      showPwd: false,
      remember: true,
      form: {
        account: '',
        password: ''
      },
      loading: false,
      statusBarHeight: 20
    };
  },
  onShow(){
    this.initSafeArea();
  },
  methods: {
    initSafeArea() {
      try {
        const info = uni.getSystemInfoSync();
        const height = Number(info && info.statusBarHeight);
        this.statusBarHeight = Number.isFinite(height) && height > 0 ? height : 20;
      } catch (error) {
        this.statusBarHeight = 20;
      }
    },
    togglePwd() {
      this.showPwd = !this.showPwd;
    },
    async onLoginTap() {
      if (this.loading) return;
      if (!this.form.account) {
        uni.showToast({ title: '请输入账号', icon: 'none' });
        return;
      }
      if (!this.form.password) {
        uni.showToast({ title: '请输入密码', icon: 'none' });
        return;
      }
      const data = {
        password: this.form.password
      };
      if (/^1\d{10}$/.test(this.form.account)) {
        data.mobile = this.form.account;
      } else if (/@/.test(this.form.account)) {
        data.email = this.form.account;
      } else {
        data.username = this.form.account;
      }

      this.loading = true;
      try {
        const res = await uniIdCo.login(data);
        mutations.loginSuccess({
          ...res,
          autoBack: false
        });
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/home/index' });
        }, 180);
      } catch (error) {
        // errorOptions=toast，错误提示由uni-id-co统一处理
      } finally {
        this.loading = false;
      }
    },
    goRegister() {
      uni.navigateTo({
        url: '/pages/auth/register'
      });
    },
    goRetrieve() {
      uni.navigateTo({
        url: '/uni_modules/uni-id-pages/pages/retrieve/retrieve'
      });
    }
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: calc(constant(safe-area-inset-top) + 24rpx) 36rpx 56rpx;
  padding: calc(env(safe-area-inset-top) + 24rpx) 36rpx 56rpx;
  background: linear-gradient(180deg, #f0fbf2 0%, #f8fcf6 42%, #ffffff 100%);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(2rpx);
}

.orb-1 {
  width: 320rpx;
  height: 320rpx;
  background: rgba(105, 200, 117, 0.2);
  top: -120rpx;
  right: -80rpx;
}

.orb-2 {
  width: 220rpx;
  height: 220rpx;
  background: rgba(123, 200, 255, 0.18);
  left: -90rpx;
  top: 280rpx;
}

.orb-3 {
  width: 180rpx;
  height: 180rpx;
  background: rgba(255, 195, 111, 0.2);
  right: -50rpx;
  bottom: 230rpx;
}

.hero-card {
  position: relative;
  z-index: 2;
  margin-bottom: 28rpx;
}

.brand-row {
  display: flex;
  align-items: center;
}

.brand-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #7ed488 0%, #4aaf66 100%);
  color: #fff;
  font-size: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 28rpx rgba(68, 170, 97, 0.24);
  margin-right: 20rpx;
}

.brand-title {
  font-size: 44rpx;
  line-height: 1.2;
  font-weight: 700;
  color: #203322;
}

.brand-subtitle {
  margin-top: 10rpx;
  font-size: 25rpx;
  color: #6c7f6f;
}

.form-card {
  position: relative;
  z-index: 2;
  border-radius: 30rpx;
  background: #fff;
  padding: 34rpx 30rpx 30rpx;
  box-shadow: 0 18rpx 42rpx rgba(29, 95, 43, 0.08);
}

.section-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #2a3f2f;
  margin-bottom: 24rpx;
}

.input-item {
  position: relative;
  margin-bottom: 20rpx;
}

.input-label {
  display: block;
  font-size: 24rpx;
  color: #6d7f70;
  margin-bottom: 10rpx;
}

.input-control {
  width: 100%;
  height: 90rpx;
  border: 2rpx solid #e4efdf;
  border-radius: 22rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
  font-size: 30rpx;
  color: #2c3d2e;
  background: #f9fdf8;
}

.placeholder {
  color: #aec1b1;
}

.pwd-toggle {
  position: absolute;
  right: 22rpx;
  bottom: 27rpx;
  font-size: 24rpx;
  color: #47af63;
}

.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.remember-wrap {
  display: flex;
  align-items: center;
}

.remember-text {
  margin-left: 8rpx;
  color: #667a69;
  font-size: 24rpx;
}

.link-text {
  color: #47af63;
  font-size: 24rpx;
}

.submit-btn {
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #5bc06f 0%, #41a95c 100%);
  border: none;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 14rpx 26rpx rgba(74, 168, 91, 0.26);
}

.register-row {
  margin-top: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.tips {
  font-size: 24rpx;
  color: #8fa292;
}
</style>
