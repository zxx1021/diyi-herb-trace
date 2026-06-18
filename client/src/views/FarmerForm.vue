<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">新增农户</h2>
        <p class="page-subtitle">生成农户专属二维码，农户扫码即可上传种植记录</p>
      </div>
      <button class="btn btn-ghost" @click="router.back()">返回</button>
    </div>
    <div class="card" style="max-width:560px">
      <form @submit.prevent="submit">
        <div class="form-group">
          <label class="form-label">农户姓名 *</label>
          <input v-model="form.name" class="form-input" placeholder="农户姓名" required />
        </div>
        <div class="form-group">
          <label class="form-label">手机号</label>
          <input v-model="form.phone" class="form-input" placeholder="手机号码" />
        </div>
        <div class="form-group">
          <label class="form-label">地点</label>
          <input v-model="form.location" class="form-input" placeholder="种植地点" />
        </div>
        <div class="form-group">
          <label class="form-label">关联批次</label>
          <select v-model="form.batch_id" class="form-select">
            <option value="">不关联</option>
            <option v-for="b in batches" :key="b.id" :value="b.id">{{ b.batch_code }} — {{ b.herb_name }}</option>
          </select>
        </div>
        <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px">
          <button type="button" class="btn btn-ghost" @click="router.back()">取消</button>
          <button type="submit" class="btn btn-accent">创建农户并生成QR码</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { farmerApi, batchApi } from '../api'

const router = useRouter()
const batches = ref<any[]>([])
const form = ref({ name: '', phone: '', location: '', batch_id: '' })

onMounted(async () => {
  try { batches.value = await batchApi.list() } catch (e) { console.error(e) }
})

async function submit() {
  try {
    await farmerApi.create({ ...form.value, batch_id: form.value.batch_id || null })
    router.push('/farmers')
  } catch (e: any) { alert('创建失败: ' + e.message) }
}
</script>
