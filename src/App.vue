<script setup lang="ts">
import { watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const auth = useAuthStore()
// Applies your theme and reduce motion on every page, signed in or not.
useThemeStore()
const route = useRoute()
const router = useRouter()

// The token can disappear while you're on a page (logging out, or any 401 from the API).
watch(
  () => auth.isAuthenticated,
  async (isAuthenticated) => {
    if (!isAuthenticated && route.meta.requiresAuth) {
      await router.push({ name: 'login' })
    }
  },
)
</script>

<template>
  <RouterView />
</template>
