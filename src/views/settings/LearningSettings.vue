<script setup lang="ts">
import { computed, type WritableComputedRef } from 'vue'
import BaseSwitch from '@/components/BaseSwitch.vue'
import BaseTabs, { type TabItem } from '@/components/BaseTabs.vue'
import BaseToast from '@/components/BaseToast.vue'
import FormError from '@/components/FormError.vue'
import SettingRow from '@/components/settings/SettingRow.vue'
import SettingsCard from '@/components/settings/SettingsCard.vue'
import { useInstantSettings } from '@/composables/settings/useInstantSettings'
import { cardCounts } from '@/lib/settingsOptions'
import type { CardCount } from '@/stores/settings'

const { setting, error, toast } = useInstantSettings()

const countTabs: TabItem[] = cardCounts.map((count) => ({
  id: String(count),
  label: String(count),
}))

// The tabs speak in strings; the API in numbers.
function asTab(count: WritableComputedRef<CardCount>): WritableComputedRef<string> {
  return computed<string>({
    get: () => String(count.value),
    set: (id) => {
      const picked = cardCounts.find((option) => String(option) === id)
      if (picked !== undefined) {
        count.value = picked
      }
    },
  })
}

const dailyGoal = asTab(setting('daily_goal_cards'))
const sessionSize = asTab(setting('session_size'))
const interleave = setting('interleave_subtopics')
const hintFirst = setting('hint_before_answer')
const saveChats = setting('save_chats_as_material')
</script>

<template>
  <SettingsCard title="Learning">
    <div>
      <SettingRow name="Daily goal" description="Cards to review per day.">
        <BaseTabs
          v-model="dailyGoal"
          label="Daily goal"
          :items="countTabs"
          data-test="daily-goal"
        />
      </SettingRow>
      <SettingRow name="Default session size" description="Cards or questions per session.">
        <BaseTabs
          v-model="sessionSize"
          label="Session size"
          :items="countTabs"
          data-test="session-size"
        />
      </SettingRow>
      <SettingRow
        name="Mix subtopics (interleaving)"
        description="Shuffle subtopics in one session."
      >
        <BaseSwitch v-model="interleave" label="Mix subtopics" hide-label data-test="interleave" />
      </SettingRow>
      <SettingRow
        name="Hint before the answer"
        description="On a wrong answer, get a nudge and a second try first."
      >
        <BaseSwitch
          v-model="hintFirst"
          label="Hint before the answer"
          hide-label
          data-test="hint-first"
        />
      </SettingRow>
      <SettingRow
        name="Save chats as study material"
        description="Turn what you get right in open sessions into cards and questions."
      >
        <BaseSwitch v-model="saveChats" label="Save chats" hide-label data-test="save-chats" />
      </SettingRow>
    </div>

    <FormError v-if="error" :message="error" />
  </SettingsCard>

  <BaseToast v-if="toast !== null" :title="toast.title" :tone="toast.tone" :icon="toast.icon" />
</template>
