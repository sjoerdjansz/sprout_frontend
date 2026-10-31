<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import SproutLogo from '@/components/SproutLogo.vue'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()

type ConfirmState = 'confirming' | 'confirmed' | 'failed'

const state = ref<ConfirmState>('confirming')
const confirmedEmail = ref('')
const error = ref('')

// The link also works on a device where you aren't signed in, so where to go next depends.
const next = computed(() =>
  auth.isAuthenticated
    ? { to: { name: 'settings-profile' }, label: 'Back to your settings' }
    : { to: { name: 'login' }, label: 'Log in' },
)

async function confirm(): Promise<void> {
  // A missing token is sent as-is: the API answers with "This link is incomplete".
  const token = typeof route.query.token === 'string' ? route.query.token : ''

  try {
    const user = await auth.confirmEmailChange(token)
    confirmedEmail.value = user.email
    state.value = 'confirmed'
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    error.value = caught.fieldError('token') ?? caught.message
    state.value = 'failed'
  }
}

onMounted(confirm)
</script>

<template>
  <div class="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-12">
    <SproutLogo />

    <main
      class="flex w-full max-w-130 flex-col items-center gap-6 rounded-xl border border-line bg-surface px-6 pt-12 pb-10 text-center shadow-md sm:px-10"
      aria-live="polite"
    >
      <template v-if="state === 'confirming'">
        <span
          class="grid size-16 place-items-center rounded-lg bg-sprout-soft text-sprout-ink motion-safe:animate-pulse"
        >
          <BaseIcon name="mail" :size="32" />
        </span>
        <h1 class="font-display text-title-lg text-ink" data-test="status">
          Confirming your email…
        </h1>
      </template>

      <template v-else>
        <span
          class="grid size-16 place-items-center rounded-lg"
          :class="
            state === 'confirmed'
              ? 'bg-sprout-soft text-sprout-ink'
              : 'bg-ember-soft text-ember-ink'
          "
        >
          <BaseIcon :name="state === 'confirmed' ? 'mail-check' : 'mail'" :size="32" />
        </span>
        <div class="flex flex-col items-center gap-3">
          <h1 class="font-display text-title-lg text-ink">
            {{ state === 'confirmed' ? 'Your email is changed' : 'That link didn’t work' }}
          </h1>
          <p v-if="state === 'confirmed'" class="text-body-lg text-ink-muted" data-test="confirmed">
            From now on you sign in with <b class="text-ink">{{ confirmedEmail }}</b
            >.
          </p>
          <p v-else class="text-body-lg text-ink-muted" data-test="error">{{ error }}</p>
        </div>
        <RouterLink
          :to="next.to"
          class="inline-flex h-13 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-on-primary shadow-xs transition duration-150 ease-default hover:bg-primary-hover active:translate-y-px"
          data-test="next"
        >
          {{ next.label }}
          <BaseIcon name="arrow-right" :size="20" />
        </RouterLink>
      </template>
    </main>
  </div>
</template>
