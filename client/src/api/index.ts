// 开发环境用 Vite proxy，生产部署构建时设置 VITE_API_URL=https://xxx/api
const BASE = import.meta.env.VITE_API_URL as string || '/api'

async function request(url: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// 药材 API
export const herbApi = {
  list: () => request('/herbs'),
  get: (id: string) => request(`/herbs/${id}`),
  create: (data: any) => request('/herbs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request(`/herbs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/herbs/${id}`, { method: 'DELETE' }),
}

// 批次 API
export const batchApi = {
  list: () => request('/batches'),
  get: (id: string) => request(`/batches/${id}`),
  getByCode: (code: string) => request(`/batches/code/${code}`),
  create: (data: any) => request('/batches', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/batches/${id}`, { method: 'DELETE' }),
}

// 环境监测 API
export const envApi = {
  listByBatch: (batchId: string) => request(`/environment/batch/${batchId}`),
  latest: (batchId: string) => request(`/environment/latest/${batchId}`),
  stats: (batchId: string) => request(`/environment/stats/${batchId}`),
  create: (data: any) => request('/environment', { method: 'POST', body: JSON.stringify(data) }),
}

// 种植记录 API
export const growthApi = {
  listByBatch: (batchId: string) => request(`/growth/batch/${batchId}`),
  stats: (batchId: string) => request(`/growth/stats/${batchId}`),
  create: (data: any) => request('/growth', { method: 'POST', body: JSON.stringify(data) }),
}

// 农户 API
export const farmerApi = {
  list: () => request('/farmers'),
  get: (id: string) => request(`/farmers/${id}`),
  getBatches: (id: string) => request(`/farmers/${id}/batches`),
  create: (data: any) => request('/farmers', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/farmers/${id}`, { method: 'DELETE' }),
  submitRecord: (farmerId: string, data: any) => request(`/farmers/${farmerId}/records`, { method: 'POST', body: JSON.stringify(data) }),
}
