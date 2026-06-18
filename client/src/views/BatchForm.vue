<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">新建批次</h2>
        <p class="page-subtitle">创建批次并生成一药一码溯源二维码</p>
      </div>
      <button class="btn btn-secondary" @click="router.back()">返回</button>
    </div>

    <div class="card" style="max-width:640px">
      <form @submit.prevent="submit">
        <div class="form-group">
          <label class="form-label">药材 *</label>
          <div v-if="herbsLoading" style="color:#888;padding:10px 0">正在加载药材列表...</div>
          <div v-else-if="herbsError" style="color:#e53935;padding:10px 0">
            {{ herbsError }}
            <button class="btn btn-secondary btn-sm" style="margin-left:8px" @click="loadHerbs">重试</button>
          </div>
          <select v-else v-model="form.herb_id" class="form-select" required>
            <option value="">请选择药材</option>
            <option v-for="h in herbs" :key="h.id" :value="h.id">
              {{ h.name }} — {{ h.origin }}
            </option>
          </select>
          <router-link v-if="!herbsLoading && herbs.length === 0" to="/herbs/new" style="font-size:12px;color:#2d8a4e;margin-top:4px;display:inline-block">
            还没有药材？点击新增
          </router-link>
        </div>
        <div class="form-group">
          <label class="form-label">种植地点 *</label>
          <input v-model="form.location" class="form-input" placeholder="如: 浑源县恒山种植基地" required />
        </div>
        <div class="form-group">
          <label class="form-label">采收日期</label>
          <input v-model="form.harvest_date" type="date" class="form-input" />
        </div>
        <div class="two-col">
          <div class="form-group">
            <label class="form-label">纬度</label>
            <input v-model="form.latitude" type="number" step="0.0001" class="form-input" placeholder="36.5" />
          </div>
          <div class="form-group">
            <label class="form-label">经度</label>
            <input v-model="form.longitude" type="number" step="0.0001" class="form-input" placeholder="112.0" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">备注</label>
          <textarea v-model="form.notes" class="form-textarea" placeholder="种植区域描述、特殊管理措施等..."></textarea>
        </div>
        <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px">
          <button type="button" class="btn btn-secondary" @click="router.back()">取消</button>
          <button type="submit" class="btn btn-primary">创建批次并生成QR码</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { herbApi, batchApi } from '../api'

const router = useRouter()
const herbs = ref<any[]>([])
const herbsLoading = ref(true)
const herbsError = ref('')

async function loadHerbs() {
  herbsLoading.value = true
  herbsError.value = ''
  try {
    herbs.value = await herbApi.list()
  } catch (e: any) {
    herbsError.value = '加载药材失败: ' + (e.message || '网络错误')
    console.error('加载药材失败:', e)
  } finally {
    herbsLoading.value = false
  }
}

const form = ref({
  herb_id: '',
  location: '',
  harvest_date: '',
  latitude: '',
  longitude: '',
  notes: ''
})

onMounted(loadHerbs)

async function submit() {
  try {
    const batch = await batchApi.create({
      ...form.value,
      latitude: parseFloat(form.value.latitude) || null,
      longitude: parseFloat(form.value.longitude) || null,
      harvest_date: form.value.harvest_date || null
    })
    router.push(`/batches/${batch.id}`)
  } catch (e: any) {
    alert('创建失败: ' + e.message)
  }
}
</script>
