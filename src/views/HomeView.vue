<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

type Connection = 'checking' | 'connected' | 'unreachable'

const connection = ref<Connection>('checking')

async function checkConnection(): Promise<void> {
  connection.value = 'checking'

  try {
    await api('/status')
    connection.value = 'connected'
  } catch {
    connection.value = 'unreachable'
  }
}

async function loadUser(): Promise<void> {
  try {
    await auth.fetchUser()
  } catch (caught) {
    // A 401 signs you out (App.vue then shows the login screen) and an unreachable API is
    // already reported by the connection check, so there's nothing more to show here.
    if (!(caught instanceof ApiError)) {
      throw caught
    }
  }
}

onMounted(() => {
  void checkConnection()

  if (auth.user === null) {
    void loadUser()
  }
})
</script>

<template>
  <main class="mx-auto flex min-h-svh max-w-190 flex-col justify-center gap-8 px-4 py-12">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="font-display text-display text-ink">
          {{ auth.user ? `Hi, ${auth.user.name}` : 'Sprout' }}
        </h1>
        <p class="mt-2 text-body-lg text-ink-muted">Learn it. Keep it.</p>
      </div>
      <BaseButton variant="secondary" data-test="logout" @click="auth.logout()">Log out</BaseButton>
    </div>

    <section
      class="rounded-lg border border-line bg-surface p-6 shadow-sm"
      aria-live="polite"
      data-test="connection"
    >
      <p v-if="connection === 'checking'" class="text-ink-muted">Checking the connection…</p>

      <p v-else-if="connection === 'connected'" class="font-semibold text-sprout-ink">
        Connected to the Sprout API.
      </p>

      <div v-else class="flex flex-col items-start gap-4">
        <p class="rounded-md bg-ember-soft px-4 py-3 text-ember-ink">
          Can't reach the Sprout API. Check that the backend is running and try again.
        </p>
        <button
          type="button"
          data-test="retry"
          class="rounded-md bg-primary px-5 py-2.5 text-body-strong text-on-primary shadow-xs transition duration-150 ease-default hover:bg-primary-hover active:translate-y-px"
          @click="checkConnection"
        >
          Try again
        </button>
      </div>
    </section>
  </main>
</template>
