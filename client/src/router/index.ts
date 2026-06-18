import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue')
    },
    {
      path: '/herbs',
      name: 'herbs',
      component: () => import('../views/HerbList.vue')
    },
    {
      path: '/herbs/new',
      name: 'herb-new',
      component: () => import('../views/HerbForm.vue')
    },
    {
      path: '/herbs/:id/edit',
      name: 'herb-edit',
      component: () => import('../views/HerbForm.vue'),
      props: true
    },
    {
      path: '/batches',
      name: 'batches',
      component: () => import('../views/BatchList.vue')
    },
    {
      path: '/batches/new',
      name: 'batch-new',
      component: () => import('../views/BatchForm.vue')
    },
    {
      path: '/batches/:id',
      name: 'batch-detail',
      component: () => import('../views/BatchDetail.vue')
    },
    {
      path: '/environment',
      name: 'environment',
      component: () => import('../views/EnvironmentData.vue')
    },
    {
      path: '/farmers',
      name: 'farmers',
      component: () => import('../views/FarmerList.vue')
    },
    {
      path: '/farmers/new',
      name: 'farmer-new',
      component: () => import('../views/FarmerForm.vue')
    },
    {
      path: '/farmer/:farmerId',
      name: 'farmer-entry',
      component: () => import('../views/FarmerEntry.vue')
    },
    {
      path: '/trace/:batchCode',
      name: 'traceability',
      component: () => import('../views/TraceabilityView.vue')
    }
  ]
})

export default router
