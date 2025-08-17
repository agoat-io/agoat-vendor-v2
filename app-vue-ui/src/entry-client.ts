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
import BlogListView from './views/BlogListView.vue'
import NotFoundView from './views/NotFoundView.vue'

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'blog-list',
      component: BlogListView,
      meta: { requiresAuth: false }
    },
    {
      path: '/blog',
      name: 'blog-list-alt',
      component: BlogListView,
      meta: { requiresAuth: false }
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
      path: '/post/:id/:slug?',
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

// Create app and pinia
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth store
const { useAuthStore } = await import('./stores/auth')
const authStore = useAuthStore()
authStore.initializeAuth()

// Navigation guard - moved after pinia is created
router.beforeEach(async (to, from, next) => {
  // Import auth store after pinia is available
  const { useAuthStore } = await import('./stores/auth')
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

// Wait for router to be ready before mounting
router.isReady().then(() => {
  app.mount('#app')
})
