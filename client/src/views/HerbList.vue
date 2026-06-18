<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">药材管理</h2>
        <p class="page-subtitle">山西道地药材品种登记与管理</p>
      </div>
      <router-link to="/herbs/new" class="btn btn-primary">+ 新增药材</router-link>
    </div>

    <div class="card">
      <table class="data-table" v-if="herbs.length">
        <thead>
          <tr>
            <th>药材名称</th>
            <th>学名</th>
            <th>分类</th>
            <th>产地</th>
            <th>批次数量</th>
            <th>登记时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in herbs" :key="h.id">
            <td><strong>{{ h.name }}</strong></td>
            <td style="font-style:italic;color:#888">{{ h.scientific_name }}</td>
            <td><span class="tag tag-green">{{ h.category }}</span></td>
            <td>{{ h.origin }}</td>
            <td>
              <span class="tag tag-blue" v-if="h.batches">{{ h.batches.length }}</span>
              <span v-else>0</span>
            </td>
            <td style="color:#888">{{ h.created_at?.slice(0, 10) }}</td>
            <td>
              <div class="flex-center">
                <router-link :to="`/herbs/${h.id}/edit`" class="btn btn-secondary btn-sm">编辑</router-link>
                <button class="btn btn-danger btn-sm" @click="deleteHerb(h.id, h.name)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <div class="empty-icon">🌱</div>
        <p>暂无药材数据，请添加山西道地药材</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { herbApi } from '../api'

const herbs = ref<any[]>([])

onMounted(async () => {
  try {
    const list = await herbApi.list()
    // 加载每个药材的批次数量
    const withBatches = await Promise.all(
      list.map(async (h: any) => {
        try {
          const detail = await herbApi.get(h.id)
          return detail
        } catch { return h }
      })
    )
    herbs.value = withBatches
  } catch (e) {
    console.error('加载药材失败:', e)
  }
})

async function deleteHerb(id: string, name: string) {
  if (!confirm(`确定删除药材「${name}」吗？`)) return
  try {
    await herbApi.delete(id)
    herbs.value = herbs.value.filter(h => h.id !== id)
  } catch (e: any) {
    alert('删除失败: ' + e.message)
  }
}
</script>
