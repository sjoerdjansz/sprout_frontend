<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import SproutLogo from '@/components/SproutLogo.vue'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const error = ref<string | null>(null)

async function signIn(): Promise<void> {
  // A missing token is sent as-is: the API answers with "This link is incomplete".
  const token = typeof route.query.token === 'string' ? route.query.token : ''

  try {
    await auth.verifyMagicLink(token)
    // Replace, so going back doesn't land on a link that no longer works.
    await router.replace({ name: 'home' })
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    error.value = caught.fieldError('token') ?? caught.message
  }
}

onMounted(signIn)
</script>

<template>
  <div class="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-12">
    <SproutLogo />

    <main
      class="flex w-full max-w-130 flex-col items-center gap-6 rounded-xl border border-line bg-surface px-6 pt-12 pb-10 text-center shadow-md sm:px-10"
      aria-live="polite"
    >
      <template v-if="error === null">
        <span
          class="grid size-16 place-items-center rounded-lg bg-sprout-soft text-sprout-ink motion-safe:animate-pulse"
        >
          <BaseIcon name="sprout" :size="32" />
        </span>
        <h1 class="font-display text-title-lg text-ink" data-test="status">Signing you in…</h1>
      </template>

      <template v-else>
        <span class="grid size-16 place-items-center rounded-lg bg-ember-soft text-ember-ink">
          <BaseIcon name="mail" :size="32" />
        </span>
        <div class="flex flex-col items-center gap-3">
          <h1 class="font-display text-title-lg text-ink">That link didn’t work</h1>
          <p class="text-body-lg text-ink-muted" data-test="error">{{ error }}</p>
        </div>
        <RouterLink
          :to="{ name: 'login' }"
          class="inline-flex h-13 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-on-primary shadow-xs transition duration-150 ease-default hover:bg-primary-hover active:translate-y-px"
          data-test="request-new-link"
        >
          Request a new link
          <BaseIcon name="arrow-right" :size="20" />
        </RouterLink>
      </template>
    </main>
  </div>
</template>
