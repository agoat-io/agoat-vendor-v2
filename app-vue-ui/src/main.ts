import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './assets/main.css'

// Import views
import LoginView from './views/LoginView.vue'
import DashboardView from './views/DashboardView.vue'
import PostEditorView from './views/PostEditorView.vue'
import PostViewView from './views/PostViewView.vue'
import NotFoundView from './views/NotFoundView.vue'

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/post/new',
      name: 'post-new',
      component: PostEditorView,
      meta: { requiresAuth: true }
    },
    {
      path: '/post/:id/edit',
      name: 'post-edit',
      component: PostEditorView,
      meta: { requiresAuth: true }
    },
    {
      path: '/post/:id',
      name: 'post-view',
      component: PostViewView,
      meta: { requiresAuth: false }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView
    }
  ]
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('auth-token')
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.name === 'login' && isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

// Create app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
