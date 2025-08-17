<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <svg class="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H2a10 10 0 0110-10h8a10 10 0 0110 10v2a10 10 0 01-10 10H2a10 10 0 01-10-10v-2a10 10 0 0110-10z" />
        </svg>
      </div>
      
      <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 class="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
      <p class="text-gray-600 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      
      <div class="space-y-4">
        <router-link to="/dashboard">
          <Button class="w-full">
            Go to Dashboard
          </Button>
        </router-link>
        
        <button @click="goBack" class="w-full">
          <Button variant="outline" class="w-full">
            Go Back
          </Button>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '../components/ui/button'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}
</script>
