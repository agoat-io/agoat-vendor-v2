<template>
  <div class="simple-medium-editor" @click.stop @keydown.stop>
    <div v-if="editor" class="toolbar">
      <button
        type="button"
        @click.stop.prevent="handleBoldClick"
        :class="{ 'is-active': editor.isActive('bold') }"
        class="toolbar-button"
      >
        Bold
      </button>
      <button
        type="button"
        @click.stop.prevent="handleItalicClick"
        :class="{ 'is-active': editor.isActive('italic') }"
        class="toolbar-button"
      >
        Italic
      </button>
      <button
        type="button"
        @click.stop.prevent="handleH1Click"
        :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
        class="toolbar-button"
      >
        H1
      </button>
      <button
        type="button"
        @click.stop.prevent="handleH2Click"
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
        class="toolbar-button"
      >
        H2
      </button>
    </div>
    
    <editor-content :editor="editor" class="editor-content" />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

interface Props {
  modelValue: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Write your story...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    console.log('Editor content updated:', html)
    emit('update:modelValue', html)
  },
})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  const isSame = editor.value && newValue === editor.value.getHTML()
  if (editor.value && !isSame) {
    editor.value.commands.setContent(newValue, false)
  }
})

// Button handlers
const handleBoldClick = () => {
  console.log('Bold button clicked')
  if (editor.value) {
    editor.value.chain().focus().toggleBold().run()
  }
}

const handleItalicClick = () => {
  console.log('Italic button clicked')
  if (editor.value) {
    editor.value.chain().focus().toggleItalic().run()
  }
}

const handleH1Click = () => {
  console.log('H1 button clicked')
  if (editor.value) {
    editor.value.chain().focus().toggleHeading({ level: 1 }).run()
  }
}

const handleH2Click = () => {
  console.log('H2 button clicked')
  if (editor.value) {
    editor.value.chain().focus().toggleHeading({ level: 2 }).run()
  }
}
</script>

<style scoped>
.simple-medium-editor {
  @apply border border-gray-300 rounded-lg overflow-hidden;
}

.toolbar {
  @apply flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-200;
}

.toolbar-button {
  @apply px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100;
}

.toolbar-button.is-active {
  @apply bg-blue-100 text-blue-700 border-blue-300;
}

.editor-content {
  @apply p-4;
  min-height: 300px;
}

.editor-content :deep(.ProseMirror) {
  @apply outline-none;
  min-height: 300px;
}

.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  @apply text-gray-400;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.editor-content :deep(h1) {
  @apply text-2xl font-bold mb-3;
}

.editor-content :deep(h2) {
  @apply text-xl font-bold mb-2;
}

.editor-content :deep(p) {
  @apply mb-3;
}
</style>
