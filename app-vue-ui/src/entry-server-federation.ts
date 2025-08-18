import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'
import { renderPostsListSSR, renderPostViewerSSR } from './utils/federation-ssr'
import './assets/main.css'

// Import views
import LoginView from './views/LoginView.vue'
import DashboardView from './views/DashboardView.vue'
import PostEditorView from './views/PostEditorView.vue'
import PostViewView from './views/PostViewView.vue'
import BlogListView from './views/BlogListView.vue'
import NotFoundView from './views/NotFoundView.vue'

interface SSRContext {
  url: string
  userAgent?: string
  cookies?: string
}

export async function render(url: string, context: SSRContext = { url }) {
  const { app, router, pinia } = createApp()
  
  // Parse URL and extract parameters
  const urlObj = new URL(url, 'http://localhost')
  const pathname = urlObj.pathname
  const searchParams = urlObj.searchParams
  
  // Pre-render federated components for SEO
  let prerenderedHTML = ''
  let prerenderedData = null
  
  try {
    if (pathname === '/' || pathname === '/blog') {
      // Pre-render posts list
      const page = parseInt(searchParams.get('page') || '1')
      const result = await renderPostsListSSR({
        page,
        limit: 10,
        isAuthenticated: false, // For public view
        apiUrl: 'http://localhost:8080/api'
      })
      prerenderedHTML = result.html
      prerenderedData = result.data
    } else if (pathname.startsWith('/post/')) {
      // Pre-render single post
      const pathParts = pathname.split('/')
      const postId = pathParts[2]
      const postSlug = pathParts[3]
      
      if (postId) {
        const result = await renderPostViewerSSR({
          postId,
          postSlug,
          isAuthenticated: false,
          apiUrl: 'http://localhost:8080/api'
        })
        prerenderedHTML = result.html
        prerenderedData = result.data
      }
    }
  } catch (error) {
    console.error('Federation SSR error:', error)
  }

  // Set the router to the current URL
  await router.push(url)
  await router.isReady()

  // Render the app
  const html = await renderToString(app)
  
  // Inject pre-rendered content and data
  const ssrData = {
    prerenderedHTML,
    prerenderedData,
    url,
    timestamp: new Date().toISOString()
  }

  return {
    html,
    prerenderedHTML,
    prerenderedData,
    ssrData
  }
}

function createApp() {
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
