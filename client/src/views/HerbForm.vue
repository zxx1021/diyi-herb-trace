<template>
  <div>
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ isEdit ? '编辑药材' : '新增药材' }}</h2>
        <p class="page-subtitle">登记山西道地药材品种信息</p>
      </div>
      <button class="btn btn-secondary" @click="router.back()">返回</button>
    </div>

    <div class="card" style="max-width:640px">
      <form @submit.prevent="submit">
        <div class="form-group">
          <label class="form-label">药材名称 *</label>
          <input v-model="form.name" class="form-input" placeholder="如: 黄芪、党参、连翘..." required />
        </div>
        <div class="form-group">
          <label class="form-label">学名</label>
          <input v-model="form.scientific_name" class="form-input" placeholder="拉丁学名" />
        </div>
        <div class="form-group">
          <label class="form-label">分类</label>
          <select v-model="form.category" class="form-select">
            <option value="">请选择</option>
            <option value="根茎类">根茎类</option>
            <option value="果实类">果实类</option>
            <option value="花叶类">花叶类</option>
            <option value="全草类">全草类</option>
            <option value="菌藻类">菌藻类</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">产地 *</label>
          <input v-model="form.origin" class="form-input" placeholder="山西省xx市xx县" required />
        </div>
        <div class="form-group">
          <label class="form-label">药材描述</label>
          <textarea v-model="form.description" class="form-textarea" placeholder="描述药材特性、药用价值、道地优势等..."></textarea>
        </div>
        <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:24px">
          <button type="button" class="btn btn-secondary" @click="router.back()">取消</button>
          <button type="submit" class="btn btn-primary">{{ isEdit ? '保存修改' : '添加药材' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { herbApi } from '../api'

const router = useRouter()
const route = useRoute()
const isEdit = !!route.params.id

const form = ref({
  name: '',
  scientific_name: '',
  category: '',
  origin: '',
  description: ''
})

onMounted(async () => {
  if (isEdit && route.params.id) {
    try {
      const herb = await herbApi.get(route.params.id as string)
      form.value = {
        name: herb.name,
        scientific_name: herb.scientific_name || '',
        category: herb.category || '',
        origin: herb.origin,
        description: herb.description || ''
      }
    } catch (e) {
      alert('加载药材信息失败')
    }
  }
})

async function submit() {
  try {
    if (isEdit) {
      await herbApi.update(route.params.id as string, form.value)
    } else {
      await herbApi.create(form.value)
    }
    router.push('/herbs')
  } catch (e: any) {
    alert('操作失败: ' + e.message)
  }
}
</script>
