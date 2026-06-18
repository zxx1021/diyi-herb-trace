<template>
  <div v-if="!ready" class="app-loader"></div>
  <Layout v-else-if="useLayout">
    <router-view />
  </Layout>
  <router-view v-else />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Layout from './components/Layout.vue'

const route = useRoute()
const router = useRouter()
const ready = ref(false)

router.isReady().then(() => { ready.value = true })

const standalonePages = ['traceability', 'batch-entry', 'batch-env', 'farmer-entry']
const useLayout = computed(() => !standalonePages.includes(route.name as string))
</script>

<style>
.app-loader { min-height: 100vh; background: var(--paper); }
</style>
