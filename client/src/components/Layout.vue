<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-inner">
        <div class="logo" @click="router.push('/')">
          <span class="logo-mark">地</span>
          <div class="logo-text">
            <span class="logo-title">地宜本草溯源</span>
            <span class="logo-sub">山西道地 · 一药一码</span>
          </div>
        </div>

        <!-- 桌面导航 -->
        <nav class="nav-desk">
          <router-link to="/" class="nav-item">数据总览</router-link>
          <router-link to="/herbs" class="nav-item">药材管理</router-link>
          <router-link to="/batches" class="nav-item">批次溯源</router-link>
          <router-link to="/environment" class="nav-item">环境监测</router-link>
          <router-link to="/farmers" class="nav-item">农户管理</router-link>
        </nav>

        <!-- 移动端汉堡按钮 -->
        <button class="menu-btn" @click="menuOpen = !menuOpen">
          <span :class="menuOpen ? 'open' : ''"></span>
        </button>
      </div>

      <!-- 移动端下拉菜单 -->
      <nav class="nav-mobile" :class="{ show: menuOpen }" @click="menuOpen = false">
        <router-link to="/" class="nav-item">数据总览</router-link>
        <router-link to="/herbs" class="nav-item">药材管理</router-link>
        <router-link to="/batches" class="nav-item">批次溯源</router-link>
        <router-link to="/environment" class="nav-item">环境监测</router-link>
        <router-link to="/farmers" class="nav-item">农户管理</router-link>
      </nav>
    </header>

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const menuOpen = ref(false)
</script>

<style scoped>
.app-layout { min-height: 100vh; background: var(--paper); }

/* Header */
.app-header {
  background: linear-gradient(135deg, #1e3420, var(--sage), #1e3420);
  color: #fff; position: sticky; top: 0; z-index: 100;
  box-shadow: 0 2px 16px rgba(0,0,0,.12);
}
.header-inner {
  max-width: 1400px; margin: 0 auto; padding: 0 20px;
  display: flex; align-items: center; justify-content: space-between; height: 56px;
}
.logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.logo-mark {
  width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,.15);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 800; border: 1.5px solid rgba(255,255,255,.2);
}
.logo-title { font-size: 17px; font-weight: 700; letter-spacing: 1px; }
.logo-sub  { font-size: 10px; opacity: .7; display: block; font-weight: 400; }

/* Desktop nav */
.nav-desk { display: flex; gap: 2px; }
.nav-desk .nav-item {
  color: rgba(255,255,255,.8); text-decoration: none; padding: 7px 15px;
  border-radius: 8px; font-size: 13px; font-weight: 500; transition: all .2s;
}
.nav-desk .nav-item:hover, .nav-desk .nav-item.router-link-active {
  background: rgba(255,255,255,.12); color: #fff;
}

/* Hamburger button */
.menu-btn {
  display: none; width: 36px; height: 36px; background: none; border: none;
  cursor: pointer; position: relative;
}
.menu-btn span, .menu-btn span::before, .menu-btn span::after {
  display: block; width: 20px; height: 2px; background: #fff; border-radius: 2px;
  transition: all .25s; position: absolute; left: 8px;
}
.menu-btn span { top: 17px; }
.menu-btn span::before { content: ''; top: -6px; }
.menu-btn span::after  { content: ''; top: 6px; }
.menu-btn span.open { background: transparent; }
.menu-btn span.open::before { top: 0; transform: rotate(45deg); }
.menu-btn span.open::after  { top: 0; transform: rotate(-45deg); }

/* Mobile nav */
.nav-mobile {
  display: none; flex-direction: column; padding: 0 20px 16px;
  background: rgba(0,0,0,.08); max-height: 0; overflow: hidden; transition: max-height .3s ease;
}
.nav-mobile.show { max-height: 240px; }
.nav-mobile .nav-item {
  color: rgba(255,255,255,.85); text-decoration: none; padding: 12px 12px;
  font-size: 14px; border-radius: 8px; display: block;
}
.nav-mobile .nav-item:active { background: rgba(255,255,255,.1); }

@media (max-width: 720px) {
  .nav-desk { display: none; }
  .menu-btn { display: block; }
  .nav-mobile { display: flex; }
  .header-inner { padding: 0 14px; height: 52px; }
  .logo-mark { width: 32px; height: 32px; font-size: 16px; border-radius: 8px; }
  .logo-title { font-size: 15px; }
}

/* Main */
.app-main { max-width: 1400px; margin: 0 auto; padding: 20px; }
@media (max-width: 640px) { .app-main { padding: 14px; } }
</style>
