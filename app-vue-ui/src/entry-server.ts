import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from './App.vue'
import './assets/main.css'

// Import views
import LoginView from './views/LoginView.vue'
import DashboardView from './views/DashboardView.vue'
import PostEditorView from './views/PostEditorView.vue'
import PostViewView from './views/PostViewView.vue'
import BlogListView from './views/BlogListView.vue'
import NotFoundView from './views/NotFoundView.vue'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  
  // Create router with memory history for SSR
  const router = createRouter({
    history: createMemoryHistory(),
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

  app.use(pinia)
  app.use(router)

  return { app, router, pinia }
}
