<template>
  <div class="markdown-editor">
    <!-- Toolbar -->
    <div class="editor-toolbar">
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
      
      <div class="toolbar-group">
        <button @click="toggleEditMode" type="button" class="toolbar-button" :class="{ 'is-active': isCodeMode }" title="Toggle Code Mode">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        
        <button @click="togglePreview" type="button" class="toolbar-button" :class="{ 'is-active': showPreview }" title="Toggle Preview">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Editor Layout -->
    <div class="editor-layout">
      <!-- Rich Text Mode -->
      <div v-if="!isCodeMode" class="rich-text-editor">
        <div 
          ref="richTextRef"
          class="rich-text-content"
          contenteditable="true"
          @input="updateFromRichText"
          @paste="handlePaste"
          v-html="renderedContent"
        ></div>
      </div>
      
      <!-- Code Mode -->
      <div v-else class="code-editor">
        <textarea
          ref="textareaRef"
          v-model="markdownContent"
          :placeholder="placeholder"
          class="markdown-textarea"
          @input="updateContent"
        ></textarea>
      </div>
      
      <!-- Preview Panel (when enabled) -->
      <div v-if="showPreview" class="preview-panel">
        <div class="preview-content prose prose-lg max-w-none" v-html="renderedContent"></div>
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
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'

interface Props {
  modelValue: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Write your blog post content here...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// Configure marked for better rendering
marked.use({
  breaks: true,
  gfm: true
})

// Reactive data
const markdownContent = ref(props.modelValue || `# Start Writing Your Blog Post

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

Happy writing! 🚀`)
const showPreview = ref(true) // Enable preview by default
const showLinkDialog = ref(false)
const linkText = ref('')
const linkUrl = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const richTextRef = ref<HTMLDivElement>()
const isCodeMode = ref(false) // Start in rich text mode

// Computed
const renderedContent = computed(() => {
  if (!markdownContent.value) return ''
  try {
    const html = marked.parse(markdownContent.value)
    console.log('Markdown input:', markdownContent.value)
    console.log('HTML output:', html)
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

const insertMarkdown = (before: string, after: string) => {
  if (isCodeMode.value) {
    // Code mode - insert markdown directly
    const textarea = textareaRef.value
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = markdownContent.value.substring(start, end)
    
    const newText = before + selectedText + after
    markdownContent.value = markdownContent.value.substring(0, start) + newText + markdownContent.value.substring(end)
    
    // Update cursor position
    nextTick(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    })
  } else {
    // Rich text mode - use document.execCommand
    const richTextElement = richTextRef.value
    if (!richTextElement) return
    
    richTextElement.focus()
    
    if (before === '**' && after === '**') {
      document.execCommand('bold', false)
    } else if (before === '*' && after === '*') {
      document.execCommand('italic', false)
    } else if (before === '~~' && after === '~~') {
      document.execCommand('strikeThrough', false)
    } else if (before === '# ') {
      document.execCommand('formatBlock', false, '<h1>')
    } else if (before === '## ') {
      document.execCommand('formatBlock', false, '<h2>')
    } else if (before === '### ') {
      document.execCommand('formatBlock', false, '<h3>')
    } else if (before === '- ') {
      document.execCommand('insertUnorderedList', false)
    } else if (before === '1. ') {
      document.execCommand('insertOrderedList', false)
    } else if (before === '> ') {
      document.execCommand('formatBlock', false, '<blockquote>')
    } else {
      // For other cases, insert the text directly
      document.execCommand('insertText', false, before + after)
    }
    
    updateFromRichText()
  }
  
  updateContent()
}

const insertLink = () => {
  if (isCodeMode.value) {
    // Code mode
    const textarea = textareaRef.value
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = markdownContent.value.substring(start, end)
    
    linkText.value = selectedText
    linkUrl.value = ''
    showLinkDialog.value = true
  } else {
    // Rich text mode
    const richTextElement = richTextRef.value
    if (!richTextElement) return
    
    richTextElement.focus()
    const url = window.prompt('Enter URL:')
    if (url) {
      document.execCommand('createLink', false, url)
      updateFromRichText()
    }
  }
}

const confirmLink = () => {
  if (linkText.value && linkUrl.value) {
    const linkMarkdown = `[${linkText.value}](${linkUrl.value})`
    insertMarkdown(linkMarkdown, '')
  }
  closeLinkDialog()
}

const closeLinkDialog = () => {
  showLinkDialog.value = false
  linkText.value = ''
  linkUrl.value = ''
}

const insertImage = () => {
  const url = window.prompt('Enter image URL:')
  if (url) {
    const alt = window.prompt('Enter image description (for accessibility):') || ''
    
    if (isCodeMode.value) {
      const imageMarkdown = `![${alt}](${url})`
      insertMarkdown(imageMarkdown, '')
    } else {
      // Rich text mode
      const richTextElement = richTextRef.value
      if (!richTextElement) return
      
      richTextElement.focus()
      const img = document.createElement('img')
      img.src = url
      img.alt = alt
      document.execCommand('insertHTML', false, img.outerHTML)
      updateFromRichText()
    }
  }
}

const insertTable = () => {
  if (isCodeMode.value) {
    // Code mode
    const textarea = textareaRef.value
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = markdownContent.value.substring(start, end)

    const tableMarkdown = `| ${selectedText} | ${selectedText} |
| --- | --- |`
    insertMarkdown(tableMarkdown, '')
  } else {
    // Rich text mode
    const richTextElement = richTextRef.value
    if (!richTextElement) return
    
    richTextElement.focus()
    const tableHTML = `
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Header 1</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Header 2</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 1</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Cell 2</td>
        </tr>
      </table>
    `
    document.execCommand('insertHTML', false, tableHTML)
    updateFromRichText()
  }
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const toggleEditMode = () => {
  isCodeMode.value = !isCodeMode.value
}

const updateFromRichText = () => {
  const richTextElement = richTextRef.value
  if (!richTextElement) return
  
  // Convert HTML back to markdown (simplified approach)
  const html = richTextElement.innerHTML
  // For now, we'll use a simple conversion - in a real implementation,
  // you'd want to use a library like turndown to convert HTML to markdown
  // This is a basic conversion - you might want to use a proper library
  let markdown = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/g, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/g, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/g, '*$1*')
    .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<ul[^>]*>(.*?)<\/ul>/g, '$1\n\n')
    .replace(/<ol[^>]*>(.*?)<\/ol>/g, '$1\n\n')
    .replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, '> $1\n\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, '![$2]($1)')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
  
  markdownContent.value = markdown
  updateContent()
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== markdownContent.value) {
    markdownContent.value = newValue || ''
  }
}, { immediate: true })
</script>

