<template>
  <div class="page">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!batch" class="error">批次未找到</div>
    <div v-else class="body">
      <div class="hero">
        <span class="badge">境码 · 环境监测</span>
        <h2>{{ batch.herb_name }}</h2>
        <p>{{ batch.batch_code }} · {{ batch.location }}</p>
      </div>
      <div class="card">
        <form @submit.prevent="submit">
          <div class="row3">
            <div class="form-group">
              <label class="form-label">温度 (°C)</label>
              <input v-model="form.temperature" type="number" step="0.1" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">空气湿度 (%)</label>
              <input v-model="form.humidity" type="number" step="0.1" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">光照 (lux)</label>
              <input v-model="form.light_intensity" type="number" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">土壤pH</label>
              <input v-model="form.soil_ph" type="number" step="0.1" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">土壤水分 (%)</label>
              <input v-model="form.soil_moisture" type="number" step="0.1" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">空气质量 (AQI)</label>
              <input v-model="form.air_quality_index" type="number" class="form-input" />
            </div>
          </div>
          <button type="submit" class="btn btn-accent" style="width:100%;margin-top:4px" :disabled="submitting">
            {{ submitting ? '提交中...' : '提缴环境数据' }}
          </button>
        </form>
        <div v-if="msg" class="msg">{{ msg }}</div>
      </div>
      <div class="card" v-if="records.length">
        <h3 style="font-size:14px;margin-bottom:12px">最近环境数据</h3>
        <div v-for="r in records" :key="r.id" class="rec">
          <span>{{ r.recorded_at?.slice(0,16) }}</span>
          <span style="font-size:12px;color:var(--ink-3)">
            {{ r.temperature }}°C · {{ r.humidity }}% · {{ r.light_intensity }}lx · pH{{ r.soil_ph }} · {{ r.soil_moisture }}% · AQI{{ r.air_quality_index }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { batchApi, envApi } from '../api'

const route = useRoute()
const bid = route.params.batchId as string
const batch = ref<any>(null)
const records = ref<any[]>([])
const loading = ref(true)
const submitting = ref(false)
const msg = ref('')
const form = ref({ temperature: '', humidity: '', light_intensity: '', soil_ph: '', soil_moisture: '', air_quality_index: '' })

async function load() {
  try {
    const d = await batchApi.get(bid)
    batch.value = d
    records.value = d.environment_records?.slice(0, 10) || []
  } catch(e) { console.error(e) } finally { loading.value = false }
}

async function submit() {
  submitting.value = true; msg.value = ''
  try {
    await envApi.create({ batch_id: bid, ...form.value })
    msg.value = '提缴成功！'
    form.value = { temperature: '', humidity: '', light_intensity: '', soil_ph: '', soil_moisture: '', air_quality_index: '' }
    const d = await batchApi.get(bid)
    records.value = d.environment_records?.slice(0, 10) || []
  } catch(e: any) { alert('失败: '+e.message) } finally { submitting.value = false }
}

onMounted(load)
</script>

<style scoped>
.page { min-height: 100vh; background: var(--paper); }
.loading, .error { text-align: center; padding: 80px 20px; color: var(--ink-3); }
.body { max-width: 540px; margin: 0 auto; padding: 16px; }
.hero { text-align: center; padding: 24px 16px 16px; }
.badge { display: inline-block; padding: 3px 12px; border-radius: 20px; background: var(--sage); color: #fff; font-size: 11px; font-weight: 700; }
.hero h2 { font-size: 20px; margin: 8px 0 4px; }
.hero p { font-size: 13px; color: var(--ink-3); }
.card { background: var(--paper-card); border-radius: 14px; padding: 16px; margin-bottom: 14px; border: 1px solid var(--stone-light); }
.row3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
@media (max-width: 500px) { .row3 { grid-template-columns: repeat(2, 1fr); } }
.msg { margin-top: 10px; padding: 10px; background: var(--sage-light); color: var(--sage); border-radius: 8px; font-size: 13px; text-align: center; font-weight: 600; }
.rec { padding: 10px 0; border-bottom: 1px solid var(--stone-light); }
.rec:last-child { border: none; }
</style>
