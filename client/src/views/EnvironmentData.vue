<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">环境监测</h2>
        <p class="page-subtitle">光·温·水·土·气 — 山西道地药材生长环境数据总览</p>
      </div>
      <select v-model="selectedBatchId" class="form-select" style="width:240px" @change="loadBatchData">
        <option value="">选择批次</option>
        <option v-for="b in batches" :key="b.id" :value="b.id">
          {{ b.herb_name }} — {{ b.batch_code }}
        </option>
      </select>
    </div>

    <div v-if="!selectedBatchId" class="card" style="text-align:center;padding:60px;color:#999">
      <div style="font-size:48px;margin-bottom:12px">📡</div>
      <p>请选择一个批次查看环境监测数据</p>
    </div>

    <template v-else>
      <!-- 最新环境快照 -->
      <div class="card" style="margin-bottom:24px" v-if="latestEnv">
        <h3 style="font-size:16px;margin-bottom:16px">🌡 最新环境快照</h3>
        <div class="env-grid">
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
            <div class="env-value">pH {{ latestEnv.soil_ph }}</div>
            <div class="env-label">土壤酸碱度</div>
          </div>
          <div class="env-item">
            <div class="env-value">{{ latestEnv.soil_moisture }}%</div>
            <div class="env-label">土壤水分</div>
          </div>
          <div class="env-item">
            <div class="env-value">N:{{ latestEnv.soil_nitrogen }}</div>
            <div class="env-label">土壤氮 (mg/kg)</div>
          </div>
          <div class="env-item">
            <div class="env-value">P:{{ latestEnv.soil_phosphorus }}</div>
            <div class="env-label">土壤磷 (mg/kg)</div>
          </div>
          <div class="env-item">
            <div class="env-value">K:{{ latestEnv.soil_potassium }}</div>
            <div class="env-label">土壤钾 (mg/kg)</div>
          </div>
          <div class="env-item">
            <div class="env-value">AQI {{ latestEnv.air_quality_index }}</div>
            <div class="env-label">空气质量</div>
          </div>
        </div>
      </div>

      <!-- 月度统计 -->
      <div class="card" style="margin-bottom:24px" v-if="monthlyStats.length">
        <h3 style="font-size:16px;margin-bottom:16px">📊 月度环境统计</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>月份</th>
              <th>平均温度</th>
              <th>平均湿度</th>
              <th>平均光照</th>
              <th>平均pH</th>
              <th>平均水分</th>
              <th>平均AQI</th>
              <th>记录数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in monthlyStats" :key="s.month">
              <td><strong>{{ s.month }}</strong></td>
              <td>{{ s.avg_temp }}°C</td>
              <td>{{ s.avg_humidity }}%</td>
              <td>{{ s.avg_light }} lux</td>
              <td>{{ s.avg_soil_ph }}</td>
              <td>{{ s.avg_soil_moisture }}%</td>
              <td>{{ s.avg_aqi }}</td>
              <td>{{ s.record_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 详细记录 -->
      <div class="card">
        <div class="flex-between" style="margin-bottom:16px">
          <h3 style="font-size:16px;">📋 监测记录明细</h3>
          <button class="btn btn-primary btn-sm" @click="showModal = true">+ 录入数据</button>
        </div>
        <table class="data-table" v-if="envRecords.length">
          <thead>
            <tr>
              <th>记录时间</th>
              <th>温度</th>
              <th>湿度</th>
              <th>光照</th>
              <th>pH</th>
              <th>水分</th>
              <th>AQI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in envRecords" :key="r.id">
              <td>{{ r.recorded_at }}</td>
              <td>{{ r.temperature }}°C</td>
              <td>{{ r.humidity }}%</td>
              <td>{{ r.light_intensity }}</td>
              <td>{{ r.soil_ph }}</td>
              <td>{{ r.soil_moisture }}%</td>
              <td>{{ r.air_quality_index }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else style="text-align:center;padding:24px;color:#999">暂无记录</div>
      </div>

      <!-- 录入弹窗 -->
      <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
        <div class="modal-content">
          <h3 class="modal-title">录入环境监测数据 (光·温·水·土·气)</h3>
          <form @submit.prevent="submit">
            <div class="env-grid">
              <div class="form-group">
                <label class="form-label">温度 (°C)</label>
                <input v-model="form.temperature" type="number" step="0.1" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">空气湿度 (%)</label>
                <input v-model="form.humidity" type="number" step="0.1" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">光照强度 (lux)</label>
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
                <label class="form-label">土壤氮 (mg/kg)</label>
                <input v-model="form.soil_nitrogen" type="number" step="0.1" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">土壤磷 (mg/kg)</label>
                <input v-model="form.soil_phosphorus" type="number" step="0.1" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">土壤钾 (mg/kg)</label>
                <input v-model="form.soil_potassium" type="number" step="0.1" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">空气质量指数</label>
                <input v-model="form.air_quality_index" type="number" class="form-input" />
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="showModal = false">取消</button>
              <button type="submit" class="btn btn-primary">提交数据</button>
            </div>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { batchApi, envApi } from '../api'

const batches = ref<any[]>([])
const selectedBatchId = ref('')
const latestEnv = ref<any>(null)
const envRecords = ref<any[]>([])
const monthlyStats = ref<any[]>([])
const showModal = ref(false)

const form = ref({
  temperature: '', humidity: '', light_intensity: '',
  soil_ph: '', soil_moisture: '', soil_nitrogen: '',
  soil_phosphorus: '', soil_potassium: '', air_quality_index: ''
})

async function loadBatchData() {
  if (!selectedBatchId.value) return
  try {
    const [latest, stats, records] = await Promise.all([
      envApi.latest(selectedBatchId.value),
      envApi.stats(selectedBatchId.value),
      envApi.listByBatch(selectedBatchId.value)
    ])
    latestEnv.value = latest
    monthlyStats.value = stats
    envRecords.value = records
  } catch (e) {
    console.error(e)
  }
}

async function submit() {
  try {
    await envApi.create({ batch_id: selectedBatchId.value, ...form.value })
    showModal.value = false
    await loadBatchData()
    form.value = {
      temperature: '', humidity: '', light_intensity: '',
      soil_ph: '', soil_moisture: '', soil_nitrogen: '',
      soil_phosphorus: '', soil_potassium: '', air_quality_index: ''
    }
  } catch (e: any) {
    alert('录入失败: ' + e.message)
  }
}

onMounted(async () => {
  try {
    batches.value = await batchApi.list()
  } catch (e) {
    console.error(e)
  }
})
</script>
