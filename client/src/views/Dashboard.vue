<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">数据总览</h2>
        <p class="page-subtitle">山西道地药材一药一码溯源系统</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.herbCount }}</div>
        <div class="stat-label">道地药材品种</div>
      </div>
      <div class="stat-card" style="border-left-color: #1565c0">
        <div class="stat-value" style="color:#1565c0">{{ stats.batchCount }}</div>
        <div class="stat-label">活跃批次</div>
      </div>
      <div class="stat-card" style="border-left-color: #e65100">
        <div class="stat-value" style="color:#e65100">{{ stats.envCount }}</div>
        <div class="stat-label">环境监测记录</div>
      </div>
      <div class="stat-card" style="border-left-color: #7b1fa2">
        <div class="stat-value" style="color:#7b1fa2">{{ stats.growthCount }}</div>
        <div class="stat-label">种植操作记录</div>
      </div>
      <div class="stat-card" style="border-left-color: #00838f">
        <div class="stat-value" style="color:#00838f">{{ stats.traceCount }}</div>
        <div class="stat-label">溯源扫码次数</div>
      </div>
    </div>

    <!-- 最近批次 -->
    <div class="two-col">
      <div class="card">
        <h3 style="margin-bottom:16px;font-size:16px;">最近批次</h3>
        <table class="data-table" v-if="recentBatches.length">
          <thead>
            <tr>
              <th>批次码</th>
              <th>药材</th>
              <th>产地</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in recentBatches" :key="b.id" @click="router.push(`/batches/${b.id}`)" style="cursor:pointer">
              <td><span class="tag tag-blue">{{ b.batch_code }}</span></td>
              <td>{{ b.herb_name }}</td>
              <td>{{ b.location }}</td>
              <td>
                <span class="tag" :class="b.status === '已采收' ? 'tag-green' : 'tag-orange'">
                  {{ b.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">暂无数据</div>
      </div>

      <div class="card">
        <h3 style="margin-bottom:16px;font-size:16px;">药材品种一览</h3>
        <table class="data-table" v-if="herbs.length">
          <thead>
            <tr>
              <th>药材名</th>
              <th>学名</th>
              <th>产地</th>
              <th>分类</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in herbs" :key="h.id">
              <td><strong>{{ h.name }}</strong></td>
              <td style="font-style:italic;color:#888">{{ h.scientific_name }}</td>
              <td>{{ h.origin }}</td>
              <td><span class="tag tag-green">{{ h.category }}</span></td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { herbApi, batchApi } from '../api'

const router = useRouter()
const herbs = ref<any[]>([])
const recentBatches = ref<any[]>([])
const stats = ref({ herbCount: 0, batchCount: 0, envCount: 0, growthCount: 0, traceCount: 0 })

onMounted(async () => {
  try {
    herbs.value = await herbApi.list()
    stats.value.herbCount = herbs.value.length

    const batches = await batchApi.list()
    stats.value.batchCount = batches.length
    recentBatches.value = batches.slice(0, 5)

    // 统计环境记录和操作记录
    let envTotal = 0, growthTotal = 0
    for (const b of batches) {
      const detail = await batchApi.get(b.id)
      envTotal += detail.stats?.total_env_records || 0
      growthTotal += detail.stats?.total_growth_records || 0
    }
    stats.value.envCount = envTotal
    stats.value.growthCount = growthTotal
  } catch (e) {
    console.error('加载数据失败:', e)
  }
})
</script>
