<template>
  <div class="medium-style-editor" :class="{ 'fullscreen': isFullscreen }">
    <!-- Floating Menu (appears when text is selected) -->
    <FloatingMenu v-if="editor" :editor="editor" :tippy-options="{ duration: 100 }">
      <div class="floating-menu">
        <button
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
          class="menu-button"
          title="Bold"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12h8a4 4 0 100-8H6v8zm0 0h8a4 4 0 110 8H6v-8z" />
          </svg>
        </button>
        <button
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
          class="menu-button"
          title="Italic"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        <button
          @click="editor.chain().focus().toggleUnderline().run()"
          :class="{ 'is-active': editor.isActive('underline') }"
          class="menu-button"
          title="Underline"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0h10M7 4h10v12a4 4 0 11-10 0V4z" />
          </svg>
        </button>
        <button
          @click="editor.chain().focus().toggleHighlight().run()"
          :class="{ 'is-active': editor.isActive('highlight') }"
          class="menu-button"
          title="Highlight"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          @click="showLinkDialog"
          :class="{ 'is-active': editor.isActive('link') }"
          class="menu-button"
          title="Link"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
      </div>
    </FloatingMenu>

    <!-- Bubble Menu (appears when clicking on existing nodes) -->
    <BubbleMenu v-if="editor" :editor="editor" :tippy-options="{ duration: 100 }">
      <div class="bubble-menu">
        <button
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
          class="menu-button"
        >
          H1
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          class="menu-button"
        >
          H2
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
          class="menu-button"
        >
          H3
        </button>
        <button
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          class="menu-button"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
        <button
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          class="menu-button"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </button>
        <button
          @click="editor.chain().focus().toggleBlockquote().run()"
          :class="{ 'is-active': editor.isActive('blockquote') }"
          class="menu-button"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        <button
          @click="editor.chain().focus().setTextAlign('left').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
          class="menu-button"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16" />
          </svg>
        </button>
        <button
          @click="editor.chain().focus().setTextAlign('center').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
          class="menu-button"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M8 12h8M4 18h16" />
          </svg>
        </button>
        <button
          @click="editor.chain().focus().setTextAlign('right').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
          class="menu-button"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16" />
          </svg>
        </button>
        <button
          @click="addImage"
          class="menu-button"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          @click="editor.chain().focus().toggleCode().run()"
          :class="{ 'is-active': editor.isActive('code') }"
          class="menu-button"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        <button
          @click="toggleFullscreen"
          class="menu-button"
          :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'"
        >
          <svg v-if="!isFullscreen" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </BubbleMenu>

    <!-- Main Editor -->
    <div class="editor-container">
      <editor-content :editor="editor" class="editor-content" />
    </div>

    <!-- Link Dialog -->
    <div v-if="linkDialogVisible" class="link-dialog-overlay" @click="closeLinkDialog">
      <div class="link-dialog" @click.stop>
        <h3 class="link-dialog-title">Insert Link</h3>
        <div class="link-dialog-form">
          <div class="link-dialog-field">
            <label for="linkUrl" class="link-dialog-label">URL</label>
            <input
              id="linkUrl"
              v-model="linkUrl"
              type="url"
              class="link-dialog-input"
              placeholder="https://example.com"
              @keyup.enter="confirmLink"
            />
          </div>
          <div class="link-dialog-field">
            <label for="linkText" class="link-dialog-label">Text</label>
            <input
              id="linkText"
              v-model="linkText"
              type="text"
              class="link-dialog-input"
              placeholder="Link text"
              @keyup.enter="confirmLink"
            />
          </div>
          <div class="link-dialog-actions">
            <button @click="closeLinkDialog" class="link-dialog-button cancel">Cancel</button>
            <button @click="confirmLink" class="link-dialog-button confirm">Insert</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Dialog -->
    <div v-if="imageDialogVisible" class="link-dialog-overlay" @click="closeImageDialog">
      <div class="link-dialog" @click.stop>
        <h3 class="link-dialog-title">Insert Image</h3>
        <div class="link-dialog-form">
          <div class="link-dialog-field">
            <label for="imageUrl" class="link-dialog-label">Image URL</label>
            <input
              id="imageUrl"
              v-model="imageUrl"
              type="url"
              class="link-dialog-input"
              placeholder="https://example.com/image.jpg"
              @keyup.enter="confirmImage"
            />
          </div>
          <div class="link-dialog-field">
            <label for="imageAlt" class="link-dialog-label">Alt Text</label>
            <input
              id="imageAlt"
              v-model="imageAlt"
              type="text"
              class="link-dialog-input"
              placeholder="Image description"
              @keyup.enter="confirmImage"
            />
          </div>
          <div class="link-dialog-actions">
            <button @click="closeImageDialog" class="link-dialog-button cancel">Cancel</button>
            <button @click="confirmImage" class="link-dialog-button confirm">Insert</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import DOMPurify from 'dompurify'

