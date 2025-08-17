<template>
  <div class="blog-editor">
    <!-- Toolbar -->
    <div class="editor-toolbar">
      <div class="toolbar-group">
        <button
          @click="editor?.chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor?.isActive('bold') }"
          class="toolbar-button"
          title="Bold"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 12h8a4 4 0 100-8H6v8zm0 0h8a4 4 0 110 8H6v-8z" />
          </svg>
        </button>
        
        <button
          @click="editor?.chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor?.isActive('italic') }"
          class="toolbar-button"
          title="Italic"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        
        <button
          @click="editor?.chain().focus().toggleUnderline().run()"
          :class="{ 'is-active': editor?.isActive('underline') }"
          class="toolbar-button"
          title="Underline"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button
          @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'is-active': editor?.isActive('heading', { level: 1 }) }"
          class="toolbar-button"
          title="Heading 1"
        >
          H1
        </button>
        
        <button
          @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor?.isActive('heading', { level: 2 }) }"
          class="toolbar-button"
          title="Heading 2"
        >
          H2
        </button>
        
        <button
          @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor?.isActive('heading', { level: 3 }) }"
          class="toolbar-button"
          title="Heading 3"
        >
          H3
        </button>
      </div>

      <div class="toolbar-group">
        <button
          @click="editor?.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor?.isActive('bulletList') }"
          class="toolbar-button"
          title="Bullet List"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
        
        <button
          @click="editor?.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor?.isActive('orderedList') }"
          class="toolbar-button"
          title="Numbered List"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button
          @click="editor?.chain().focus().toggleBlockquote().run()"
          :class="{ 'is-active': editor?.isActive('blockquote') }"
          class="toolbar-button"
          title="Quote"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        
        <button
          @click="setLink"
          :class="{ 'is-active': editor?.isActive('link') }"
          class="toolbar-button"
          title="Add Link"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
        
        <button
          @click="addImage"
          class="toolbar-button"
          title="Add Image"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      <div class="toolbar-group">
        <button
          @click="editor?.chain().focus().setTextAlign('left').run()"
          :class="{ 'is-active': editor?.isActive({ textAlign: 'left' }) }"
          class="toolbar-button"
          title="Align Left"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h6" />
          </svg>
        </button>
        
        <button
          @click="editor?.chain().focus().setTextAlign('center').run()"
          :class="{ 'is-active': editor?.isActive({ textAlign: 'center' }) }"
          class="toolbar-button"
          title="Align Center"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <button
          @click="editor?.chain().focus().setTextAlign('right').run()"
          :class="{ 'is-active': editor?.isActive({ textAlign: 'right' }) }"
          class="toolbar-button"
          title="Align Right"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="editor-content">
      <editor-content v-if="editor" :editor="editor" class="prose prose-lg max-w-none" />
    </div>

    <!-- Link Dialog -->
    <div v-if="showLinkDialog" class="link-dialog-overlay" @click="closeLinkDialog">
      <div class="link-dialog" @click.stop>
        <h3 class="text-lg font-semibold mb-4">Add Link</h3>
        <input
          v-model="linkUrl"
          type="url"
          placeholder="Enter URL"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div class="flex justify-end space-x-2 mt-4">
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
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'

interface Props {
  modelValue: string
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Start writing your blog post...'
})

const emit = defineEmits<Emits>()

// Link dialog state
const showLinkDialog = ref(false)
const linkUrl = ref('')

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      }
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg shadow-md'
      }
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 hover:text-blue-800 underline'
      }
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    Underline
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4'
    }
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

// Watch for external content changes
watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue)
  }
})

// Link handling
const setLink = () => {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href
  linkUrl.value = previousUrl || ''
  showLinkDialog.value = true
}

const confirmLink = () => {
  if (!editor.value) return
  if (linkUrl.value) {
    editor.value.chain().focus().setLink({ href: linkUrl.value }).run()
  } else {
    editor.value.chain().focus().unsetLink().run()
  }
  closeLinkDialog()
}

const closeLinkDialog = () => {
  showLinkDialog.value = false
  linkUrl.value = ''
}

// Image handling
const addImage = () => {
  if (!editor.value) return
  const url = window.prompt('Enter image URL:')
  if (url) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.blog-editor {
  @apply border border-gray-300 rounded-lg overflow-hidden;
}

.editor-toolbar {
  @apply flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-300;
}

.toolbar-group {
  @apply flex items-center gap-1 px-2 border-r border-gray-300 last:border-r-0;
}

.toolbar-button {
  @apply p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors duration-200;
}

.toolbar-button.is-active {
  @apply bg-blue-100 text-blue-700;
}

.editor-content {
  @apply bg-white;
}

.link-dialog-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.link-dialog {
  @apply bg-white rounded-lg p-6 max-w-md w-full mx-4;
}

/* TipTap specific styles */
:deep(.ProseMirror) {
  @apply outline-none;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  @apply text-gray-400 float-left h-0 pointer-events-none;
  content: attr(data-placeholder);
}

:deep(.ProseMirror h1) {
  @apply text-3xl font-bold text-gray-900 mb-4 mt-6;
}

:deep(.ProseMirror h2) {
  @apply text-2xl font-bold text-gray-900 mb-3 mt-5;
}

:deep(.ProseMirror h3) {
  @apply text-xl font-bold text-gray-900 mb-2 mt-4;
}

:deep(.ProseMirror p) {
  @apply text-gray-700 leading-relaxed mb-4;
}

:deep(.ProseMirror ul) {
  @apply list-disc list-inside mb-4 space-y-1;
}

:deep(.ProseMirror ol) {
  @apply list-decimal list-inside mb-4 space-y-1;
}

:deep(.ProseMirror blockquote) {
  @apply border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4;
}

:deep(.ProseMirror img) {
  @apply max-w-full h-auto rounded-lg shadow-md my-4;
}

:deep(.ProseMirror a) {
  @apply text-blue-600 hover:text-blue-800 underline;
}

:deep(.ProseMirror strong) {
  @apply font-bold text-gray-900;
}

:deep(.ProseMirror em) {
  @apply italic;
}

:deep(.ProseMirror u) {
  @apply underline;
}
</style>
