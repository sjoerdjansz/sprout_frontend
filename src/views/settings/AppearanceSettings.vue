<script setup lang="ts">
import BaseSwitch from '@/components/BaseSwitch.vue'
import BaseToast from '@/components/BaseToast.vue'
import FormError from '@/components/FormError.vue'
import SettingRow from '@/components/settings/SettingRow.vue'
import SettingsCard from '@/components/settings/SettingsCard.vue'
import ThemePicker from '@/components/settings/ThemePicker.vue'
import { useInstantSettings } from '@/composables/settings/useInstantSettings'

const { setting, error, toast } = useInstantSettings()

// The theme store applies these to the page as soon as they change.
const theme = setting('theme')
const reduceMotion = setting('reduce_motion')
</script>

<template>
  <SettingsCard title="Appearance" subtitle="">
    <ThemePicker v-model="theme" />

    <div>
      <SettingRow
        name="Reduce motion"
        description="Fewer flips and bounces. Sprout still celebrates, just quietly."
      >
        <BaseSwitch
          v-model="reduceMotion"
          label="Reduce motion"
          hide-label
          data-test="reduce-motion"
        />
      </SettingRow>
    </div>

    <FormError v-if="error" :message="error" />
  </SettingsCard>

  <BaseToast v-if="toast !== null" :title="toast.title" :tone="toast.tone" :icon="toast.icon" />
</template>
