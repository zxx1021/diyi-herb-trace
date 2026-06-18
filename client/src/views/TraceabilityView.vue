<template>
  <div class="trace-page">
    <!-- 加载态 -->
    <div v-if="loading" class="trace-loading">
      <div class="spinner"></div>
      <p>正在加载溯源信息...</p>
    </div>

    <!-- 未找到 -->
    <div v-else-if="!batch" class="trace-empty">
      <div class="empty-icon">&#9747;</div>
      <h2>批次未找到</h2>
      <p>批次码: {{ batchCode }}</p>
    </div>

    <!-- 溯源内容 -->
    <div v-else class="trace-body">
      <!-- ── 头部印章区 ── -->
      <header class="trace-hero">
        <div class="hero-text">
          <div class="hero-badge">山西道地药材</div>
          <h1>{{ batch.herb_name }}</h1>
          <p class="hero-latin">{{ batch.scientific_name }}</p>
          <p class="hero-origin">{{ batch.herb_origin }} · {{ batch.location }}</p>
        </div>
        <div class="hero-qr">
          <div class="qr-seal">
            <div class="qr-seal-inner">
              <img v-if="batch.qr_code_data" :src="batch.qr_code_data" alt="溯源二维码" />
              <span v-else class="qr-fallback">{{ batch.batch_code }}</span>
            </div>
            <div class="qr-seal-label">一药一码</div>
          </div>
          <p class="qr-code-text">{{ batch.batch_code }}</p>
        </div>
      </header>

      <!-- ── 种植档案 ── -->
      <section class="trace-section">
        <h3 class="section-title">
          <span class="section-num">01</span> 种植档案
        </h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">品种</span>
            <span class="info-val">{{ batch.herb_name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">分类</span>
            <span class="info-val">{{ batch.category }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">产地</span>
            <span class="info-val">{{ batch.herb_origin }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">基地</span>
            <span class="info-val">{{ batch.location }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">采收日期</span>
            <span class="info-val">{{ batch.harvest_date || '待采收' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">状态</span>
            <span class="tag" :class="batch.status === '已采收' ? 'tag-sage' : 'tag-seal'">{{ batch.status }}</span>
          </div>
        </div>
      </section>

      <!-- ── 种植过程 ── -->
      <section class="trace-section">
        <h3 class="section-title">
          <span class="section-num">02</span> 种植过程
        </h3>
        <div class="stat-row">
          <div class="stat-pill">
            <span class="pill-num">{{ stats.pest_control_count }}</span>
            <span class="pill-label">次除虫</span>
          </div>
          <div class="stat-pill">
            <span class="pill-num">{{ stats.irrigation_count }}</span>
            <span class="pill-label">次浇灌</span>
          </div>
          <div class="stat-pill">
            <span class="pill-num">{{ stats.fertilize_count }}</span>
            <span class="pill-label">次施肥</span>
          </div>
          <div class="stat-pill">
            <span class="pill-num">{{ stats.total_growth_records }}</span>
            <span class="pill-label">项操作</span>
          </div>
        </div>

        <div class="timeline" v-if="growthRecords.length">
          <div class="timeline-item" v-for="r in growthRecords" :key="r.id">
            <div class="tl-head">
              <span class="tag" :class="typeColor(r.record_type)">{{ r.record_type }}</span>
              <span class="tl-desc">{{ r.description }}</span>
            </div>
            <div class="tl-meta">
              <span>{{ r.recorded_at?.slice(0, 16) }}</span>
              <span class="tl-sep">·</span>
              <span>{{ r.operator }}</span>
              <span class="tl-sep">·</span>
              <span>{{ r.weather }}</span>
              <span class="tl-sep" v-if="r.dosage && r.dosage !== '-'">·</span>
              <span v-if="r.dosage && r.dosage !== '-'">{{ r.dosage }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-block">暂无操作记录</div>
      </section>

      <!-- ── 环境监测 ── -->
      <section class="trace-section">
        <h3 class="section-title">
          <span class="section-num">03</span> 环境监测
          <span class="section-sub">光·温·水·土·气</span>
        </h3>
        <div class="env-grid" v-if="envRecords.length">
          <div class="env-item">
            <span class="env-val">{{ envRecords[0].temperature }}°C</span>
            <span class="env-lbl">温度</span>
          </div>
          <div class="env-item">
            <span class="env-val">{{ envRecords[0].humidity }}%</span>
            <span class="env-lbl">空气湿度</span>
          </div>
          <div class="env-item">
            <span class="env-val">{{ envRecords[0].light_intensity }} lx</span>
            <span class="env-lbl">光照强度</span>
          </div>
          <div class="env-item">
            <span class="env-val">pH {{ envRecords[0].soil_ph }}</span>
            <span class="env-lbl">土壤酸碱性</span>
          </div>
          <div class="env-item">
            <span class="env-val">{{ envRecords[0].soil_moisture }}%</span>
            <span class="env-lbl">土壤水分</span>
          </div>
          <div class="env-item">
            <span class="env-val">AQI {{ envRecords[0].air_quality_index }}</span>
            <span class="env-lbl">空气质量</span>
          </div>
        </div>
        <div v-else class="empty-block">暂无环境数据</div>

        <div v-if="envRecords.length > 1" style="margin-top:16px">
          <details class="env-history">
            <summary>查看历史记录 (共 {{ envRecords.length }} 条)</summary>
            <div class="table-wrap" style="margin-top:12px">
              <table class="data-table">
                <thead>
                  <tr><th>时间</th><th>温度</th><th>湿度</th><th>光照</th><th>pH</th><th>水分</th><th>AQI</th></tr>
                </thead>
                <tbody>
                  <tr v-for="r in envRecords.slice(0, 12)" :key="r.id">
                    <td>{{ r.recorded_at?.slice(0, 10) }}</td>
                    <td>{{ r.temperature }}°C</td>
                    <td>{{ r.humidity }}%</td>
                    <td>{{ r.light_intensity }}</td>
                    <td>{{ r.soil_ph }}</td>
                    <td>{{ r.soil_moisture }}%</td>
                    <td>{{ r.air_quality_index }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </section>

      <!-- ── 底部认证 ── -->
      <footer class="trace-footer">
        <div class="footer-cert">&#10003; 地宜本草溯源系统认证</div>
        <p>山西道地药材 · 一药一码 · 全链溯源</p>
        <p class="footer-time">溯源时间 {{ new Date().toLocaleString('zh-CN') }}</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { batchApi } from '../api'

const route = useRoute()
const batchCode = route.params.batchCode as string
const batch = ref<any>(null)
const loading = ref(true)
const stats = ref({ pest_control_count: 0, irrigation_count: 0, fertilize_count: 0, total_env_records: 0, total_growth_records: 0 })
const envRecords = ref<any[]>([])
const growthRecords = ref<any[]>([])

function typeColor(type: string) {
  const m: Record<string, string> = { '除虫':'tag-seal', '浇灌':'tag-blue', '施肥':'tag-purple', '除草':'tag-sage', '松土':'tag-stone', '采摘':'tag-bark' }
  return m[type] || 'tag-stone'
}

onMounted(async () => {
  try {
    const data = await batchApi.getByCode(batchCode)
    batch.value = data
    stats.value = data.stats
    envRecords.value = data.environment_records || []
    growthRecords.value = data.growth_records || []
  } catch (e) {
    console.error('加载溯源信息失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ── 页面 ── */
.trace-page { min-height: 100vh; background: var(--paper); }
.trace-loading, .trace-empty { text-align: center; padding: 100px 20px; color: var(--ink-3); }
.trace-empty .empty-icon { font-size: 48px; margin-bottom: 12px; color: var(--seal); }

.spinner { width: 32px; height: 32px; border: 3px solid var(--stone); border-top-color: var(--sage); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

.trace-body { max-width: 720px; margin: 0 auto; padding: 20px 16px 40px; }

/* ── 头部印章区 ── */
.trace-hero {
  display: flex; justify-content: space-between; align-items: center; gap: 20px;
  margin-bottom: 28px; padding-bottom: 28px;
  border-bottom: 2px solid var(--stone);
}
@media (max-width: 480px) { .trace-hero { flex-direction: column; text-align: center; } }

.hero-badge {
  display: inline-block; padding: 4px 12px; border-radius: 20px;
  background: var(--seal); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 1px;
}
.hero-text h1 { font-size: 28px; margin: 8px 0 4px; font-weight: 800; letter-spacing: 2px; }
.hero-latin { font-size: 13px; color: var(--ink-3); font-style: italic; }
.hero-origin { font-size: 13px; color: var(--ink-2); margin-top: 4px; }

/* ── QR码印章 ── */
.hero-qr { text-align: center; flex-shrink: 0; }
.qr-seal {
  padding: 12px; background: var(--white);
  border: 3px solid var(--seal); border-radius: 16px;
  display: inline-block; position: relative;
}
.qr-seal::after {
  content: ''; position: absolute; inset: -7px; border: 1.5px solid var(--seal);
  border-radius: 20px; opacity: .4; pointer-events: none;
}
.qr-seal-inner { width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; }
.qr-seal-inner img { width: 100%; height: 100%; border-radius: 4px; }
.qr-fallback { color: var(--ink-3); font-size: 11px; word-break: break-all; }
.qr-seal-label {
  margin-top: 8px; font-size: 12px; font-weight: 700; color: var(--seal);
  letter-spacing: 3px; text-transform: uppercase;
}
.qr-code-text { margin-top: 6px; font-size: 12px; color: var(--ink-3); font-family: monospace; }

@media (max-width: 480px) {
  .qr-seal-inner { width: 130px; height: 130px; }
}

/* ── 分区 ── */
.trace-section { margin-bottom: 28px; }
.section-title {
  font-size: 15px; font-weight: 700; color: var(--sage); margin-bottom: 14px;
  display: flex; align-items: baseline; gap: 8px;
}
.section-num {
  font-size: 11px; color: var(--seal); font-weight: 800;
  border: 1.5px solid var(--seal); border-radius: 4px; padding: 1px 6px;
}
.section-sub { font-size: 12px; color: var(--ink-3); font-weight: 400; }

/* ── 信息网格 ── */
.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
@media (max-width: 420px) { .info-grid { grid-template-columns: repeat(2, 1fr); } }
.info-item {
  background: var(--paper-card); padding: 12px; border-radius: 10px;
  border: 1px solid var(--stone-light);
}
.info-label { display: block; font-size: 10px; color: var(--ink-3); text-transform: uppercase; letter-spacing: .5px; }
.info-val { display: block; font-size: 13px; font-weight: 600; margin-top: 3px; }

/* ── 统计横条 ── */
.stat-row { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
@media (max-width: 420px) { .stat-row { display: grid; grid-template-columns: repeat(2, 1fr); } }
.stat-pill {
  flex: 1; min-width: 80px; background: var(--paper-card);
  padding: 14px 12px; border-radius: 12px; text-align: center;
  border: 1px solid var(--stone-light);
}
.pill-num { display: block; font-size: 28px; font-weight: 800; color: var(--sage); line-height: 1.1; }
.pill-label { display: block; font-size: 11px; color: var(--ink-3); margin-top: 4px; }

/* ── 时间线 ── */
.timeline { position: relative; }
.timeline::before { content: ''; position: absolute; left: 5px; top: 0; bottom: 0; width: 2px; background: var(--stone); }
.timeline-item { position: relative; padding: 0 0 12px 20px; }
.timeline-item::before {
  content: ''; position: absolute; left: -1px; top: 4px;
  width: 10px; height: 10px; border-radius: 50%; background: var(--sage);
  box-shadow: 0 0 0 3px var(--sage-light);
}
.tl-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.tl-desc { font-weight: 600; font-size: 13px; }
.tl-meta { font-size: 11px; color: var(--ink-3); margin-top: 3px; }
.tl-sep { margin: 0 4px; opacity: .4; }

/* ── 环境 ── */
.env-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
@media (max-width: 360px) { .env-grid { grid-template-columns: repeat(2, 1fr); } }
.env-item {
  background: var(--white); padding: 14px 8px; border-radius: 10px;
  text-align: center; border: 1px solid var(--stone-light);
}
.env-val { display: block; font-size: 16px; font-weight: 700; color: var(--sage); }
.env-lbl { display: block; font-size: 10px; color: var(--ink-3); margin-top: 4px; text-transform: uppercase; letter-spacing: .3px; }

/* ── 折叠历史 ── */
.env-history summary { font-size: 12px; color: var(--sage); cursor: pointer; font-weight: 600; }

/* ── 空 ── */
.empty-block { text-align: center; padding: 24px; color: var(--ink-3); font-size: 13px; }

/* ── 底部认证 ── */
.trace-footer { text-align: center; padding: 28px 8px; border-top: 1px solid var(--stone); margin-top: 8px; }
.footer-cert { font-size: 15px; font-weight: 700; color: var(--sage); margin-bottom: 6px; }
.trace-footer p { font-size: 11px; color: var(--ink-3); }
.footer-time { margin-top: 6px; opacity: .6; }
</style>
