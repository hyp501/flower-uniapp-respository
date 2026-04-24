<template>
  <view class="register-page">
   <view class="status-safe" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="bg-orb orb-1"></view>
    <view class="bg-orb orb-2"></view>
    <view class="bg-orb orb-3"></view>

    <view class="hero-card">
      <view class="brand-row">
        <view class="brand-icon">🌱</view>
        <view class="brand-text">
          <view class="brand-title">创建花园账号</view>
          <view class="brand-subtitle">注册后即可记录和养护你的花朵</view>
        </view>
      </view>
    </view>

    <view class="form-card">
      <view class="section-title">账号注册</view>

      <view class="input-item">
        <text class="input-label">用户名</text>
        <input
          v-model.trim="form.username"
          class="input-control"
          type="text"
          maxlength="20"
          placeholder="请输入用户名（4-16位）"
          placeholder-class="placeholder"
        />
      </view>

      <view class="input-item">
        <text class="input-label">昵称</text>
        <input
          v-model.trim="form.nickname"
          class="input-control"
          type="text"
          maxlength="20"
          placeholder="请输入昵称（可选）"
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
          maxlength="20"
          placeholder="请输入6-16位密码"
          placeholder-class="placeholder"
        />
        <text class="pwd-toggle" @click="showPwd = !showPwd">{{ showPwd ? '隐藏' : '显示' }}</text>
      </view>

      <view class="input-item">
        <text class="input-label">确认密码</text>
        <input
          v-model.trim="form.password2"
          class="input-control"
          :password="!showPwd2"
          type="text"
          maxlength="20"
          placeholder="请再次输入密码"
          placeholder-class="placeholder"
        />
        <text class="pwd-toggle" @click="showPwd2 = !showPwd2">{{ showPwd2 ? '隐藏' : '显示' }}</text>
      </view>

      <view class="input-item">
        <text class="input-label">图形验证码</text>
        <uni-captcha ref="captcha" scene="register" v-model="form.captcha" />
      </view>

      <button class="submit-btn" type="primary" @click="onRegisterTap">注册并登录</button>

      <view class="register-row">
        <text class="tips">已有账号？</text>
        <text class="link-text" @click="goLogin">去登录</text>
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
      showPwd2: false,
      loading: false,
      form: {
        username: '',
        nickname: '',
        password: '',
        password2: '',
        captcha: ''
      },
      statusBarHeight:20
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
    async onRegisterTap() {
      if (this.loading) return;
      if (!this.form.username) {
        uni.showToast({ title: '请输入用户名', icon: 'none' });
        return;
      }
      if (!this.form.password) {
        uni.showToast({ title: '请输入密码', icon: 'none' });
        return;
      }
      if (!this.form.password2) {
        uni.showToast({ title: '请再次输入密码', icon: 'none' });
        return;
      }
      if (this.form.password !== this.form.password2) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' });
        return;
      }
      if (this.form.captcha.length !== 4) {
        uni.showToast({ title: '请输入4位验证码', icon: 'none' });
        if (this.$refs.captcha) {
          this.$refs.captcha.getImageCaptcha();
        }
        return;
      }

      this.loading = true;
      try {
        const res = await uniIdCo.registerUser({
          username: this.form.username,
          nickname: this.form.nickname,
          password: this.form.password,
          password2: this.form.password2,
          captcha: this.form.captcha
        });
        mutations.loginSuccess({
          ...res,
          toastText: '注册成功',
          autoBack: false
        });
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/home/index' });
        }, 180);
      } catch (error) {
        if (this.$refs.captcha) {
          this.$refs.captcha.getImageCaptcha();
        }
      } finally {
        this.loading = false;
      }
    },
    goLogin() {
      uni.navigateBack();
    }
  }
};
</script>

<style scoped>
.register-page {
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

.submit-btn {
  margin-top: 8rpx;
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

.link-text {
  color: #47af63;
  font-size: 24rpx;
}
</style>
