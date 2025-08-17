import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './assets/main.css'
import { useAuthStore } from './stores/auth'

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



// Create app
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Navigation guard (moved after pinia is installed)
router.beforeEach(async (to, from, next) => {
  // For session-based auth, we need to check with the API
  // We'll let the auth store handle the authentication check
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Try to check if user is authenticated via API
    try {
      await authStore.checkAuth()
    } catch (error) {
      // If check fails, redirect to login
      next('/login')
      return
    }
    
    // If still not authenticated after check, redirect to login
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }
  
  next()
})

app.mount('#app')
