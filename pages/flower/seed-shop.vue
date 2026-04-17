<template>
  <view class="page">
    <view class="nav-bar">
      <view class="back-btn" @click="goBack">‹ 返回</view>
      <view class="nav-title">种子商店</view>
      <view class="nav-placeholder"></view>
    </view>


    <view class="hero">
      <view class="hero-title-row">
        <view class="hero-title-wrap">
          <text class="hero-flower">✿</text>
          <text class="hero-title">种子商店</text>
        </view>
        <view class="score-pill">🌸 {{ totalGrowth }} 积分</view>
      </view>
      <view class="hero-sub">选一颗种子，开始你的故事</view>
    </view>

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
  'lily-basic': '/static/flowers/lily.svg'
};
const BG_COLORS = ['#f2c9da', '#ececc9', '#f5d8e1', '#d6c4ea', '#cfe5d5', '#d8d0ea'];

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
      seeds: []
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
    if (!hasLogin()) {
      uni.redirectTo({ url: '/pages/auth/login' });
      return;
    }
    this.loadProfile();
  },
  methods: {
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
      return {
        key: code || item.plant_id || item.user_plant_id || `seed-${index}`,
        code,
        plant_id: item.plant_id || '',
        user_plant_id: item.user_plant_id,
        name: item.name || '未命名花种',
        desc: item.description || '开始种植后即可解锁成长旅程',
        price: 0,
        unlock_level: Number(item.unlock_level) > 0 ? Number(item.unlock_level) : 1,
        bgColor: BG_COLORS[index % BG_COLORS.length],
        image: FLOWER_IMAGE_MAP[code] || '',
        emoji: '🌸',
        available: item.is_enabled !== false,
        category,
        categoryLabel: this.getCategoryLabel(category),
        categoryIcon: this.getCategoryIcon(category)
      };
    },
    getCategory(code) {
      if (!code) return 'other';
      return code.split('-')[0] || 'other';
    },
    getCategoryLabel(category) {
      const map = {
        rose: '玫瑰系',
        sunflower: '向日系',
        lily: '百合系',
        other: '其他'
      };
      return map[category] || `${category}系`;
    },
    getCategoryIcon(category) {
      const map = {
        rose: '🌹',
        sunflower: '🌻',
        lily: '💮',
        other: '🌸'
      };
      return map[category] || '🌸';
    },
    getPlantButtonText(seed) {
      if (!seed.available) return '暂不可用';
      if (!this.isSeedUnlocked(seed)) return `Lv${seed.unlock_level}解锁`;
      if (seed.user_plant_id === this.currentUserPlantId) return '已种下';
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
      if (!seed.user_plant_id) {
        uni.showToast({ title: '种子数据异常，请刷新', icon: 'none' });
        return;
      }
      if (seed.user_plant_id === this.currentUserPlantId) {
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
  background: linear-gradient(180deg, #0f391d 0%, #225226 20%, #f2e8d8 20%, #f2e8d8 100%);
  padding: calc(env(safe-area-inset-top) + 96rpx) 0 calc(env(safe-area-inset-bottom) + 128rpx);
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  height: calc(env(safe-area-inset-top) + 88rpx);
  padding-top: env(safe-area-inset-top);
  background: #173f1f;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 24rpx;
  padding-right: 24rpx;
}

.back-btn {
  min-width: 120rpx;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;
}

.nav-title {
  color: #d8f2d7;
  font-size: 30rpx;
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
  margin: 0 22rpx;
  background: linear-gradient(180deg, #bc9168 0%, #b68961 100%);
  border-radius: 36rpx 36rpx 0 0;
  padding: 30rpx 24rpx 26rpx;
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: '';
  width: 230rpx;
  height: 230rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
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
  gap: 12rpx;
}

.hero-flower {
  color: #ff58b0;
  font-size: 34rpx;
}

.hero-title {
  font-size: 52rpx;
  color: #fff;
  font-weight: 700;
}

.score-pill {
  background: rgba(255, 240, 238, 0.35);
  border-radius: 999rpx;
  padding: 10rpx 24rpx;
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  position: relative;
  z-index: 1;
}

.hero-sub {
  margin-top: 12rpx;
  color: rgba(255, 255, 255, 0.9);
  font-size: 28rpx;
  position: relative;
  z-index: 1;
}

.category-row {
  margin: 0 22rpx;
  background: #f2e8d8;
  display: flex;
  gap: 14rpx;
  padding: 16rpx 0 18rpx;
}

.category-pill {
  min-width: 130rpx;
  text-align: center;
  background: #f6f1e8;
  border-radius: 999rpx;
  padding: 12rpx 18rpx;
  font-size: 28rpx;
  color: #7e5f43;
  border: 1px solid #ddc8ac;
}

.category-pill.active {
  background: #9a6b42;
  color: #fff;
  border-color: #9a6b42;
}

.card-grid {
  margin: 0 22rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.seed-card {
  width: calc((100% - 16rpx) / 2);
  border-radius: 30rpx;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 10rpx 24rpx rgba(87, 65, 35, 0.12);
}

.seed-hero {
  height: 174rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seed-tag {
  position: absolute;
  left: 14rpx;
  top: 14rpx;
  color: #fff;
  font-size: 22rpx;
  line-height: 1;
  padding: 8rpx 10rpx;
  border-radius: 10rpx;
}

.seed-image {
  width: 112rpx;
  height: 112rpx;
}

.seed-emoji {
  font-size: 82rpx;
}

.seed-body {
  background: #f6f6f6;
  padding: 16rpx 18rpx 18rpx;
}

.seed-name {
  color: #324334;
  font-size: 34rpx;
  font-weight: 700;
}

.seed-desc {
  margin-top: 8rpx;
  color: #758678;
  font-size: 24rpx;
  min-height: 66rpx;
}

.seed-foot {
  margin-top: 8rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.seed-price {
  color: #ab5b57;
  font-size: 34rpx;
  font-weight: 700;
}

.plant-btn {
  background: #a9794d;
  color: #fff;
  border-radius: 999rpx;
  font-size: 26rpx;
  min-width: 98rpx;
  text-align: center;
  padding: 8rpx 16rpx;
}

.plant-btn.disabled {
  background: #c3b8ab;
}

</style>