// Props
interface Props {
  modelValue: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Write your story...'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// State
const isFullscreen = ref(false)
const linkDialogVisible = ref(false)
const linkUrl = ref('')
const linkText = ref('')
const imageDialogVisible = ref(false)
const imageUrl = ref('')
const imageAlt = ref('')

// Initialize editor
const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: 'noopener noreferrer nofollow',
        target: '_blank',
      },
    }),
    Highlight,
    TextStyle,
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ],
  onUpdate: ({ editor }) => {
    // Sanitize content before emitting
    const sanitizedContent = DOMPurify.sanitize(editor.getHTML(), {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 
        'blockquote', 'a', 'img', 'pre', 'code', 'mark'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'class', 'style', 'rel', 'target'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ADD_ATTR: ['target'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'frame', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    })
    emit('update:modelValue', sanitizedContent)
  },
})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  const isSame = editor.value && newValue === editor.value.getHTML()
  if (editor.value && !isSame) {
    editor.value.commands.setContent(newValue, false)
  }
})

// Methods
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const showLinkDialog = () => {
  // Get the selected text
  if (editor.value) {
    const { from, to } = editor.value.state.selection
    linkText.value = editor.value.state.doc.textBetween(from, to, ' ')
    linkUrl.value = ''
    linkDialogVisible.value = true
  }
}

const closeLinkDialog = () => {
  linkDialogVisible.value = false
  linkText.value = ''
  linkUrl.value = ''
}

const confirmLink = () => {
  if (editor.value && linkUrl.value) {
    // If there's no text selected, use the URL as the text
    if (!linkText.value) {
      linkText.value = linkUrl.value
    }
    
    // Insert the link
    editor.value
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl.value })
      .insertContent(linkText.value)
      .run()
  }
  closeLinkDialog()
}

const addImage = () => {
  imageUrl.value = ''
  imageAlt.value = ''
  imageDialogVisible.value = true
}

const closeImageDialog = () => {
  imageDialogVisible.value = false
  imageUrl.value = ''
  imageAlt.value = ''
}

const confirmImage = () => {
  if (editor.value && imageUrl.value) {
    editor.value
      .chain()
      .focus()
      .setImage({ src: imageUrl.value, alt: imageAlt.value })
      .run()
  }
  closeImageDialog()
}

// Cleanup
onBeforeUnmount(() => {
  if (isFullscreen.value) {
    document.body.style.overflow = ''
  }
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>

<style scoped>
.medium-style-editor {
  @apply border border-gray-300 rounded-lg overflow-hidden bg-white;
  transition: all 0.3s ease;
}

.medium-style-editor.fullscreen {
  @apply fixed inset-0 z-50;
  border-radius: 0;
}

.editor-container {
  @apply bg-white;
  min-height: 400px;
}

.editor-content {
  @apply p-4;
  min-height: 400px;
}

.editor-content :deep(.ProseMirror) {
  @apply outline-none;
  min-height: 400px;
}

.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  @apply text-gray-400;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.floating-menu,
.bubble-menu {
  @apply flex items-center bg-white shadow-lg rounded-md p-1 border border-gray-200;
}

.menu-button {
  @apply p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors;
  min-width: 28px;
  min-height: 28px;
}

.menu-button.is-active {
  @apply bg-blue-100 text-blue-700;
}

.link-dialog-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.link-dialog {
  @apply bg-white rounded-lg p-6 max-w-md w-full mx-4;
}

.link-dialog-title {
  @apply text-lg font-semibold mb-4;
}

.link-dialog-form {
  @apply space-y-4;
}

.link-dialog-field {
  @apply space-y-1;
}

.link-dialog-label {
  @apply block text-sm font-medium text-gray-700;
}

.link-dialog-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.link-dialog-actions {
  @apply flex justify-end space-x-2 mt-6;
}

.link-dialog-button {
  @apply px-4 py-2 rounded-md;
}

.link-dialog-button.cancel {
  @apply text-gray-600 hover:text-gray-800;
}

.link-dialog-button.confirm {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

/* Editor Content Styles */
.editor-content :deep(h1) {
  @apply text-3xl font-bold mb-4 mt-6;
}

.editor-content :deep(h2) {
  @apply text-2xl font-bold mb-3 mt-5;
}

.editor-content :deep(h3) {
  @apply text-xl font-bold mb-2 mt-4;
}

.editor-content :deep(p) {
  @apply mb-4 leading-relaxed;
}

.editor-content :deep(ul) {
  @apply list-disc pl-5 mb-4;
}

.editor-content :deep(ol) {
  @apply list-decimal pl-5 mb-4;
}

.editor-content :deep(li) {
  @apply mb-1;
}

.editor-content :deep(blockquote) {
  @apply border-l-4 border-gray-300 pl-4 italic text-gray-700 mb-4;
}

.editor-content :deep(img) {
  @apply max-w-full rounded my-4;
}

.editor-content :deep(a) {
  @apply text-blue-600 hover:text-blue-800 underline;
}

.editor-content :deep(code) {
  @apply bg-gray-100 px-1 py-0.5 rounded text-sm font-mono;
}

.editor-content :deep(pre) {
  @apply bg-gray-800 text-white p-4 rounded-lg overflow-x-auto mb-4;
}

.editor-content :deep(pre code) {
  @apply bg-transparent p-0 text-white;
}

.editor-content :deep(mark) {
  @apply bg-yellow-200;
}

.editor-content :deep(.text-left) {
  text-align: left;
}

.editor-content :deep(.text-center) {
  text-align: center;
}

.editor-content :deep(.text-right) {
  text-align: right;
}
</style>
