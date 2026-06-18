<template>
  <div>
    <div class="page-header" v-if="batch">
      <div>
        <h2 class="page-title">批次详情 — {{ batch.batch_code }}</h2>
        <p class="page-subtitle">{{ batch.herb_name }} · {{ batch.location }}</p>
      </div>
      <div class="flex-center">
        <router-link :to="`/trace/${batch.batch_code}`" class="btn btn-primary">📱 扫码溯源页</router-link>
      </div>
    </div>

    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!batch" class="empty-state">批次不存在</div>
    <template v-else>
      <!-- 药材信息 + QR码 -->
      <div class="two-col" style="margin-bottom:24px">
        <div class="card">
          <h3 style="margin-bottom:16px;font-size:16px;">基本信息</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div><span style="color:#888">药材品种:</span> {{ batch.herb_name }}</div>
            <div><span style="color:#888">学名:</span> <em>{{ batch.scientific_name }}</em></div>
            <div><span style="color:#888">产地:</span> {{ batch.herb_origin }}</div>
            <div><span style="color:#888">分类:</span> {{ batch.category }}</div>
            <div><span style="color:#888">种植地点:</span> {{ batch.location }}</div>
            <div><span style="color:#888">采收日期:</span> {{ batch.harvest_date || '-' }}</div>
            <div><span style="color:#888">经纬度:</span> {{ batch.latitude?.toFixed(4) }}, {{ batch.longitude?.toFixed(4) }}</div>
            <div>
              <span style="color:#888">状态:</span>
              <span class="tag" :class="batch.status === '已采收' ? 'tag-green' : 'tag-orange'">{{ batch.status }}</span>
            </div>
          </div>
        </div>
        <div class="card" style="text-align:center">
          <h3 style="margin-bottom:16px;font-size:16px;">一药一码 · 溯源二维码</h3>
          <div style="display:flex;justify-content:center;align-items:center">
            <img v-if="batch.qr_code_data" :src="batch.qr_code_data" style="width:200px;height:200px" alt="溯源二维码" />
            <div v-else style="width:200px;height:200px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#999">
              {{ batch.batch_code }}
            </div>
          </div>
          <p style="margin-top:12px;color:#888;font-size:13px">
            扫描二维码查看完整溯源信息
          </p>
          <p style="color:#1565c0;font-weight:600;font-size:14px">
            {{ batch.batch_code }}
          </p>
        </div>
      </div>

      <!-- 种植统计 -->
      <div class="stat-grid" style="margin-bottom:24px">
        <div class="stat-card">
          <div class="stat-value">{{ stats.pest_control_count }}</div>
          <div class="stat-label">除虫次数</div>
        </div>
        <div class="stat-card" style="border-left-color:#1565c0">
          <div class="stat-value" style="color:#1565c0">{{ stats.irrigation_count }}</div>
          <div class="stat-label">浇灌次数</div>
        </div>
        <div class="stat-card" style="border-left-color:#e65100">
          <div class="stat-value" style="color:#e65100">{{ stats.fertilize_count }}</div>
          <div class="stat-label">施肥次数</div>
        </div>
        <div class="stat-card" style="border-left-color:#7b1fa2">
          <div class="stat-value" style="color:#7b1fa2">{{ stats.total_env_records }}</div>
          <div class="stat-label">环境监测记录</div>
        </div>
      </div>

      <!-- 最新环境监测 -->
      <div class="card" style="margin-bottom:24px">
        <div class="flex-between" style="margin-bottom:16px">
          <h3 style="font-size:16px;">🌡 最新环境监测 (光·温·水·土·气)</h3>
          <button class="btn btn-primary btn-sm" @click="showEnvModal = true">+ 录入数据</button>
        </div>
        <div v-if="latestEnv" class="env-grid">
          <div class="env-item">
            <div class="env-value">{{ latestEnv.temperature }}°C</div>
            <div class="env-label">温度</div>
          </div>
          <div class="env-item">
            <div class="env-value">{{ latestEnv.humidity }}%</div>
            <div class="env-label">空气湿度</div>
          </div>
          <div class="env-item">
            <div class="env-value">{{ latestEnv.light_intensity }} lux</div>
            <div class="env-label">光照强度</div>
          </div>
          <div class="env-item">
            <div class="env-value">{{ latestEnv.soil_ph }}</div>
            <div class="env-label">土壤pH</div>
          </div>
          <div class="env-item">
            <div class="env-value">{{ latestEnv.soil_moisture }}%</div>
            <div class="env-label">土壤水分</div>
          </div>
          <div class="env-item">
            <div class="env-value">{{ latestEnv.soil_nitrogen }} mg/kg</div>
            <div class="env-label">土壤氮</div>
          </div>
          <div class="env-item">
            <div class="env-value">{{ latestEnv.soil_phosphorus }} mg/kg</div>
            <div class="env-label">土壤磷</div>
          </div>
          <div class="env-item">
            <div class="env-value">{{ latestEnv.soil_potassium }} mg/kg</div>
            <div class="env-label">土壤钾</div>
          </div>
          <div class="env-item">
            <div class="env-value">AQI {{ latestEnv.air_quality_index }}</div>
            <div class="env-label">空气质量</div>
          </div>
        </div>
        <div v-else style="text-align:center;padding:24px;color:#999">
          暂无环境数据，请录入
        </div>
      </div>

      <!-- 环境监测历史 -->
      <div class="card" style="margin-bottom:24px">
        <h3 style="font-size:16px;margin-bottom:16px;">📊 环境监测历史 (按月)</h3>
        <table class="data-table" v-if="envRecords.length">
          <thead>
            <tr>
              <th>记录时间</th>
              <th>温度(°C)</th>
              <th>湿度(%)</th>
              <th>光照(lux)</th>
              <th>土壤pH</th>
              <th>土壤水分(%)</th>
              <th>AQI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in envRecords.slice(0, 12)" :key="r.id">
              <td>{{ r.recorded_at }}</td>
              <td>{{ r.temperature }}</td>
              <td>{{ r.humidity }}</td>
              <td>{{ r.light_intensity }}</td>
              <td>{{ r.soil_ph }}</td>
              <td>{{ r.soil_moisture }}</td>
              <td>{{ r.air_quality_index }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 种植操作记录 -->
      <div class="card">
        <div class="flex-between" style="margin-bottom:16px">
          <h3 style="font-size:16px;">🌱 种植操作记录 (除虫·浇灌·施肥·除草)</h3>
          <button class="btn btn-primary btn-sm" @click="showGrowthModal = true">+ 录入记录</button>
        </div>
        <div class="timeline" v-if="growthRecords.length">
          <div class="timeline-item" v-for="r in growthRecords" :key="r.id">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <span class="tag" :class="typeColor(r.record_type)">{{ r.record_type }}</span>
                <span style="margin-left:8px;font-weight:500">{{ r.description }}</span>
              </div>
              <span style="color:#888;font-size:13px">{{ r.recorded_at?.slice(0, 16) }}</span>
            </div>
            <div style="margin-top:4px;color:#888;font-size:13px">
              操作人: {{ r.operator }} | 用量: {{ r.dosage }} | 天气: {{ r.weather }}
            </div>
          </div>
        </div>
        <div v-else style="text-align:center;padding:24px;color:#999">
          暂无种植操作记录
        </div>
      </div>

      <!-- 录入环境数据弹窗 -->
      <div class="modal-overlay" v-if="showEnvModal" @click.self="showEnvModal = false">
        <div class="modal-content">
          <h3 class="modal-title">录入环境监测数据 (光·温·水·土·气)</h3>
          <form @submit.prevent="submitEnv">
            <div class="env-grid">
              <div class="form-group">
                <label class="form-label">温度 (°C)</label>
                <input v-model="envForm.temperature" type="number" step="0.1" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">空气湿度 (%)</label>
                <input v-model="envForm.humidity" type="number" step="0.1" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">光照强度 (lux)</label>
                <input v-model="envForm.light_intensity" type="number" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">土壤pH</label>
                <input v-model="envForm.soil_ph" type="number" step="0.1" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">土壤水分 (%)</label>
                <input v-model="envForm.soil_moisture" type="number" step="0.1" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">空气质量指数</label>
                <input v-model="envForm.air_quality_index" type="number" class="form-input" />
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="showEnvModal = false">取消</button>
              <button type="submit" class="btn btn-primary">提交数据</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 录入种植记录弹窗 -->
      <div class="modal-overlay" v-if="showGrowthModal" @click.self="showGrowthModal = false">
        <div class="modal-content">
          <h3 class="modal-title">录入种植操作记录</h3>
          <form @submit.prevent="submitGrowth">
            <div class="form-group">
              <label class="form-label">操作类型 *</label>
              <select v-model="growthForm.record_type" class="form-select" required>
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
              <input v-model="growthForm.description" class="form-input" placeholder="如: 滴灌系统自动浇灌" />
            </div>
            <div class="two-col">
              <div class="form-group">
                <label class="form-label">操作人</label>
                <input v-model="growthForm.operator" class="form-input" placeholder="操作人员" />
              </div>
              <div class="form-group">
                <label class="form-label">用量</label>
                <input v-model="growthForm.dosage" class="form-input" placeholder="如: 500L/亩" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">天气</label>
              <select v-model="growthForm.weather" class="form-select">
                <option value="">请选择</option>
                <option value="晴">晴</option>
                <option value="多云">多云</option>
                <option value="阴">阴</option>
                <option value="小雨">小雨</option>
                <option value="大雨">大雨</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="showGrowthModal = false">取消</button>
              <button type="submit" class="btn btn-primary">提交记录</button>
            </div>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { batchApi, envApi, growthApi } from '../api'

const route = useRoute()
const batch = ref<any>(null)
const loading = ref(true)
const stats = ref({ pest_control_count: 0, irrigation_count: 0, fertilize_count: 0, total_env_records: 0, total_growth_records: 0 })
const latestEnv = ref<any>(null)
const envRecords = ref<any[]>([])
const growthRecords = ref<any[]>([])
const showEnvModal = ref(false)
const showGrowthModal = ref(false)

const envForm = ref({
  temperature: '', humidity: '', light_intensity: '',
  soil_ph: '', soil_moisture: '', air_quality_index: ''
})

const growthForm = ref({
  record_type: '', description: '', operator: '', dosage: '', weather: ''
})

function typeColor(type: string) {
  const map: Record<string, string> = {
    '除虫': 'tag-orange', '浇灌': 'tag-blue', '施肥': 'tag-purple',
    '除草': 'tag-green', '松土': 'tag-green', '采摘': 'tag-green',
    '移栽': 'tag-blue'
  }
  return map[type] || 'tag-green'
}

async function loadData() {
  try {
    const id = route.params.id as string
    const data = await batchApi.get(id)
    batch.value = data
    stats.value = data.stats
    envRecords.value = data.environment_records || []
    growthRecords.value = data.growth_records || []
    if (envRecords.value.length) {
      latestEnv.value = envRecords.value[0]
    }
  } catch (e) {
    console.error('加载批次失败:', e)
  } finally {
    loading.value = false
  }
}

async function submitEnv() {
  try {
    await envApi.create({ batch_id: batch.value.id, ...envForm.value })
    showEnvModal.value = false
    await loadData()
    envForm.value = { temperature: '', humidity: '', light_intensity: '', soil_ph: '', soil_moisture: '', air_quality_index: '' }
  } catch (e: any) {
    alert('录入失败: ' + e.message)
  }
}

async function submitGrowth() {
  try {
    await growthApi.create({ batch_id: batch.value.id, ...growthForm.value })
    showGrowthModal.value = false
    await loadData()
    growthForm.value = { record_type: '', description: '', operator: '', dosage: '', weather: '' }
  } catch (e: any) {
    alert('录入失败: ' + e.message)
  }
}

onMounted(loadData)
</script>
