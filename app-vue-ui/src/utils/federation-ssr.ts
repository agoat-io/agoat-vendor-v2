// Server-Side Module Federation utilities
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

interface FederationSSROptions {
  remoteUrl: string
  componentName: string
  props?: Record<string, any>
  apiUrl?: string
}

export class FederationSSR {
  private remoteCache = new Map<string, any>()

  // Load remote module at runtime
  async loadRemoteModule(remoteUrl: string, componentName: string): Promise<any> {
    const cacheKey = `${remoteUrl}#${componentName}`
    
    if (this.remoteCache.has(cacheKey)) {
      return this.remoteCache.get(cacheKey)
    }

    try {
      // In a real implementation, you would fetch the remote entry
      // and dynamically import the component
      console.log(`Loading remote module: ${componentName} from ${remoteUrl}`)
      
      // For now, we'll simulate this with a direct import
      // In production, this would be a dynamic fetch and eval
      const module = await this.dynamicImport(remoteUrl, componentName)
      
      this.remoteCache.set(cacheKey, module)
      return module
    } catch (error) {
      console.error(`Failed to load remote module ${componentName}:`, error)
      throw error
    }
  }

  // Dynamic import using runtime federation
  private async dynamicImport(remoteUrl: string, componentName: string): Promise<any> {
    try {
      // For SSR, we'll use a runtime approach that fetches the remote module
      if (typeof window === 'undefined') {
        // Server-side: use fetch to get the remote component
        return await this.fetchRemoteComponent(remoteUrl, componentName)
      } else {
        // Client-side: use dynamic import with federation
        switch (componentName) {
          case 'PostsList':
            return (await import('viewer-remote/PostsList')).default
          case 'PostViewer':
            return (await import('viewer-remote/PostViewer')).default
          default:
            throw new Error(`Unknown component: ${componentName}`)
        }
      }
    } catch (error) {
      console.error(`Failed to import component ${componentName}:`, error)
      
      // Fallback: return a simple component
      return {
        template: `<div class="federation-fallback">
          <p class="text-gray-500">Component ${componentName} not available</p>
        </div>`
      }
    }
  }

  // Fetch remote component for SSR
  private async fetchRemoteComponent(remoteUrl: string, componentName: string): Promise<any> {
    // For SSR, we'll create a simple component that renders the data
    // In a full implementation, you'd fetch and execute the remote bundle
    
    return {
      props: ['apiUrl', 'showPublishedOnly', 'page', 'limit', 'isAuthenticated', 'maxContentLength', 'initialData'],
      template: `
        <div class="ssr-posts-list">
          <div v-if="initialData && initialData.data" class="posts-grid">
            <div class="mb-6 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Latest Posts</h1>
              <p class="text-sm sm:text-base text-gray-600">Discover our latest articles and insights</p>
            </div>
            <div class="grid gap-4 sm:gap-6 lg:gap-8">
              <article 
                v-for="post in initialData.data" 
                :key="post.id" 
                class="post-card bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div class="mb-3 sm:mb-4">
                  <h2 class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                    <a :href="'?post-path=' + post.slug + '/' + post.id" class="hover:text-blue-600 transition-colors">
                      {{ post.title }}
                    </a>
                  </h2>
                  <div class="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
                    <span>Published {{ formatDate(post.created_at) }}</span>
                    <span v-if="post.updated_at && post.updated_at !== post.created_at" class="hidden sm:inline">
                      • Updated {{ formatDate(post.updated_at) }}
                    </span>
                  </div>
                </div>
                <div class="post-preview mb-3 sm:mb-4">
                  <div class="text-sm sm:text-base text-gray-700 leading-relaxed" v-html="getPreviewText(post.content)"></div>
                </div>
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <a 
                    :href="'?post-path=' + post.slug + '/' + post.id"
                    class="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base text-left"
                  >
                    {{ isAuthenticated ? 'Read full article' : 'Read more' }}
                  </a>
                  <div v-if="!isAuthenticated && post.content.length > 800" class="text-xs sm:text-sm text-gray-500">
                    {{ Math.ceil(post.content.length / 100) }} min read
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      `,
      methods: {
        formatDate(dateString: string) {
          return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        },
        getPreviewText(content: string) {
          let text = content
          if (!this.isAuthenticated && text.length > (this.maxContentLength || 300)) {
            text = text.substring(0, this.maxContentLength || 300) + '...'
          }
          // Simple markdown to HTML (basic implementation for SSR)
          return text
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
        }
      }
    }
  }

  // Render component to HTML string for SSR
  async renderToHTML(options: FederationSSROptions): Promise<string> {
    try {
      const component = await this.loadRemoteModule(options.remoteUrl, options.componentName)
      
      // Create SSR app with the remote component
      const app = createSSRApp({
        components: {
          RemoteComponent: component
        },
        template: `<RemoteComponent v-bind="props" />`,
        data() {
          return {
            props: options.props || {}
          }
        }
      })

      // Render to HTML string
      const html = await renderToString(app)
      return html
    } catch (error) {
      console.error('SSR rendering failed:', error)
      return `<div class="error">Failed to render component: ${options.componentName}</div>`
    }
  }

  // Pre-fetch data for SSR
  async prefetchData(apiUrl: string, endpoint: string, params?: Record<string, any>): Promise<any> {
    try {
      const url = new URL(endpoint, apiUrl)
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value))
        })
      }

      const response = await fetch(url.toString())
      const data = await response.json()
      
      return data
    } catch (error) {
      console.error('Data prefetch failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const federationSSR = new FederationSSR()

// SSR helper for posts list
export async function renderPostsListSSR(props: {
  page?: number
  limit?: number
  isAuthenticated?: boolean
  apiUrl?: string
}): Promise<{ html: string; data: any }> {
  const apiUrl = props.apiUrl || 'http://localhost:8080/api'
  
  // Pre-fetch posts data
  const postsData = await federationSSR.prefetchData(apiUrl, '/posts', {
    page: props.page || 1,
    per_page: props.limit || 10,
    published: 'true'
  })

  // Render component with pre-fetched data
  const html = await federationSSR.renderToHTML({
    remoteUrl: 'http://localhost:5175',
    componentName: 'PostsList',
    props: {
      ...props,
      initialData: postsData
    }
  })

  return { html, data: postsData }
}

// SSR helper for single post
export async function renderPostViewerSSR(props: {
  postId?: string
  postSlug?: string
  isAuthenticated?: boolean
  apiUrl?: string
}): Promise<{ html: string; data: any }> {
  const apiUrl = props.apiUrl || 'http://localhost:8080/api'
  
  // Pre-fetch post data
  const endpoint = props.postSlug 
    ? `/posts/${props.postId}/${props.postSlug}`
    : `/posts/${props.postId}`
    
  const postData = await federationSSR.prefetchData(apiUrl, endpoint)

  // Render component with pre-fetched data
  const html = await federationSSR.renderToHTML({
    remoteUrl: 'http://localhost:5175',
    componentName: 'PostViewer',
    props: {
      ...props,
      initialData: postData
    }
  })

  return { html, data: postData }
}
