<template>
  <view class="page">
    <view class="hero-card">
      <view class="hero-title">花园成长规则</view>
      <view class="hero-subtitle">照料越用心，花朵成长越快</view>
    </view>

    <view class="card">
      <view class="section-title">动作得分</view>
      <view class="score-grid">
        <view class="score-item">
          <view class="score-icon">💧</view>
          <view class="score-name">浇水</view>
          <view class="score-value">+1</view>
        </view>
        <view class="score-item">
          <view class="score-icon">🧪</view>
          <view class="score-name">施肥</view>
          <view class="score-value">+2</view>
        </view>
        <view class="score-item">
          <view class="score-icon">🌿</view>
          <view class="score-name">除草</view>
          <view class="score-value">+1</view>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="section-title">阶段成长</view>
      <view class="timeline">
        <view class="timeline-row">
          <view class="dot"></view>
          <view class="line"></view>
          <view class="dot"></view>
          <view class="line"></view>
          <view class="dot"></view>
        </view>
        <view class="timeline-labels">
          <view class="timeline-label">种子 0分</view>
          <view class="timeline-label">幼苗 9分</view>
          <view class="timeline-label">开花 18分</view>
        </view>
      </view>
      <view class="highlight">每达到 9 分，花朵成长到下一阶段</view>
    </view>

    <view class="card">
      <view class="section-title">详细说明</view>
      <view class="rule-item">
        <text class="rule-index">1.</text>
        <text class="rule-text">每位用户都会拥有自己的花园，花园内默认有多种花可照料。</text>
      </view>
      <view class="rule-item">
        <text class="rule-index">2.</text>
        <text class="rule-text">每种养护动作每天有次数限制，达到上限后当日不可重复操作。</text>
      </view>
      <view class="rule-item">
        <text class="rule-index">3.</text>
        <text class="rule-text">可在首页切换当前照料的花，养护分值仅对当前选中的花生效。</text>
      </view>
      <view class="rule-item">
        <text class="rule-index">4.</text>
        <text class="rule-text">阶段成长顺序为：种子 - 幼苗 - 开花，照料记录会体现在成长日志。</text>
      </view>
    </view>

    <view class="tip-card">小提示：优先施肥可以更快进入下一阶段。</view>
  </view>
</template>

<script>
export default {};
</script>

<style>
.page {
  min-height: 100vh;
  padding: 28rpx;
  background: linear-gradient(180deg, #edf8ef 0%, #f8fcf5 45%, #ffffff 100%);
}

.hero-card,
.card {
  background: var(--pf-color-surface);
  border-radius: var(--pf-radius-card);
  padding: 30rpx;
  box-shadow: var(--pf-shadow-card);
  margin-bottom: 22rpx;
}

.hero-card {
  background: linear-gradient(145deg, #f2fff2 0%, #ffffff 65%);
}

.hero-title {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--pf-color-text-main);
}

.hero-subtitle {
  margin-top: 12rpx;
  color: #6f8574;
  font-size: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--pf-color-text-main);
  margin-bottom: 18rpx;
}

.score-grid {
  display: flex;
  gap: 14rpx;
}

.score-item {
  flex: 1;
  border-radius: 16rpx;
  background: #f5fbf5;
  border: 2rpx solid #deefe0;
  padding: 16rpx 10rpx;
  text-align: center;
}

.score-icon {
  font-size: 42rpx;
}

.score-name {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #4f6a55;
}

.score-value {
  margin-top: 8rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: var(--pf-color-primary-dark);
}

.timeline {
  padding: 8rpx 4rpx 0;
}

.timeline-row {
  display: flex;
  align-items: center;
}

.dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 9rpx;
  background: #49b468;
}

.line {
  flex: 1;
  height: 6rpx;
  border-radius: 3rpx;
  background: #bfe6c9;
}

.timeline-labels {
  margin-top: 14rpx;
  display: flex;
  justify-content: space-between;
}

.timeline-label {
  font-size: 22rpx;
  color: #65816c;
}

.highlight {
  margin-top: 16rpx;
  border-radius: 14rpx;
  background: #edf9ef;
  color: #2f7142;
  font-size: 24rpx;
  padding: 14rpx 16rpx;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  padding: 14rpx 0;
}

.rule-index {
  width: 36rpx;
  font-size: 26rpx;
  line-height: 40rpx;
  color: var(--pf-color-primary-dark);
  font-weight: 700;
}

.rule-text {
  flex: 1;
  font-size: 26rpx;
  line-height: 40rpx;
  color: #4a6351;
}

.tip-card {
  border-radius: var(--pf-radius-card);
  background: #f3fbf2;
  color: #4b6d54;
  font-size: 24rpx;
  padding: 22rpx 24rpx;
  border: 2rpx dashed #cde7d4;
}
</style>
