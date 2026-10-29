<script setup lang="ts">
import { computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import PracticeModes from '@/components/dashboard/PracticeModes.vue'
import RetentionQueue from '@/components/dashboard/RetentionQueue.vue'
import TutorPrompt from '@/components/dashboard/TutorPrompt.vue'
import WeeklyInsights from '@/components/dashboard/WeeklyInsights.vue'
import { dayOverline, greeting } from '@/lib/greeting'
import { firstName } from '@/lib/names'
import { useAuthStore } from '@/stores/auth'
import {
  lastSession,
  practiceModes,
  progress,
  retentionQueue,
  suggestions,
  weeklyStats,
} from '@/views/dashboardPlaceholders'

const auth = useAuthStore()

const now = new Date()

const title = computed<string>(() => {
  const name = firstName(auth.user?.name ?? '')

  return name === '' ? greeting(now) : `${greeting(now)}, ${name}`
})
</script>

<template>
  <AppLayout>
    <DashboardHeader
      :overline="dayOverline(now)"
      :title="title"
      :streak-days="progress.streakDays"
      :mastered-topics="progress.masteredTopics"
      :total-topics="progress.totalTopics"
    />

    <div class="flex flex-wrap items-stretch gap-6">
      <TutorPrompt
        :suggestions="suggestions"
        :last-session="lastSession"
        class="min-w-0 flex-[2_1_520px]"
      />
      <RetentionQueue
        :topics="retentionQueue.topics"
        :due-count="retentionQueue.dueCount"
        :minutes="retentionQueue.minutes"
        class="min-w-0 flex-[1_1_320px]"
      />
    </div>

    <PracticeModes :modes="practiceModes" />

    <WeeklyInsights :stats="weeklyStats" />
  </AppLayout>
</template>
