<template>
  <view class="page">


    <view class="hero">
      <view class="status-safe" :style="{ height: statusBarHeight + 'px' }"></view>
      <view class="hero-title-row">
        <view class="hero-title-wrap">
          <text class="hero-flower">✿</text>
          <text class="hero-title">种子商店</text>
        </view>
        <view class="score-pill">🌸 {{ totalGrowth }} 积分</view>
      </view>
      <view class="hero-sub">选一颗种子，开始你的故事</view>
    </view>

    <scroll-view class="category-scroll" scroll-x show-scrollbar="false">
      <view class="category-row">
        <view
          v-for="item in categories"
          :key="item.key"
          class="category-pill"
          :class="{ active: activeCategory === item.key }"
          @click="activeCategory = item.key"
        >
          {{ item.label }}
        </view>
      </view>
    </scroll-view>

    <view class="card-grid">
      <view v-for="seed in filteredSeeds" :key="seed.key" class="seed-card">
        <view class="seed-hero" :style="{ background: seed.bgColor }">
          <view v-if="seed.tag" class="seed-tag" :style="{ background: seed.tagColor }">{{ seed.tag }}</view>
          <image v-if="seed.image" class="seed-image" :src="seed.image" mode="aspectFit"></image>
          <text v-else class="seed-emoji">{{ seed.emoji }}</text>
        </view>
        <view class="seed-body">
          <view class="seed-name">{{ seed.name }}</view>
          <view class="seed-desc">{{ seed.desc }}</view>
          <view class="seed-foot">
            <view class="seed-price">🌸 {{ seed.price }}</view>
            <view
              class="plant-btn"
              :class="{ disabled: !seed.available || !isSeedUnlocked(seed) || loading }"
              @click="onPlantSeed(seed)"
            >
              {{ getPlantButtonText(seed) }}
            </view>
          </view>
        </view>
      </view>
    </view>

    <bottom-menu active-key="seed" />
  </view>
</template>

<script>
import { getAuthPayload, hasLogin } from '@/common/auth.js';
import BottomMenu from '@/components/bottom-menu/index.vue';
const FLOWER_IMAGE_MAP = {
  'rose-basic': '/static/flowers/rose.svg',
  'sunflower-basic': '/static/flowers/sunflower.svg',
  'lily-basic': '/static/flowers/lily.svg',
  'tulip-pink': '/static/flowers/lily.svg',
  'carnation-red': '/static/flowers/rose.svg',
  'lavender-purple': '/static/flowers/lily.svg',
  'hydrangea-blue': '/static/flowers/lily.svg',
  'peony-pink': '/static/flowers/rose.svg',
  'camellia-red': '/static/flowers/rose.svg',
  'jasmine-white': '/static/flowers/lily.svg',
  'orchid-green': '/static/flowers/lily.svg',
  'hibiscus-red': '/static/flowers/rose.svg',
  'azalea-pink': '/static/flowers/rose.svg',
  'plumeria-yellow': '/static/flowers/sunflower.svg',
  'dahlia-red': '/static/flowers/rose.svg',
  'lotus-pink': '/static/flowers/lily.svg',
  'cherry-blossom': '/static/flowers/rose.svg',
  'wisteria-violet': '/static/flowers/lily.svg',
  'iris-blue': '/static/flowers/lily.svg',
  'magnolia-white': '/static/flowers/lily.svg'
};
const FLOWER_EMOJI_MAP = {
  'rose-basic': '🌹',
  'sunflower-basic': '🌻',
  'lily-basic': '💮',
  'tulip-pink': '🌷',
  'carnation-red': '💐',
  'lavender-purple': '🪻',
  'hydrangea-blue': '🩵',
  'peony-pink': '🌸',
  'camellia-red': '🌺',
  'jasmine-white': '🤍',
  'orchid-green': '🪴',
  'hibiscus-red': '🌺',
  'azalea-pink': '🌸',
  'plumeria-yellow': '🌼',
  'dahlia-red': '🌼',
  'lotus-pink': '🪷',
  'cherry-blossom': '🌸',
  'wisteria-violet': '🪻',
  'iris-blue': '💠',
  'magnolia-white': '🤍'
};
const CATEGORY_META = {
  rose: { label: '玫瑰系', icon: '🌹' },
  sunflower: { label: '向日系', icon: '🌻' },
  lily: { label: '百合系', icon: '💮' },
  tulip: { label: '郁金系', icon: '🌷' },
  carnation: { label: '康乃馨系', icon: '💐' },
  lavender: { label: '薰衣草系', icon: '🪻' },
  hydrangea: { label: '绣球系', icon: '🌸' },
  peony: { label: '牡丹系', icon: '🌸' },
  camellia: { label: '山茶系', icon: '🌺' },
  jasmine: { label: '茉莉系', icon: '🤍' },
  orchid: { label: '兰花系', icon: '🪴' },
  hibiscus: { label: '扶桑系', icon: '🌺' },
  azalea: { label: '杜鹃系', icon: '🌸' },
  plumeria: { label: '鸡蛋花系', icon: '🌼' },
  dahlia: { label: '大丽花系', icon: '🌼' },
  lotus: { label: '荷花系', icon: '🪷' },
  cherry: { label: '樱花系', icon: '🌸' },
  wisteria: { label: '紫藤系', icon: '🪻' },
  iris: { label: '鸢尾系', icon: '💠' },
  magnolia: { label: '玉兰系', icon: '🤍' },
  other: { label: '其他', icon: '🌸' }
};
const BG_COLORS = ['#f8d9e6', '#f4f2d9', '#ead8f7', '#d8f0de', '#f9dde8', '#e3ddf6'];
const TAG_STYLES = [
  { label: '热门', color: '#f2bc2f' },
  { label: '新品', color: '#ea78b5' },
  { label: '稀有', color: '#9b63dc' },
  { label: '限定', color: '#e76472' }
];