<style scoped>
.markdown-editor {
  @apply border border-gray-300 rounded-lg overflow-hidden;
}

.editor-toolbar {
  @apply flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-200 flex-wrap;
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
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0;
}

.rich-text-editor {
  @apply bg-white;
}

.rich-text-content {
  @apply w-full min-h-[400px] p-4 border-0 resize-none focus:outline-none focus:ring-0;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  overflow-y: auto;
}

.rich-text-content:focus {
  @apply outline-none;
}

.code-editor {
  @apply bg-white;
}

.markdown-textarea {
  @apply w-full min-h-[400px] p-4 border-0 resize-none focus:outline-none focus:ring-0 bg-white;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.preview-panel {
  @apply bg-gray-50 p-4 border-l border-gray-200;
  width: 400px;
  overflow-y: auto;
}

.preview-content {
  @apply min-h-[400px];
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg p-6 max-w-md w-full mx-4;
}

/* Prose styles for preview */
:deep(.prose) {
  @apply text-gray-900 leading-relaxed;
}

:deep(.prose h1) {
  @apply text-3xl font-bold text-gray-900 mb-6 mt-8 border-b border-gray-200 pb-2;
}

:deep(.prose h2) {
  @apply text-2xl font-bold text-gray-900 mb-4 mt-6;
}

:deep(.prose h3) {
  @apply text-xl font-bold text-gray-900 mb-3 mt-5;
}

:deep(.prose h4) {
  @apply text-lg font-semibold text-gray-900 mb-2 mt-4;
}

:deep(.prose p) {
  @apply mb-4 leading-7 text-gray-700;
}

:deep(.prose ul) {
  @apply mb-4 pl-6 space-y-2;
}

:deep(.prose ol) {
  @apply mb-4 pl-6 space-y-2;
}

:deep(.prose li) {
  @apply text-gray-700 leading-6;
}

:deep(.prose li > ul) {
  @apply mt-2 mb-0;
}

:deep(.prose li > ol) {
  @apply mt-2 mb-0;
}

:deep(.prose blockquote) {
  @apply border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-4 bg-blue-50 py-2 rounded-r;
}

:deep(.prose code) {
  @apply bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800;
}

:deep(.prose pre) {
  @apply bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4;
}

:deep(.prose pre code) {
  @apply bg-transparent p-0 text-gray-100;
}

:deep(.prose a) {
  @apply text-blue-600 hover:text-blue-800 underline decoration-blue-400 hover:decoration-blue-600;
}

:deep(.prose img) {
  @apply max-w-full h-auto rounded-lg shadow-lg my-6 border border-gray-200;
}

:deep(.prose strong) {
  @apply font-bold text-gray-900;
}

:deep(.prose em) {
  @apply italic text-gray-800;
}

:deep(.prose hr) {
  @apply border-gray-300 my-8;
}

:deep(.prose table) {
  @apply w-full border-collapse border border-gray-300 mb-4;
}

:deep(.prose th) {
  @apply border border-gray-300 px-4 py-2 bg-gray-50 font-semibold text-left;
}

:deep(.prose td) {
  @apply border border-gray-300 px-4 py-2;
}

:deep(.prose tr:nth-child(even)) {
  @apply bg-gray-50;
}
</style>

