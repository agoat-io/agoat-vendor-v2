<template>
  <div class="image-upload">
    <div v-if="!imageUrl" class="upload-area" @click="triggerFileInput" @drop="handleDrop" @dragover.prevent>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        @change="handleFileSelect"
        class="hidden"
      />
      <div class="upload-content">
        <svg class="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="text-sm text-gray-600">Click to upload or drag and drop</p>
        <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
      </div>
    </div>
    
    <div v-else class="image-preview">
      <img :src="imageUrl" alt="Preview" class="max-w-full h-auto rounded-lg" />
      <div class="image-actions">
        <button @click="copyImageUrl" class="action-button">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy URL
        </button>
        <button @click="removeImage" class="action-button text-red-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Remove
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const fileInput = ref<HTMLInputElement>()
const imageUrl = ref(props.modelValue || '')

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

const processFile = (file: File) => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }
  
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    alert('File size must be less than 10MB')
    return
  }
  
  // Create object URL for preview
  const url = URL.createObjectURL(file)
  imageUrl.value = url
  emit('update:modelValue', url)
  
  // In a real app, you would upload to a server here
  // For now, we'll use the object URL
  console.log('Image selected:', file.name, file.size)
}

const copyImageUrl = async () => {
  try {
    await navigator.clipboard.writeText(imageUrl.value)
    alert('Image URL copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy URL:', err)
  }
}

const removeImage = () => {
  imageUrl.value = ''
  emit('update:modelValue', '')
}
</script>

<style scoped>
.image-upload {
  @apply w-full;
}

.upload-area {
  @apply border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors duration-200;
}

.upload-content {
  @apply flex flex-col items-center justify-center;
}

.image-preview {
  @apply relative;
}

.image-actions {
  @apply absolute top-2 right-2 flex space-x-2;
}

.action-button {
  @apply flex items-center space-x-1 px-2 py-1 bg-white bg-opacity-90 rounded-md text-sm font-medium hover:bg-opacity-100 transition-all duration-200 shadow-sm;
}
</style>