export default {
  components: {
    BottomMenu
  },
  data() {
    return {
      loading: false,
      activeCategory: 'all',
      totalGrowth: 0,
      userLevel: 1,
      currentUserPlantId: '',
      seeds: [],
      statusBarHeight: 20
    };
  },
  computed: {
    categories() {
      const seen = {};
      const list = [{ key: 'all', label: '全部' }];
      this.seeds.forEach((item) => {
        if (!item.category || seen[item.category]) return;
        seen[item.category] = true;
        list.push({
          key: item.category,
          label: `${item.categoryIcon || '🌸'} ${item.categoryLabel || item.category}`
        });
      });
      return list;
    },
    filteredSeeds() {
      if (this.activeCategory === 'all') return this.seeds;
      return this.seeds.filter((item) => item.category === this.activeCategory);
    }
  },
  onShow() {
    this.initSafeArea();
    if (!hasLogin()) {
      uni.redirectTo({ url: '/pages/auth/login' });
      return;
    }
    this.loadProfile();
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
    async loadProfile() {
      if (!hasLogin()) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      this.loading = true;
      try {
        const { result } = await uniCloud.callFunction({
          name: 'plant_profile',
          data: {
            ...getAuthPayload()
          }
        });
        if (result.code !== 0) {
          uni.showToast({ title: result.msg || '加载失败', icon: 'none' });
          return;
        }
        this.totalGrowth = ((result.data || {}).user || {}).total_growth || 0;
        this.userLevel = Number((((result.data || {}).user || {}).user_level) || 1);
        const garden = (result.data || {}).garden || {};
        this.currentUserPlantId = garden.current_user_plant_id || '';
        const seedCatalog = (result.data || {}).seed_catalog || [];
        this.seeds = seedCatalog.map((item, index) => this.toSeedCard(item, index));
        if (this.activeCategory !== 'all' && !this.seeds.some((item) => item.category === this.activeCategory)) {
          this.activeCategory = 'all';
        }
      } catch (error) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    toSeedCard(item, index) {
      const code = item.code || '';
      const category = this.getCategory(code);
      const isPlanted = item.is_planted === true;
      const isCurrent = isPlanted && (
        !!item.is_current || (item.user_plant_id && item.user_plant_id === this.currentUserPlantId)
      );
      const tagMeta = item.tag
        ? { label: item.tag, color: item.tagColor || '#caa27b' }
        : TAG_STYLES[index % TAG_STYLES.length];
      return {
        key: code || item.plant_id || item.user_plant_id || `seed-${index}`,
        code,
        plant_id: item.plant_id || '',
        user_plant_id: item.user_plant_id,
        name: item.name || '未命名花种',
        desc: item.description || '开始种植后即可解锁成长旅程',
        price: Math.max(0, Math.floor(Number(item.price) || 0)),
        unlock_level: Number(item.unlock_level) > 0 ? Number(item.unlock_level) : 1,
        bgColor: BG_COLORS[index % BG_COLORS.length],
        image: FLOWER_IMAGE_MAP[code] || '',
        emoji: FLOWER_EMOJI_MAP[code] || this.getCategoryIcon(category),
        available: item.is_enabled !== false,
        is_planted: isPlanted,
        is_current: isCurrent,
        category,
        categoryLabel: this.getCategoryLabel(category),
        categoryIcon: this.getCategoryIcon(category),
        tag: tagMeta.label,
        tagColor: tagMeta.color
      };
    },
    getCategory(code) {
      if (!code) return 'other';
      return code.split('-')[0] || 'other';
    },
    getCategoryLabel(category) {
      const meta = CATEGORY_META[category];
      if (meta && meta.label) return meta.label;
      return `${category}系`;
    },
    getCategoryIcon(category) {
      const meta = CATEGORY_META[category];
      return (meta && meta.icon) || '🌸';
    },
    getPlantButtonText(seed) {
      if (!seed.available) return '暂不可用';
      if (!this.isSeedUnlocked(seed)) return `Lv${seed.unlock_level}解锁`;
      if (seed.is_planted) return '已种下';
      return '种下';
    },
    isSeedUnlocked(seed) {
      return this.userLevel >= (Number(seed.unlock_level) || 1);
    },
    async onPlantSeed(seed) {
      if (!seed.available) {
        uni.showToast({ title: '该种子暂未开放', icon: 'none' });
        return;
      }
      if (!this.isSeedUnlocked(seed)) {
        uni.showToast({ title: `达到Lv${seed.unlock_level}后解锁`, icon: 'none' });
        return;
      }
      if (!seed.user_plant_id && !seed.plant_id && !seed.code) {
        uni.showToast({ title: '种子数据异常，请刷新', icon: 'none' });
        return;
      }
      if (seed.is_planted) {
        uni.showToast({ title: '这颗种子已经种下啦', icon: 'none' });
        return;
      }
      if (this.loading) return;
      this.loading = true;
      try {
        const { result } = await uniCloud.callFunction({
          name: 'plant_select_seed',
          data: {
            ...getAuthPayload(),
            user_plant_id: seed.user_plant_id || '',
            plant_id: seed.plant_id || '',
            code: seed.code || ''
          }
        });
        if (result.code !== 0) {
          uni.showToast({ title: result.msg || '种下失败', icon: 'none' });
          return;
        }
        this.currentUserPlantId = (result.data && result.data.user_plant_id) || seed.user_plant_id;
        uni.showToast({ title: `已种下${seed.name}`, icon: 'none' });
        await this.loadProfile();
      } catch (error) {
        uni.showToast({ title: '网络异常，请重试', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    goBack() {
      const pages = getCurrentPages();
      if (pages && pages.length > 1) {
        uni.navigateBack();
        return;
      }
      this.goGarden();
    },
    goGarden() {
      uni.switchTab({ url: '/pages/home/index' });
 
    }
  }
};
</script>

<style>
.page {
  min-height: 100vh;
  background: #f4e7d6;
  padding:0;
  /* padding: calc(env(safe-area-inset-top) + 96rpx) 0 calc(env(safe-area-inset-bottom) + 128rpx); */
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  height: calc(env(safe-area-inset-top) + 88rpx);
  padding-top: env(safe-area-inset-top);
  background: #ba8f65;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 24rpx;
  padding-right: 24rpx;
}

.back-btn {
  min-width: 120rpx;
  color: #ffffff;
  font-size: 27rpx;
  font-weight: 600;
}

.nav-title {
  color: #fff;
  font-size: 29rpx;
  font-weight: 700;
}

.nav-placeholder {
  min-width: 120rpx;
}

.top-strip {
  text-align: center;
  color: #5ec05f;
  font-weight: 700;
  font-size: 28rpx;
  padding: 16rpx 0 18rpx;
}

.hero {
  background: #ba8f65;
 
  padding: 36rpx 24rpx 20rpx;
  position: relative;
  overflow: hidden;
}

.status-safe {
  width: 100%;
}

.hero::after {
  content: '';
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  position: absolute;
  right: -60rpx;
  top: -32rpx;
}

.hero-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-title-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.hero-flower {
  color: #ff58b0;
  font-size: 24rpx;
}

.hero-title {
  font-size: 36rpx;
  color: #fff;
  font-weight: 700;
}

.score-pill {
  background: rgba(255, 244, 235, 0.3);
  border-radius: 999rpx;
  padding: 8rpx 16rpx;
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  position: relative;
  z-index: 1;
}

.hero-sub {
  margin-top: 10rpx;
  color: rgba(255, 255, 255, 0.82);
  font-size: 22rpx;
  margin-bottom: 0;
  position: relative;
  z-index: 1;
}

.category-scroll {
  margin: 0 22rpx;
  background: #f4e7d6;
  white-space: nowrap;
}

.category-row {
  display: flex;
  gap: 12rpx;
  padding: 16rpx 2rpx 18rpx;
  width: max-content;
}

.category-pill {
  min-width: 116rpx;
  text-align: center;
  background: #fff;
  border-radius: 999rpx;
  padding: 10rpx 16rpx;
  font-size: 20rpx;
  font-weight: 600;
  color: #7e5f43;
  border: 2rpx solid #d7c4ad;
}

.category-pill.active {
  background: #9f7249;
  color: #fff;
  border-color: #9f7249;
}

.card-grid {
  margin: 0 22rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx 14rpx;
  padding-bottom: 8rpx;
}

.seed-card {
  width: calc((100% - 14rpx) / 2);
  border-radius: 28rpx;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 8rpx 18rpx rgba(107, 80, 47, 0.08);
}

.seed-hero {
  height: 176rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seed-tag {
  position: absolute;
  left: 12rpx;
  top: 12rpx;
  color: #fff;
  font-size: 18rpx;
  font-weight: 700;
  line-height: 1;
  padding: 7rpx 12rpx;
  border-radius: 14rpx;
}

.seed-image {
  width: 100rpx;
  height: 100rpx;
}

.seed-emoji {
  font-size: 74rpx;
}

.seed-body {
  background: #fff;
  padding: 16rpx 16rpx 16rpx;
}

.seed-name {
  color: #34403a;
  font-size: 27rpx;
  font-weight: 700;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seed-desc {
  margin-top: 6rpx;
  color: #8da09a;
  font-size: 19rpx;
  margin-bottom: 0;
  min-height: 52rpx;
  line-height: 1.38;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.seed-foot {
  margin-top: 12rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
}

.seed-price {
  color: #9f5b43;
  font-size: 30rpx;
  font-weight: 700;
  white-space: nowrap;
}

.plant-btn {
  background: linear-gradient(180deg, #b6875e 0%, #9f7149 100%);
  color: #fff;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 700;
  min-width: 88rpx;
  text-align: center;
  padding: 8rpx 14rpx;
  line-height: 1.25;
  white-space: nowrap;
  box-shadow: 0 6rpx 10rpx rgba(141, 99, 58, 0.18);
}

.plant-btn.disabled {
  background: #cbc0b3;
  box-shadow: none;
}

</style>
