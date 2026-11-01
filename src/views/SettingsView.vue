<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'
import FormError from '@/components/FormError.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import SettingsMenu from '@/components/settings/SettingsMenu.vue'
import { ApiError } from '@/lib/api'
import { settingsSections } from '@/lib/settingsOptions'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

type LoadState = 'loading' | 'loaded' | 'failed'

const loadState = ref<LoadState>('loading')
const loadError = ref('')

// Every section edits these, so they're loaded once for the whole page.
async function load(): Promise<void> {
  loadState.value = 'loading'

  try {
    await settingsStore.fetchSettings()
    loadState.value = 'loaded'
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    loadError.value = caught.message
    loadState.value = 'failed'
  }
}

onMounted(load)
</script>

<template>
  <AppLayout>
    <div class="flex flex-col gap-6 md:flex-row md:gap-7">
      <aside class="flex flex-col gap-3 md:w-55 md:flex-none">
        <h1 class="font-display text-title-lg text-ink md:pl-3">Settings</h1>
        <SettingsMenu :sections="settingsSections" />
      </aside>

      <div class="flex min-w-0 max-w-200 flex-auto flex-col gap-5">
        <p v-if="loadState === 'loading'" class="text-ink-muted" aria-live="polite">
          Loading your settings…
        </p>

        <div v-else-if="loadState === 'failed'" class="flex flex-col items-start gap-4">
          <FormError :message="loadError" />
          <BaseButton variant="secondary" icon="rotate-ccw" data-test="retry" @click="load">
            Try again
          </BaseButton>
        </div>

        <RouterView v-else />
      </div>
    </div>
  </AppLayout>
</template>
