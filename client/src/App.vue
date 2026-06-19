<template>
  <Layout v-if="showLayout">
    <router-view />
  </Layout>
  <router-view v-else />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Layout from './components/Layout.vue'

const route = useRoute()

const standaloneRoutes = ['trace', 'batch-entry', 'batch-env', 'farmer']
function isStandalone(hash: string) {
  return standaloneRoutes.some(r => hash.includes(r))
}

// 直接读 hash 判断，hash 路由下 route.path 固定为 '/'
const showLayout = ref(!isStandalone(window.location.hash))

watch(() => route.fullPath, () => {
  showLayout.value = !isStandalone(window.location.hash)
})
</script>
