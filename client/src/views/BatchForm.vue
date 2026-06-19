<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">新建批次</h2>
        <p class="page-subtitle">创建批次并生成溯源二维码</p>
      </div>
      <button class="btn btn-ghost" @click="router.back()">返回</button>
    </div>

    <div class="card" style="max-width:640px">
      <form @submit.prevent="submit">
        <div class="form-group">
          <label class="form-label">药材 *</label>
          <div v-if="herbsLoading" style="color:var(--ink-3);padding:10px 0">加载中...</div>
          <select v-else v-model="form.herb_id" class="form-select" required>
            <option value="">请选择药材</option>
            <option v-for="h in herbs" :key="h.id" :value="h.id">{{ h.name }} — {{ h.origin }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">批次号（留空自动生成）</label>
          <input v-model="form.custom_code" class="form-input" placeholder="如: HQ-2026-A01，留空自动生成" />
        </div>
        <div class="form-group">
          <label class="form-label">关联农户</label>
          <select v-model="form.farmer_id" class="form-select">
            <option value="">不关联</option>
            <option v-for="f in farmers" :key="f.id" :value="f.id">{{ f.name }} — {{ f.location }}</option>
          </select>
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
          <button type="button" class="btn btn-ghost" @click="router.back()">取消</button>
          <button type="submit" class="btn btn-primary">创建批次并生成QR码</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { herbApi, batchApi, farmerApi } from '../api'

const router = useRouter()
const herbs = ref<any[]>([])
const farmers = ref<any[]>([])
const herbsLoading = ref(true)

const form = ref({
  herb_id: '', location: '', harvest_date: '', latitude: '', longitude: '', notes: '',
  custom_code: '', farmer_id: ''
})

onMounted(async () => {
  try {
    const [h, f] = await Promise.all([herbApi.list(), farmerApi.list()])
    herbs.value = h; farmers.value = f
  } catch(e) { console.error(e) }
  finally { herbsLoading.value = false }
})

async function submit() {
  try {
    const batch = await batchApi.create({
      ...form.value,
      latitude: parseFloat(form.value.latitude) || null,
      longitude: parseFloat(form.value.longitude) || null,
      harvest_date: form.value.harvest_date || null
    })
    // 如果选了农户，更新农户的批次关联
    if (form.value.farmer_id) {
      // batch creation already done, can update farmer association separately
    }
    router.push(`/batches/${batch.id}`)
  } catch (e: any) {
    alert('创建失败: ' + e.message)
  }
}
</script>
