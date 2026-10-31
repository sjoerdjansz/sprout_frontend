<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseTabs from '@/components/BaseTabs.vue'
import BaseToast from '@/components/BaseToast.vue'
import FormError from '@/components/FormError.vue'
import SettingRow from '@/components/settings/SettingRow.vue'
import SettingsCard from '@/components/settings/SettingsCard.vue'
import UsageCard from '@/components/settings/UsageCard.vue'
import { useInstantSettings } from '@/composables/settings/useInstantSettings'
import { ApiError } from '@/lib/api'
import { effortOptions, type EffortOption } from '@/lib/settingsOptions'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const { setting, error, toast } = useInstantSettings()

const effort = setting('ai_level')
const effortNote = computed<EffortOption | undefined>(() =>
  effortOptions.find((option) => option.id === effort.value),
)

const usageError = ref<string | null>(null)

// Fetched every time you open the section, so the counts are current.
async function loadUsage(): Promise<void> {
  usageError.value = null

  try {
    await settingsStore.fetchUsage()
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    usageError.value = caught.message
  }
}

onMounted(loadUsage)
</script>

<template>
  <SettingsCard
    title="AI"
    subtitle="The AI is part of Sprout. There’s no key to connect and nothing to pay for separately."
  >
    <div>
      <SettingRow
        name="Effort"
        description="How much thought the tutor puts into each answer, feedback and new card."
      >
        <BaseTabs
          v-model="effort"
          label="Effort"
          :items="effortOptions.map((option) => ({ id: option.id, label: option.label }))"
        />
      </SettingRow>
    </div>

    <p
      v-if="effortNote"
      class="flex items-start gap-3 rounded-md bg-surface-tint px-3.5 py-3 text-label font-normal text-ink"
      aria-live="polite"
      data-test="effort-note"
    >
      <BaseIcon :name="effortNote.icon" :size="16" class="mt-0.5 flex-none text-sprout-ink" />
      <span
        ><b class="text-sprout-ink">{{ effortNote.title }}</b> {{ effortNote.text }}</span
      >
    </p>

    <FormError v-if="error" :message="error" />
  </SettingsCard>

  <UsageCard :usage="settingsStore.usage" :error="usageError" @retry="loadUsage" />

  <BaseToast v-if="toast !== null" :title="toast.title" :tone="toast.tone" :icon="toast.icon" />
</template>
