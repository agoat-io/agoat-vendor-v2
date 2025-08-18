<template>
  <div class="editor-wrapper" @click.stop @keydown.stop>
    <div class="editor-selector mb-4" v-if="showSelector">
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium text-gray-700">Editor Type:</span>
        <div class="flex bg-gray-100 rounded-md p-1">
          <button 
            type="button"
            @click.prevent="setEditorType(EditorType.MARKDOWN)" 
            :class="[
              'px-3 py-1 text-sm rounded-md transition-colors',
              editorType === EditorType.MARKDOWN 
                ? 'bg-white shadow text-gray-900' 
                : 'text-gray-700 hover:text-gray-900'
            ]"
          >
            Markdown
          </button>
          <button 
            type="button"
            @click.prevent="setEditorType(EditorType.MEDIUM_STYLE)" 
            :class="[
              'px-3 py-1 text-sm rounded-md transition-colors',
              editorType === EditorType.MEDIUM_STYLE 
                ? 'bg-white shadow text-gray-900' 
                : 'text-gray-700 hover:text-gray-900'
            ]"
          >
            Medium Style
          </button>
        </div>
      </div>
    </div>

    <component 
      :is="currentEditor" 
      v-model="content"
      :placeholder="placeholder"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import ProfessionalMarkdownEditor from './ProfessionalMarkdownEditor.vue';
import SimpleMediumEditor from './SimpleMediumEditor.vue';
import editorConfig, { EditorType } from '../config/editor';

interface Props {
  modelValue: string;
  placeholder?: string;
  showSelector?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Write your content here...',
  showSelector: true
});

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>();

// Local state
const content = ref(props.modelValue || '');
const editorType = ref(editorConfig.type);

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue;
  }
});

// Watch for changes to content and emit updates
watch(() => content.value, (newValue) => {
  emit('update:modelValue', newValue);
});

// Computed property to determine which editor to use
const currentEditor = computed(() => {
  return editorType.value === EditorType.MARKDOWN 
    ? ProfessionalMarkdownEditor 
    : SimpleMediumEditor;
});

// Method to change editor type
const setEditorType = (type: EditorType) => {
  console.log('Setting editor type to:', type);
  editorType.value = type;
  editorConfig.type = type;
  // Could also save preference to localStorage here
  localStorage.setItem('preferred-editor', type);
};

// Load preferred editor from localStorage if available
onMounted(() => {
  const savedPreference = localStorage.getItem('preferred-editor');
  if (savedPreference && Object.values(EditorType).includes(savedPreference as EditorType)) {
    editorType.value = savedPreference as EditorType;
    editorConfig.type = savedPreference as EditorType;
  }
});
</script>

<style scoped>
.editor-wrapper {
  @apply w-full;
}

.editor-selector {
  @apply flex justify-end;
}
</style>
