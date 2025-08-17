<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to AGoat Publisher
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Manage your blog posts and content
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">
              Username
            </label>
            <Input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="Enter your username"
              :class="errors.username ? 'border-destructive focus-visible:ring-destructive' : ''"
              required
            />
            <div v-if="errors.username" class="mt-1 text-sm text-destructive">
              {{ errors.username }}
            </div>
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Enter your password"
              :class="errors.password ? 'border-destructive focus-visible:ring-destructive' : ''"
              required
            />
            <div v-if="errors.password" class="mt-1 text-sm text-destructive">
              {{ errors.password }}
            </div>
          </div>
        </div>

        <div v-if="authStore.error" class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-800">
                {{ authStore.error }}
              </p>
            </div>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            :disabled="!isFormValid || authStore.loading"
            class="w-full"
            variant="default"
          >
            <Loader2 v-if="authStore.loading" class="mr-2 h-4 w-4 animate-spin" />
            Sign in
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Loader2 } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  username: '',
  password: ''
})

const errors = ref({
  username: '',
  password: ''
})

const isFormValid = computed(() => {
  return form.value.username.trim() && form.value.password.trim()
})

const validateForm = () => {
  errors.value = {
    username: '',
    password: ''
  }
  
  if (!form.value.username.trim()) {
    errors.value.username = 'Username is required'
  }
  
  if (!form.value.password.trim()) {
    errors.value.password = 'Password is required'
  }
  
  return !errors.value.username && !errors.value.password
}

const handleLogin = async () => {
  if (!validateForm()) return
  
  const result = await authStore.login({
    username: form.value.username,
    password: form.value.password
  })
  
  if (result.success) {
    router.push('/dashboard')
  }
}

onMounted(() => {
  authStore.clearError()
})
</script>
