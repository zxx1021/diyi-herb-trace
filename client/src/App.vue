<template>
  <Layout v-if="showLayout">
    <router-view />
  </Layout>
  <router-view v-else />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Layout from './components/Layout.vue'

const router = useRouter()

// 同步检查 hash，router isReady 之前就确定
const hash = window.location.hash
const showLayout = ref(!/#\/(trace|batch-entry|batch-env|farmer)\//.test(hash))

// router 就绪后再确认一次
router.isReady().then(() => {
  const h = window.location.hash
  showLayout.value = !/#\/(trace|batch-entry|batch-env|farmer)\//.test(h)
})
</script>
