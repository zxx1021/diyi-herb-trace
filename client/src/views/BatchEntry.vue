<template>
  <div class="page">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!batch" class="error">批次未找到</div>
    <div v-else class="body">
      <div class="hero">
        <span class="badge">农码 · 种植记录</span>
        <h2>{{ batch.herb_name }}</h2>
        <p>{{ batch.batch_code }} · {{ batch.location }}</p>
      </div>
      <div class="card">
        <form @submit.prevent="submit">
          <div class="form-group">
            <label class="form-label">操作人</label>
            <input v-model="form.operator" class="form-input" placeholder="操作人姓名" />
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
            <label class="form-label">描述</label>
            <input v-model="form.description" class="form-input" placeholder="操作内容描述" />
          </div>
          <div class="row">
            <div class="form-group">
              <label class="form-label">用量</label>
              <input v-model="form.dosage" class="form-input" placeholder="如：500L/亩" />
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
          <button type="submit" class="btn btn-accent" style="width:100%;margin-top:8px" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交种植记录' }}
          </button>
        </form>
        <div v-if="msg" class="msg">{{ msg }}</div>
      </div>
      <div class="card" v-if="records.length">
        <h3 style="font-size:14px;margin-bottom:12px">最近记录</h3>
        <div v-for="r in records" :key="r.id" class="rec">
          <span class="tag" :class="tagCls(r.record_type)">{{ r.record_type }}</span>
          <span class="rec-desc">{{ r.description }}</span>
          <span class="rec-meta">{{ r.recorded_at?.slice(0,16) }} · {{ r.operator }} · {{ r.dosage }} · {{ r.weather }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { batchApi, growthApi } from '../api'

const route = useRoute()
const bid = route.params.batchId as string
const batch = ref<any>(null)
const records = ref<any[]>([])
const loading = ref(true)
const submitting = ref(false)
const msg = ref('')
const form = ref({ operator: '', record_type: '', description: '', dosage: '', weather: '' })

function tagCls(t: string) {
  const m: Record<string,string> = {'除虫':'tag-seal','浇灌':'tag-blue','施肥':'tag-purple','除草':'tag-sage','松土':'tag-stone','采摘':'tag-bark'}
  return m[t] || 'tag-stone'
}

async function load() {
  try {
    const d = await batchApi.get(bid)
    batch.value = d
    records.value = d.growth_records?.slice(0, 10) || []
  } catch(e) { console.error(e) } finally { loading.value = false }
}

async function submit() {
  submitting.value = true; msg.value = ''
  try {
    await growthApi.create({ batch_id: bid, ...form.value })
    msg.value = '提交成功！'
    form.value = { operator: '', record_type: '', description: '', dosage: '', weather: '' }
    const d = await batchApi.get(bid)
    records.value = d.growth_records?.slice(0, 10) || []
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
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 400px) { .row { grid-template-columns: 1fr; } }
.msg { margin-top: 10px; padding: 10px; background: var(--sage-light); color: var(--sage); border-radius: 8px; font-size: 13px; text-align: center; font-weight: 600; }
.rec { padding: 10px 0; border-bottom: 1px solid var(--stone-light); display: flex; flex-direction: column; gap: 4px; }
.rec:last-child { border: none; }
.rec-desc { font-weight: 600; font-size: 13px; }
.rec-meta { font-size: 11px; color: var(--ink-3); }
</style>
