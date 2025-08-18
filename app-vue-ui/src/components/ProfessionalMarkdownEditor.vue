<template>
  <div class="professional-markdown-editor" :class="{ 'fullscreen': isFullscreen }">
    <!-- Toolbar -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <div class="toolbar-group">
          <button @click="insertMarkdown('**', '**')" type="button" class="toolbar-button" title="Bold">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12h8a4 4 0 100-8H6v8zm0 0h8a4 4 0 110 8H6v-8z" />
            </svg>
          </button>
          
          <button @click="insertMarkdown('*', '*')" type="button" class="toolbar-button" title="Italic">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
          
          <button @click="insertMarkdown('~~', '~~')" type="button" class="toolbar-button" title="Strikethrough">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>
        
        <div class="toolbar-group">
          <button @click="insertMarkdown('# ', '')" type="button" class="toolbar-button" title="Heading 1">
            H1
          </button>
          
          <button @click="insertMarkdown('## ', '')" type="button" class="toolbar-button" title="Heading 2">
            H2
          </button>
          
          <button @click="insertMarkdown('### ', '')" type="button" class="toolbar-button" title="Heading 3">
            H3
          </button>
        </div>
        
        <div class="toolbar-group">
          <button @click="insertMarkdown('- ', '')" type="button" class="toolbar-button" title="Bullet List">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          
          <button @click="insertMarkdown('1. ', '')" type="button" class="toolbar-button" title="Numbered List">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </button>
          
          <button @click="insertMarkdown('> ', '')" type="button" class="toolbar-button" title="Quote">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
        
        <div class="toolbar-group">
          <button @click="insertLink" type="button" class="toolbar-button" title="Add Link">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          
          <button @click="insertImage" type="button" class="toolbar-button" title="Add Image">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button @click="insertMarkdown('```\n', '\n```')" type="button" class="toolbar-button" title="Code Block">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
          
          <button @click="insertTable" type="button" class="toolbar-button" title="Insert Table">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
      
      <div class="toolbar-right">
        <div class="toolbar-group">
          <button @click="togglePreview" type="button" class="toolbar-button" :class="{ 'is-active': showPreview }" title="Toggle Preview">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          
          <button @click="toggleFullscreen" type="button" class="toolbar-button" :class="{ 'is-active': isFullscreen }" :title="isFullscreen ? 'Restore' : 'Maximize'">
            <svg v-if="!isFullscreen" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Editor Layout -->
    <div class="editor-layout" :class="{ 'with-preview': showPreview }">
      <!-- Code Editor -->
      <div class="editor-main" :style="{ width: showPreview ? `${editorWidth}%` : '100%' }">
        <div class="code-editor">
          <textarea
            ref="textareaRef"
            v-model="markdownContent"
            :placeholder="placeholder"
            class="markdown-textarea"
            @input="updateContent"
            @scroll="syncScroll"
          ></textarea>
        </div>
      </div>
      
      <!-- Resizable Divider -->
      <div v-if="showPreview" 
           class="resizable-divider"
           @mousedown="startResize"
           :style="{ left: `${editorWidth}%` }">
        <div class="divider-handle"></div>
      </div>
      
      <!-- Preview Panel -->
      <div v-if="showPreview" 
           class="preview-panel"
           :style="{ width: `${100 - editorWidth}%` }">
        <div class="preview-header">
          <span class="preview-title">Preview</span>
          <div class="preview-controls">
            <button @click="refreshPreview" type="button" class="preview-button" title="Refresh Preview">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <div 
          ref="previewRef"
          class="preview-content markdown-body" 
          @scroll="syncPreviewScroll"
        ></div>
      </div>
    </div>
    
    <!-- Link Dialog -->
    <div v-if="showLinkDialog" class="modal-overlay" @click="closeLinkDialog">
      <div class="modal-content" @click.stop>
        <h3 class="text-lg font-semibold mb-4">Add Link</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Text</label>
            <input
              v-model="linkText"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Link text"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              v-model="linkUrl"
              type="url"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>
          <div class="flex justify-end space-x-2">
            <button @click="closeLinkDialog" class="px-4 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button @click="confirmLink" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Add Link
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { marked } from 'marked'

