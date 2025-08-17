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
        <button @click="togglePreview" type="button" class="toolbar-button" :class="{ 'is-active': showPreview }" title="Toggle Preview">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        
        <button v-if="showPreview" @click="toggleSplitMode" type="button" class="toolbar-button" :class="{ 'is-active': splitMode }" title="Toggle Split View">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Editor Layout -->
    <div class="editor-layout">
      <!-- Markdown Input -->
      <div class="editor-input" :class="{ 'hidden': showPreview && !splitMode }">
        <textarea
          ref="textareaRef"
          v-model="markdownContent"
          :placeholder="placeholder"
          class="markdown-textarea"
          @input="updateContent"
        ></textarea>
      </div>
      
      <!-- Full Preview (when not in split mode) -->
      <div v-if="showPreview && !splitMode" class="editor-preview">
        <div class="preview-content prose prose-lg max-w-none" v-html="renderedContent"></div>
      </div>
      
      <!-- Split View -->
      <div v-if="showPreview && splitMode" class="editor-split">
        <div class="split-input">
          <textarea
            v-model="markdownContent"
            :placeholder="placeholder"
            class="markdown-textarea"
            @input="updateContent"
          ></textarea>
        </div>
        <div class="split-preview">
          <div class="preview-content prose prose-lg max-w-none" v-html="renderedContent"></div>
        </div>
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
const markdownContent = ref(props.modelValue || `# Welcome to the Markdown Editor

This is a **bold** and *italic* text example.

## Features
- Real-time preview
- Beautiful styling
- Easy to use

> This is a quote block

[Visit our website](https://example.com)

\`\`\`javascript
console.log('Hello World');
\`\`\``)
const showPreview = ref(true) // Enable preview by default
const showLinkDialog = ref(false)
const linkText = ref('')
const linkUrl = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const splitMode = ref(false)

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

const togglePreview = () => {
  showPreview.value = !showPreview.value
  if (showPreview.value) {
    splitMode.value = false // Ensure split mode is off when preview is on
  }
}

const toggleSplitMode = () => {
  splitMode.value = !splitMode.value
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== markdownContent.value) {
    markdownContent.value = newValue
  }
})
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
}

.editor-input {
  @apply block;
}

.editor-input.hidden {
  display: none;
}

.markdown-textarea {
  @apply w-full min-h-[400px] p-4 border-0 resize-none focus:outline-none focus:ring-0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.editor-preview {
  @apply p-4 bg-white;
}

.preview-content {
  @apply min-h-[400px];
}

.editor-split {
  @apply grid grid-cols-2 gap-4 p-4;
}

.split-input {
  @apply border-r border-gray-200 pr-4;
}

.split-preview {
  @apply pl-4;
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

