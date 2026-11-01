<script setup lang="ts">
import { computed } from 'vue'
import BaseSelect, { type SelectOption } from '@/components/BaseSelect.vue'
import BaseSwitch from '@/components/BaseSwitch.vue'
import BaseTabs from '@/components/BaseTabs.vue'
import BaseToast from '@/components/BaseToast.vue'
import FormError from '@/components/FormError.vue'
import SettingRow from '@/components/settings/SettingRow.vue'
import SettingsCard from '@/components/settings/SettingsCard.vue'
import { useInstantSettings } from '@/composables/settings/useInstantSettings'
import { reminderChannels, reminderTimes } from '@/lib/settingsOptions'

const { setting, error, toast } = useInstantSettings()

const daily = setting('wants_daily_reminder')
const time = setting('reminder_time')
const streak = setting('wants_streak_reminder')
const weekly = setting('wants_weekly_insights')
const channel = setting('reminder_channel')

const timeOptions = computed<SelectOption[]>(() =>
  reminderTimes(time.value).map((option) => ({ value: option, label: option })),
)
</script>

<template>
  <SettingsCard title="Reminders" subtitle="">
    <div>
      <SettingRow name="Daily reminder" description="A nudge when cards are due.">
        <div class="flex items-center gap-3">
          <div class="w-28">
            <BaseSelect
              v-model="time"
              label="Reminder time"
              hide-label
              :options="timeOptions"
              :disabled="!daily"
              data-test="reminder-time"
            />
          </div>
          <BaseSwitch v-model="daily" label="Daily reminder" hide-label data-test="daily" />
        </div>
      </SettingRow>
      <SettingRow
        name="Streak at risk"
        description="One message in the evening if your streak is about to break."
      >
        <BaseSwitch v-model="streak" label="Streak at risk" hide-label data-test="streak" />
      </SettingRow>
      <SettingRow name="Weekly insights" description="A short summary every Sunday.">
        <BaseSwitch v-model="weekly" label="Weekly insights" hide-label data-test="weekly" />
      </SettingRow>
      <SettingRow name="Where" description="Push on this device, email, or both.">
        <BaseTabs v-model="channel" label="Where" :items="reminderChannels" />
      </SettingRow>
    </div>

    <FormError v-if="error" :message="error" />
  </SettingsCard>

  <BaseToast v-if="toast !== null" :title="toast.title" :tone="toast.tone" :icon="toast.icon" />
</template>
