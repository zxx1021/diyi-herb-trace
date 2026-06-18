<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">批次管理</h2>
        <p class="page-subtitle">一药一码 · 批次溯源管理</p>
      </div>
      <router-link to="/batches/new" class="btn btn-primary">+ 新建批次</router-link>
    </div>

    <div class="card">
      <table class="data-table" v-if="batches.length">
        <thead>
          <tr>
            <th>批次码</th>
            <th>药材</th>
            <th>种植地点</th>
            <th>采收日期</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in batches" :key="b.id">
            <td>
              <router-link :to="`/batches/${b.id}`" style="color:#1565c0;font-weight:600;text-decoration:none">
                {{ b.batch_code }}
              </router-link>
            </td>
            <td>{{ b.herb_name }}</td>
            <td>{{ b.location }}</td>
            <td>{{ b.harvest_date || '-' }}</td>
            <td>
              <span class="tag" :class="b.status === '已采收' ? 'tag-green' : 'tag-orange'">{{ b.status }}</span>
            </td>
            <td>
              <div class="flex-center">
                <router-link :to="`/batches/${b.id}`" class="btn btn-secondary btn-sm">详情</router-link>
                <router-link :to="`/trace/${b.batch_code}`" class="btn btn-primary btn-sm">溯源</router-link>
                <button class="btn btn-danger btn-sm" @click="deleteBatch(b.id, b.batch_code)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <div class="empty-icon">📦</div>
        <p>暂无批次数据，请创建新批次生成一药一码</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { batchApi } from '../api'

const batches = ref<any[]>([])

onMounted(async () => {
  try {
    batches.value = await batchApi.list()
  } catch (e) {
    console.error('加载批次失败:', e)
  }
})

async function deleteBatch(id: string, code: string) {
  if (!confirm(`确定删除批次「${code}」吗？`)) return
  try {
    await batchApi.delete(id)
    batches.value = batches.value.filter(b => b.id !== id)
  } catch (e: any) {
    alert('删除失败: ' + e.message)
  }
}
</script>
