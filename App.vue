<script>
  import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update';
  export default {
    onLaunch: async function() {
      console.log('App Launch')
		// #ifdef MP-WEIXIN
		uniCloud.initSecureNetworkByWeixin()
		// #endif
      checkUpdate() //更新升级
    },
    mounted() {
      // #ifdef H5
      //const VConsole = require('@/common/js/vconsole.min.js')
      //new VConsole()
      // #endif
    },
    onShow: function() {
      console.log('App Show')
    },
    onHide: function() {
      console.log('App Hide')
    }
  }
</script>

<style>
  /*每个页面公共css */
  /* #ifndef APP-NVUE */
  page {
    --pf-color-primary: #47af63;
    --pf-color-primary-dark: #2d7a42;
    --pf-color-text-main: #2a4d34;
    --pf-color-text-sub: #819482;
    --pf-color-bg-soft: #f8fcf5;
    --pf-color-surface: #ffffff;
    --pf-color-tag: #e5f6e9;
    --pf-color-tag-text: #2e7f44;
    --pf-radius-card: 24rpx;
    --pf-radius-pill: 999rpx;
    --pf-shadow-card: 0 10rpx 30rpx rgba(37, 110, 52, 0.08);
  }

  view {
    box-sizing: border-box;
  }

  @font-face {
    font-family: "iconfont";
    src: url('https://at.alicdn.com/t/font_2354462_s00xh8caffp.ttf');
  }

  .ico {
    font-family: iconfont;
  }

  /* #endif */
</style>
