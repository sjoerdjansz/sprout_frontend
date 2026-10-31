<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseTabs, { type TabItem } from '@/components/BaseTabs.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'
import MarkdownContent from '@/components/chat/MarkdownContent.vue'

// Native attributes (data-test ...) belong on the textarea, like BaseTextarea's own.
defineOptions({ inheritAttrs: false })

const {
  label,
  hint,
  error,
  maximumLength = 10_000,
} = defineProps<{
  label: string
  /** The API's limit: 10,000 for a subtopic's notes, 30,000 for a topic's source. */
  maximumLength?: number
  /** What happens with the notes when you save. */
  hint: string
  error?: string
}>()

const model = defineModel<string>({ required: true })

type View = 'write' | 'preview'
const view = ref<View>('write')
const views: TabItem<View>[] = [
  { id: 'write', label: 'Write', icon: 'pencil' },
  { id: 'preview', label: 'Preview', icon: 'eye' },
]

const length = computed<number>(() => model.value.length)
const tooLong = computed<boolean>(() => length.value > maximumLength)
</script>

<!-- Notes or a pasted source, in Markdown: room to write, and a preview of how it reads. -->
<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-3">
      <span class="text-label text-ink" aria-hidden="true">{{ label }}</span>
      <BaseTabs v-model="view" :items="views" :label="`${label}: write or preview`" />
    </div>

    <BaseTextarea
      v-if="view === 'write'"
      v-model="model"
      :label="label"
      hide-label
      rows="12"
      placeholder="Paste your notes, a syllabus or an article. Markdown works."
      :error="error"
      class="min-h-60"
      v-bind="$attrs"
    />
    <div
      v-else
      class="min-h-60 overflow-y-auto rounded-md border border-line bg-surface px-4 py-3 text-body text-ink"
      data-test="notes-preview"
    >
      <MarkdownContent v-if="model.trim() !== ''" :source="model" />
      <p v-else class="text-ink-subtle">Nothing to preview yet.</p>
    </div>

    <div class="flex justify-between gap-3 text-caption font-normal">
      <span class="text-ink-subtle">{{ hint }}</span>
      <span
        class="flex-none tabular-nums"
        :class="tooLong ? 'text-ember-ink' : 'text-ink-subtle'"
        aria-live="polite"
        data-test="notes-count"
      >
        {{ length.toLocaleString('en') }} / {{ maximumLength.toLocaleString('en') }}
      </span>
    </div>
  </div>
</template>
