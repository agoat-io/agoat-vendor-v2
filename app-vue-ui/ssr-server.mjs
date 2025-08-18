import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'

// Polyfill fetch for Node.js
if (!globalThis.fetch) {
  const { default: fetch } = await import('node-fetch')
  globalThis.fetch = fetch
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const port = process.env.PORT || 3000
const API_BASE = 'http://localhost:8080/api'

// Serve static assets
app.use('/assets', express.static(resolve(__dirname, 'dist/client/assets')))
app.use('/public', express.static(resolve(__dirname, 'public')))

// Fetch posts data from API
async function fetchPostsData(page = 1) {
  try {
    const response = await fetch(`${API_BASE}/posts?page=${page}&per_page=10&published=true`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch posts data:', error)
    return null
  }
}

// Fetch single post data from API
async function fetchPostData(postId) {
  try {
    const response = await fetch(`${API_BASE}/posts/${postId}`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch post data:', error)
    return null
  }
}

// Utility functions
function escapeHtml(text) {
  if (!text) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getPreviewText(content, maxLength = 300) {
  if (!content) return ''
  
  let text = content.substring(0, maxLength)
  if (content.length > maxLength) {
    text += '...'
  }
  
  // Basic markdown to HTML conversion for SEO
  return text
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
}

// Generate HTML for posts list (SEO-friendly)
function generatePostsListHTML(data) {
  if (!data || !data.data || !Array.isArray(data.data)) {
    return '<div class="text-center py-12"><p>No posts available</p></div>'
  }

  const posts = data.data
  const postsHTML = posts.map(post => `
    <article class="post-card bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow mb-6">
      <div class="mb-3 sm:mb-4">
        <h2 class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 leading-tight">
          <a href="?post-path=${post.slug}/${post.id}" class="hover:text-blue-600 transition-colors">
            ${escapeHtml(post.title)}
          </a>
        </h2>
        <div class="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
          <span>Published ${formatDate(post.created_at)}</span>
          ${post.updated_at && post.updated_at !== post.created_at ? 
            `<span class="hidden sm:inline">• Updated ${formatDate(post.updated_at)}</span>` : ''}
        </div>
      </div>
      <div class="post-preview mb-3 sm:mb-4">
        <div class="text-sm sm:text-base text-gray-700 leading-relaxed">
          ${getPreviewText(post.content, 300)}
        </div>
      </div>
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <a href="?post-path=${post.slug}/${post.id}" class="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base text-left">
          Read more
        </a>
        <div class="text-xs sm:text-sm text-gray-500">
          ${Math.ceil(post.content.length / 100)} min read
        </div>
      </div>
    </article>
  `).join('')

  return `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div>
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900">AGoat Blog</h1>
              <p class="text-xs sm:text-sm text-gray-600">All articles and insights</p>
            </div>
            <a href="/login" class="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Admin Login
            </a>
          </div>
        </div>
      </header>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div class="posts-list">
          <div class="mb-6 sm:mb-8">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Latest Posts</h1>
            <p class="text-sm sm:text-base text-gray-600">Discover our latest articles and insights</p>
          </div>
          <div class="grid gap-4 sm:gap-6 lg:gap-8">
            ${postsHTML}
          </div>
        </div>
      </main>
    </div>
  `
}

// Generate HTML for single post (SEO-friendly)
function generatePostHTML(data) {
  if (!data || !data.data) {
    return '<div class="text-center py-12"><p>Post not found</p></div>'
  }

  const post = data.data
  const content = getPreviewText(post.content, 800) // Longer preview for SEO

  return `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div>
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900">AGoat Blog</h1>
              <p class="text-xs sm:text-sm text-gray-600">All articles and insights</p>
            </div>
            <a href="/login" class="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Admin Login
            </a>
          </div>
        </div>
      </header>
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div class="mb-6">
          <a href="/" class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            ← Back to All Articles
          </a>
        </div>
        <div class="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
          <article class="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
            <header class="mb-6 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                ${escapeHtml(post.title)}
              </h1>
              <div class="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
                <span>By ${escapeHtml(post.author || 'Admin')}</span>
                <span class="hidden sm:inline">•</span>
                <span>${formatDate(post.created_at)}</span>
                ${post.updated_at && post.updated_at !== post.created_at ? 
                  `<span class="hidden sm:inline">• Updated ${formatDate(post.updated_at)}</span>` : ''}
              </div>
            </header>
            <div class="prose prose-lg max-w-none">
              ${content}
            </div>
          </article>
        </div>
      </main>
    </div>
  `
}

// Generate SEO meta tags based on content
function generateMetaTags(url, data) {
  const urlObj = new URL(url, 'http://localhost')
  
  let title = 'AGoat Blog - Latest Posts and Insights'
  let description = 'Discover the latest articles, insights, and stories from AGoat. Read our blog for valuable content and updates.'
  let ogTitle = title
  let ogDescription = description
  let ogUrl = `http://localhost:3000${url}`
  
  // Customize meta tags based on content
  if (data && data.data) {
    if (Array.isArray(data.data)) {
      // Posts list page
      const postsCount = data.data.length
      title = `AGoat Blog - ${postsCount} Latest Articles`
      description = `Browse ${postsCount} articles and insights. ${data.data.map(p => p.title).slice(0, 3).join(', ')}`
    } else if (data.data.title) {
      // Single post page
      const post = data.data
      title = `${post.title} - AGoat Blog`
      description = post.content.substring(0, 160).replace(/<[^>]*>/g, '').replace(/[#*]/g, '') + '...'
      ogTitle = post.title
      ogDescription = description
    }
  }

  return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:title" content="${escapeHtml(ogTitle)}" />
    <meta property="og:description" content="${escapeHtml(ogDescription)}" />
    <meta property="og:url" content="${ogUrl}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
    <link rel="canonical" href="${ogUrl}" />
  `
}

// SSR handler
app.get('*', async (req, res) => {
  try {
    const url = req.originalUrl
    const urlObj = new URL(url, 'http://localhost')
    
    console.log(`SSR request: ${url}`)
    
    // Pre-fetch data for SEO
    let prerenderedData = null
    let prerenderedHTML = ''
    
    if (urlObj.pathname === '/' || urlObj.pathname === '/blog') {
      // Fetch posts data for SEO
      const page = parseInt(urlObj.searchParams.get('page') || '1')
      prerenderedData = await fetchPostsData(page)
      prerenderedHTML = generatePostsListHTML(prerenderedData)
    } else if (urlObj.searchParams.get('post-path')) {
      // Fetch single post data for SEO
      const postPath = urlObj.searchParams.get('post-path')
      const postId = postPath.split('/').pop()
      if (postId) {
        prerenderedData = await fetchPostData(postId)
        prerenderedHTML = generatePostHTML(prerenderedData)
      }
    }

    // Read the client template
    const templatePath = resolve(__dirname, 'dist/client/index.html')
    const template = fs.readFileSync(templatePath, 'utf-8')
    
    // Generate meta tags
    const metaTags = generateMetaTags(url, prerenderedData)
    
    // For SEO crawlers, serve the pre-rendered HTML directly
    const userAgent = req.get('User-Agent') || ''
    const isBot = /bot|crawler|spider|crawling/i.test(userAgent)
    
    if (isBot && prerenderedHTML) {
      // Serve fully rendered HTML for SEO bots
      const seoHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${metaTags}
          <link rel="stylesheet" href="/assets/style-LzuEnHdG.css">
        </head>
        <body>
          ${prerenderedHTML}
        </body>
        </html>
      `
      res.status(200).set({ 'Content-Type': 'text/html' }).end(seoHTML)
      return
    }
    
    // For regular users, serve the SPA with SSR data for hydration
    const responseHTML = template
      .replace('<!--ssr-outlet-->', '')
      .replace('<!--prerendered-content-->', prerenderedHTML || '')
      .replace('<!--ssr-data-->', `<script>window.__SSR_DATA__ = ${JSON.stringify({ prerenderedData, url })}</script>`)
      .replace('<title>AGoat Publisher</title>', metaTags)

    res.status(200).set({ 'Content-Type': 'text/html' }).end(responseHTML)
  } catch (error) {
    console.error('SSR Error:', error)
    
    // Fallback to client-side rendering
    try {
      const template = fs.readFileSync(resolve(__dirname, 'dist/client/index.html'), 'utf-8')
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template)
    } catch (fallbackError) {
      res.status(500).end('Internal Server Error')
    }
  }
})

app.listen(port, () => {
  console.log(`🚀 SSR Server running at http://localhost:${port}`)
  console.log(`📡 Federation remote at http://localhost:5175`)
  console.log(`🔗 API server at http://localhost:8080`)
  console.log(`🔍 SEO-optimized server-side rendering enabled`)
  console.log(`📱 Responsive design for all screen sizes`)
})

export default app
