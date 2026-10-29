<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'

/** @type {import('vue').Ref<'checking' | 'connected' | 'unreachable'>} */
const connection = ref('checking')

async function checkConnection() {
  connection.value = 'checking'

  try {
    await api('/status')
    connection.value = 'connected'
  } catch {
    connection.value = 'unreachable'
  }
}

onMounted(checkConnection)
</script>

<template>
  <main class="mx-auto flex min-h-svh max-w-190 flex-col justify-center gap-8 px-4 py-12">
    <div>
      <h1 class="font-display text-display text-ink">Sprout</h1>
      <p class="mt-2 text-body-lg text-ink-muted">Learn it. Keep it.</p>
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
          class="rounded-md bg-primary px-5 py-2.5 text-body-strong text-on-primary shadow-xs transition duration-150 ease-default hover:bg-primary-hover active:translate-y-px"
          @click="checkConnection"
        >
          Try again
        </button>
      </div>
    </section>
  </main>
</template>
