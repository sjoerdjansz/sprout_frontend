<script setup lang="ts">
import BaseBadge from '@/components/BaseBadge.vue'
import ChatComposer, { type Suggestion } from '@/components/chat/ChatComposer.vue'
import ResumeSession from '@/components/dashboard/ResumeSession.vue'

export interface LastSession {
  topic: string
  lastStudied: string
}

const { suggestions, lastSession } = defineProps<{
  suggestions: Suggestion[]
  lastSession: LastSession
}>()
</script>

<template>
  <section
    aria-labelledby="tutor-prompt-heading"
    class="flex flex-col gap-5 rounded-xl bg-surface-tint p-7"
  >
    <div class="flex flex-col items-start gap-2.5">
      <BaseBadge tone="sky" icon="brain">Socratic tutor</BaseBadge>
      <h2 id="tutor-prompt-heading" class="font-display text-title-lg text-ink">
        What do you want to understand today?
      </h2>
      <p class="text-ink-muted">
        I’ll guide you with questions instead of handing you answers, one step past what you already
        know.
      </p>
    </div>

    <ChatComposer
      :suggestions="suggestions"
      placeholder="Ask about a new concept, or something that confuses you…"
    />

    <ResumeSession :topic="lastSession.topic" :last-studied="lastSession.lastStudied" />
  </section>
</template>
