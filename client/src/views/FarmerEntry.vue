<template>
  <div class="farmer-page">
    <div v-if="loading" class="fe-loading">加载中...</div>
    <div v-else-if="!farmer" class="fe-error">
      <h2>农户未找到</h2>
      <p>请确认二维码是否正确</p>
    </div>
    <div v-else class="fe-body">
      <!-- 头部 -->
      <div class="fe-hero">
        <span class="fe-badge">农户登记</span>
        <h2 class="fe-name">{{ farmer.name }}</h2>
        <p class="fe-info" v-if="farmer.herb_name">{{ farmer.herb_name }} · {{ farmer.location }}</p>
        <p class="fe-info" v-else>{{ farmer.location }}</p>
      </div>

      <!-- 种植记录表单 -->
      <div class="fe-card">
        <h3 class="fe-card-title">上传种植记录</h3>
        <form @submit.prevent="submitRecord">
          <div class="form-group">
            <label class="form-label">关联批次 *</label>
            <select v-model="form.batch_id" class="form-select" required>
              <option value="">请选择批次</option>
              <option v-for="b in batches" :key="b.id" :value="b.id">{{ b.batch_code }} — {{ b.herb_name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">操作类型 *</label>
            <select v-model="form.record_type" class="form-select" required>
              <option value="">请选择</option>
              <option value="浇灌">浇灌</option>
              <option value="除虫">除虫</option>
              <option value="施肥">施肥</option>
              <option value="除草">除草</option>
              <option value="松土">松土</option>
              <option value="采摘">采摘</option>
              <option value="移栽">移栽</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">操作描述</label>
            <input v-model="form.description" class="form-input" placeholder="简要描述操作内容..." />
          </div>
          <div class="fe-row">
            <div class="form-group">
              <label class="form-label">用量</label>
              <input v-model="form.dosage" class="form-input" placeholder="如: 500L/亩" />
            </div>
            <div class="form-group">
              <label class="form-label">天气</label>
              <select v-model="form.weather" class="form-select">
                <option value="">请选择</option>
                <option value="晴">晴</option>
                <option value="多云">多云</option>
                <option value="阴">阴</option>
                <option value="小雨">小雨</option>
                <option value="大雨">大雨</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn btn-accent btn-lg" style="width:100%;margin-top:8px" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交记录' }}
          </button>
        </form>
        <div v-if="successMsg" class="fe-success">{{ successMsg }}</div>
      </div>

      <!-- 已上传记录 -->
      <div class="fe-card" v-if="records.length">
        <h3 class="fe-card-title">我的种植记录</h3>
        <div class="fe-timeline">
          <div class="fe-tl-item" v-for="r in records" :key="r.id">
            <span class="tag" :class="tagCls(r.record_type)">{{ r.record_type }}</span>
            <span class="fe-tl-desc">{{ r.description }}</span>
            <span class="fe-tl-meta">{{ r.recorded_at?.slice(0,16) }} · {{ r.dosage }} · {{ r.weather }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { farmerApi } from '../api'

const route = useRoute()
const fid = route.params.farmerId as string
const farmer = ref<any>(null)
const batches = ref<any[]>([])
const records = ref<any[]>([])
const loading = ref(true)
const submitting = ref(false)
const successMsg = ref('')

const form = ref({ batch_id: '', record_type: '', description: '', dosage: '', weather: '' })

function tagCls(t: string) {
  const m: Record<string,string> = {'除虫':'tag-seal','浇灌':'tag-blue','施肥':'tag-purple','除草':'tag-sage','松土':'tag-stone','采摘':'tag-bark'}
  return m[t] || 'tag-stone'
}

async function submitRecord() {
  submitting.value = true; successMsg.value = ''
  try {
    await farmerApi.submitRecord(fid, form.value)
    successMsg.value = '记录提交成功！'
    form.value = { batch_id: '', record_type: '', description: '', dosage: '', weather: '' }
    const data = await farmerApi.get(fid)
    records.value = data.records || []
  } catch (e: any) {
    alert('提交失败: ' + e.message)
  } finally { submitting.value = false }
}

onMounted(async () => {
  try {
    const data = await farmerApi.get(fid)
    farmer.value = data
    batches.value = data.batches || []
    records.value = data.records || []
  } catch (e) {
    console.error(e)
  } finally { loading.value = false }
})
</script>

<style scoped>
.farmer-page { min-height: 100vh; background: var(--paper); padding: 0; }
.fe-loading, .fe-error { text-align: center; padding: 80px 20px; color: var(--ink-3); }
.fe-body { max-width: 560px; margin: 0 auto; padding: 16px; }
.fe-hero { text-align: center; padding: 24px 16px 20px; }
.fe-badge { display: inline-block; padding: 3px 14px; border-radius: 20px; background: var(--sage); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
.fe-name { font-size: 22px; margin: 10px 0 4px; font-weight: 800; }
.fe-info { font-size: 13px; color: var(--ink-3); }
.fe-card { background: var(--paper-card); border-radius: 14px; padding: 18px; margin-bottom: 14px; border: 1px solid var(--stone-light); box-shadow: var(--shadow-sm); }
.fe-card-title { font-size: 14px; font-weight: 700; margin-bottom: 14px; color: var(--sage); }
.fe-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.fe-success { margin-top: 12px; padding: 10px; background: var(--sage-light); color: var(--sage); border-radius: 8px; font-size: 13px; font-weight: 600; text-align: center; }
.fe-timeline { }
.fe-tl-item {
  padding: 10px 0; border-bottom: 1px solid var(--stone-light);
  display: flex; flex-direction: column; gap: 4px;
}
.fe-tl-item:last-child { border-bottom: none; }
.fe-tl-desc { font-weight: 600; font-size: 13px; margin-top: 2px; }
.fe-tl-meta { font-size: 11px; color: var(--ink-3); }
@media (max-width: 480px) {
  .fe-row { grid-template-columns: 1fr; }
  .fe-body { padding: 12px; }
}
</style>
