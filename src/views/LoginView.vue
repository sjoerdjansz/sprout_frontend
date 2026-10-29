<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import BaseBadge from '@/components/BaseBadge.vue'
import LoginArt from '@/components/auth/LoginArt.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const busy = ref(false)
const error = ref<ApiError | null>(null)

async function sendMagicLink(email: string): Promise<void> {
  busy.value = true
  error.value = null

  try {
    await auth.requestMagicLink(email)
    await router.push({ name: 'check-email', query: { email } })
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    error.value = caught
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex min-h-svh flex-wrap gap-4 p-4">
    <LoginArt />

    <main class="flex min-w-0 flex-[999_1_420px] items-center justify-center px-6 py-12">
      <div class="flex w-full max-w-100 flex-col gap-7">
        <div class="flex flex-col items-start gap-3.5">
          <BaseBadge tone="sun" icon="wand-sparkles">No password needed</BaseBadge>
          <h1 class="font-display text-display text-ink">Welcome back</h1>
          <p class="text-body-lg text-ink-muted">
            Pop in your email and we’ll send you a magic link. One tap and you’re in.
          </p>
        </div>

        <LoginForm :busy="busy" :error="error" @submit="sendMagicLink" />

        <hr class="border-line" />

        <p class="text-ink-muted">
          New to Sprout?
          <RouterLink
            :to="{ name: 'sign-up' }"
            class="font-semibold text-primary hover:text-primary-hover"
          >
            Create an account
          </RouterLink>
        </p>
      </div>
    </main>
  </div>
</template>