interface Props {
  modelValue: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: `# Start Writing Your Blog Post

Begin your blog post here. You can use the toolbar above to format your content.

## Writing Tips
- Use **bold** for emphasis
- Use *italic* for subtle emphasis  
- Create lists with bullet points
- Add [links](https://example.com) to reference sources
- Include images for visual appeal

> Pro tip: You can see your content rendered in real-time on the right side!

\`\`\`javascript
// You can even include code examples
console.log('Hello, World!');
\`\`\`

Happy writing! 🚀`
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Configure marked for better rendering
marked.use({
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
})

// Reactive data
const markdownContent = ref(props.modelValue || '')

const showPreview = ref(true) // Default to showing preview
const isFullscreen = ref(false)
const editorWidth = ref(50) // Default 50/50 split
const showLinkDialog = ref(false)
const linkText = ref('')
const linkUrl = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const previewRef = ref<HTMLDivElement>()
const isResizing = ref(false)

// Computed
const renderedContent = computed(() => {
  if (!markdownContent.value) return ''
  try {
    const html = marked.parse(markdownContent.value)
    return html
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return markdownContent.value
  }
})

// Methods
const updateContent = () => {
  emit('update:modelValue', markdownContent.value)
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
  if (showPreview.value) {
    nextTick(() => {
      const previewElement = previewRef.value
      if (previewElement) {
        previewElement.innerHTML = renderedContent.value
      }
    })
  }
}

// Scroll synchronization
const syncScroll = (event: Event) => {
  if (!showPreview.value || !previewRef.value) return
  
  const textarea = event.target as HTMLTextAreaElement
  const preview = previewRef.value
  
  // Calculate scroll percentage
  const scrollPercent = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight)
  
  // Apply to preview
  const previewScrollTop = scrollPercent * (preview.scrollHeight - preview.clientHeight)
  preview.scrollTop = previewScrollTop
}

const syncPreviewScroll = (event: Event) => {
  if (!textareaRef.value) return
  
  const preview = event.target as HTMLElement
  const textarea = textareaRef.value
  
  // Calculate scroll percentage
  const scrollPercent = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
  
  // Apply to textarea
  const textareaScrollTop = scrollPercent * (textarea.scrollHeight - textarea.clientHeight)
  textarea.scrollTop = textareaScrollTop
}

const refreshPreview = () => {
  const previewElement = previewRef.value
  if (previewElement) {
    previewElement.innerHTML = renderedContent.value
  }
}

// Resize functionality
const startResize = (e: MouseEvent) => {
  e.preventDefault()
  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  
  const container = document.querySelector('.editor-layout') as HTMLElement
  if (!container) return
  
  const rect = container.getBoundingClientRect()
  const newWidth = ((e.clientX - rect.left) / rect.width) * 100
  
  // Limit width between 20% and 80%
  editorWidth.value = Math.max(20, Math.min(80, newWidth))
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// Toolbar functions
const insertMarkdown = (before: string, after: string) => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = markdownContent.value.substring(start, end)
  
  const newText = before + selectedText + after
  markdownContent.value = markdownContent.value.substring(0, start) + newText + markdownContent.value.substring(end)
  
  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
  })
  
  updateContent()
}

const insertLink = () => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = markdownContent.value.substring(start, end)
  
  linkText.value = selectedText
  linkUrl.value = ''
  showLinkDialog.value = true
}

const insertImage = () => {
  const url = window.prompt('Enter image URL:')
  if (url) {
    const alt = window.prompt('Enter image description (for accessibility):') || ''
    const imageMarkdown = `![${alt}](${url})`
    insertMarkdown(imageMarkdown, '')
  }
}

const insertTable = () => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = markdownContent.value.substring(start, end)

  const tableMarkdown = `| ${selectedText} | ${selectedText} |
| --- | --- |`
  insertMarkdown(tableMarkdown, '')
}

// Link dialog functions
const closeLinkDialog = () => {
  showLinkDialog.value = false
  linkText.value = ''
  linkUrl.value = ''
}

const confirmLink = () => {
  if (linkText.value && linkUrl.value) {
    const linkMarkdown = `[${linkText.value}](${linkUrl.value})`
    insertMarkdown(linkMarkdown, '')
  }
  closeLinkDialog()
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue !== markdownContent.value) {
    markdownContent.value = newValue || ''
  }
}, { immediate: true })

watch(() => showPreview.value, (show) => {
  if (show) {
    nextTick(() => {
      const previewElement = previewRef.value
      if (previewElement) {
        previewElement.innerHTML = renderedContent.value
      }
    })
  }
}, { immediate: true })

watch(() => renderedContent.value, (newContent) => {
  if (showPreview.value && previewRef.value) {
    previewRef.value.innerHTML = newContent
  }
})

