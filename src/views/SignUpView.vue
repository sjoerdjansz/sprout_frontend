<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import SproutLogo from '@/components/SproutLogo.vue'
import SignUpArt from '@/components/auth/SignUpArt.vue'
import SignUpForm from '@/components/auth/SignUpForm.vue'
import { ApiError } from '@/lib/api'
import { type Registration, useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const busy = ref(false)
const error = ref<ApiError | null>(null)

async function createAccount(registration: Registration): Promise<void> {
  busy.value = true
  error.value = null

  try {
    await auth.register(registration)
    await router.push({ name: 'check-email', query: { email: registration.email } })
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
    <main class="flex min-w-0 flex-[999_1_420px] items-center justify-center px-6 py-12">
      <div class="flex w-full max-w-105 flex-col gap-7">
        <RouterLink :to="{ name: 'login' }" class="self-start rounded-sm">
          <SproutLogo />
        </RouterLink>

        <div class="flex flex-col items-start gap-3.5">
          <h1 class="font-display text-display text-ink">Let’s get you growing</h1>
          <p class="text-body-lg text-ink-muted">
            Tell us your name and email. We’ll send a magic link to confirm it’s you. No password,
            ever.
          </p>
        </div>

        <SignUpForm :busy="busy" :error="error" @submit="createAccount" />

        <hr class="border-line" />

        <p class="text-ink-muted">
          Already have an account?
          <RouterLink
            :to="{ name: 'login' }"
            class="font-semibold text-primary hover:text-primary-hover"
          >
            Log in
          </RouterLink>
        </p>
      </div>
    </main>

    <SignUpArt />
  </div>
</template>
