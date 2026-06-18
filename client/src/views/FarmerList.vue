<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">农户管理</h2>
        <p class="page-subtitle">农户扫码上传种植数据</p>
      </div>
      <router-link to="/farmers/new" class="btn btn-primary">+ 新增农户</router-link>
    </div>
    <div class="card">
      <div class="table-wrap" v-if="farmers.length">
        <table class="data-table">
          <thead>
            <tr><th>姓名</th><th>手机</th><th>地点</th><th>关联批次</th><th>二维码</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="f in farmers" :key="f.id">
              <td><strong>{{ f.name }}</strong></td>
              <td>{{ f.phone }}</td>
              <td>{{ f.location }}</td>
              <td><span class="tag tag-sage">{{ f.batch_code || '未关联' }}</span></td>
              <td>
                <img v-if="f.qr_code_data" :src="f.qr_code_data" style="width:60px;height:60px;border-radius:6px" alt="农户二维码" />
                <span v-else style="color:var(--ink-3);font-size:12px">无</span>
              </td>
              <td>
                <div class="flex-center">
                  <button class="btn btn-danger btn-sm" @click="del(f.id, f.name)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state"><div class="empty-icon">👨‍🌾</div><p>暂无农户，请新增农户生成专属二维码</p></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { farmerApi } from '../api'

const farmers = ref<any[]>([])

async function load() {
  try { farmers.value = await farmerApi.list() } catch (e) { console.error(e) }
}
async function del(id: string, name: string) {
  if (!confirm(`确定删除农户「${name}」吗？`)) return
  try { await farmerApi.delete(id); farmers.value = farmers.value.filter(f => f.id !== id) } catch (e: any) { alert('删除失败: '+e.message) }
}
onMounted(load)
</script>