// Cleanup
onUnmounted(() => {
  if (isFullscreen.value) {
    document.body.style.overflow = ''
  }
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.professional-markdown-editor {
  @apply border border-gray-300 rounded-lg overflow-hidden bg-white;
  transition: all 0.3s ease;
}

.professional-markdown-editor.fullscreen {
  @apply fixed inset-0 z-50;
  border-radius: 0;
}

.editor-toolbar {
  @apply flex items-center justify-between gap-2 p-3 bg-gray-50 border-b border-gray-200 flex-wrap;
}

.toolbar-left {
  @apply flex items-center gap-2;
}

.toolbar-right {
  @apply flex items-center gap-2;
}

.toolbar-group {
  @apply flex items-center gap-1;
}

.toolbar-group:not(:last-child) {
  @apply border-r border-gray-300 pr-2;
}

.toolbar-button {
  @apply p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors;
}

.toolbar-button.is-active {
  @apply bg-blue-100 text-blue-700;
}

.editor-layout {
  @apply relative;
  display: flex;
  min-height: 500px;
}

.editor-main {
  @apply bg-white;
  transition: width 0.2s ease;
}

.code-editor {
  @apply bg-white h-full;
}

.markdown-textarea {
  @apply w-full h-full p-4 border-0 resize-none focus:outline-none focus:ring-0 bg-white;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.resizable-divider {
  @apply absolute top-0 bottom-0 w-1 bg-gray-300 cursor-col-resize;
  z-index: 10;
}

.resizable-divider:hover {
  @apply bg-blue-500;
}

.divider-handle {
  @apply absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-8 bg-gray-400 rounded;
}

.resizable-divider:hover .divider-handle {
  @apply bg-blue-500;
}

.preview-panel {
  @apply bg-gray-50 border-l border-gray-200 flex flex-col;
  transition: width 0.2s ease;
}

.preview-header {
  @apply flex items-center justify-between p-3 bg-white border-b border-gray-200;
}

.preview-title {
  @apply text-sm font-medium text-gray-700;
}

.preview-controls {
  @apply flex items-center gap-1;
}

.preview-button {
  @apply p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors;
}

.preview-content {
  @apply flex-1 p-4 overflow-y-auto;
  min-height: 400px;
}

/* Ensure preview content inherits proper styling */
.preview-content.markdown-body {
  @apply text-gray-900 leading-relaxed;
  font-family: 'Inter', 'Segoe UI', sans-serif;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg p-6 max-w-md w-full mx-4;
}

/* Professional Markdown Styling - Global scope for dynamic content */
:global(.markdown-body) {
  @apply text-gray-900 leading-relaxed;
  font-family: 'Inter', 'Segoe UI', sans-serif;
}

:global(.markdown-body h1) {
  @apply text-3xl font-bold text-gray-900 mb-6 mt-8 border-b border-gray-200 pb-2;
}

:global(.markdown-body h2) {
  @apply text-2xl font-bold text-gray-900 mb-4 mt-6;
}

:global(.markdown-body h3) {
  @apply text-xl font-bold text-gray-900 mb-3 mt-5;
}

:global(.markdown-body h4) {
  @apply text-lg font-semibold text-gray-900 mb-2 mt-4;
}

:global(.markdown-body h5) {
  @apply text-base font-semibold text-gray-900 mb-2 mt-3;
}

:global(.markdown-body h6) {
  @apply text-sm font-semibold text-gray-900 mb-2 mt-3;
}

:global(.markdown-body p) {
  @apply mb-4 leading-7 text-gray-700;
}

:global(.markdown-body ul) {
  @apply mb-4 pl-6 space-y-2;
}

:global(.markdown-body ol) {
  @apply mb-4 pl-6 space-y-2;
}

:global(.markdown-body li) {
  @apply text-gray-700 leading-6;
}

:global(.markdown-body li > ul) {
  @apply mt-2 mb-0;
}

:global(.markdown-body li > ol) {
  @apply mt-2 mb-0;
}

:global(.markdown-body blockquote) {
  @apply border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-4 bg-blue-50 py-2 rounded-r;
}

:global(.markdown-body code) {
  @apply bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800;
}

:global(.markdown-body pre) {
  @apply bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4;
}

:global(.markdown-body pre code) {
  @apply bg-transparent p-0 text-gray-100;
}

:global(.markdown-body a) {
  @apply text-blue-600 hover:text-blue-800 underline decoration-blue-400 hover:decoration-blue-600;
}

:global(.markdown-body img) {
  @apply max-w-full h-auto rounded-lg shadow-lg my-6 border border-gray-200;
}

:global(.markdown-body strong) {
  @apply font-bold text-gray-900;
}

:global(.markdown-body em) {
  @apply italic text-gray-800;
}

:global(.markdown-body hr) {
  @apply border-gray-300 my-8;
}

:global(.markdown-body table) {
  @apply w-full border-collapse border border-gray-300 mb-4;
}

:global(.markdown-body th) {
  @apply border border-gray-300 px-4 py-2 bg-gray-50 font-semibold text-left;
}

:global(.markdown-body td) {
  @apply border border-gray-300 px-4 py-2;
}

:global(.markdown-body tr:nth-child(even)) {
  @apply bg-gray-50;
}

/* Fullscreen styles */
.professional-markdown-editor.fullscreen .editor-layout {
  height: calc(100vh - 80px);
}

.professional-markdown-editor.fullscreen .markdown-textarea,
.professional-markdown-editor.fullscreen .preview-content {
  height: 100%;
}
</style>