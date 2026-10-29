<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { ApiError } from '@/lib/api'
import { initials } from '@/lib/names'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const userName = computed<string>(() => auth.user?.name ?? '')

async function loadUser(): Promise<void> {
  try {
    await auth.fetchUser()
  } catch (caught) {
    // A 401 signs you out (App.vue then shows the login screen). An unreachable API leaves
    // the name empty; the screen's own data calls will say what to do.
    if (!(caught instanceof ApiError)) {
      throw caught
    }
  }
}

onMounted(() => {
  if (auth.user === null) {
    void loadUser()
  }
})
</script>

<template>
  <div class="grid min-h-svh grid-cols-[232px_minmax(0,1fr)]">
    <AppSidebar
      :user-name="userName"
      :user-initials="initials(userName)"
      class="sticky top-0 h-svh overflow-y-auto"
      @logout="auth.logout()"
    />

    <main class="flex min-w-0 flex-col gap-8 px-10 pt-8 pb-12">
      <slot />
    </main>
  </div>
</template>
