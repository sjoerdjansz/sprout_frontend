<script setup lang="ts">
import { computed } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import type { IconName } from '@/components/icons'
import { formatFileSize, type AttachmentStatus } from '@/lib/attachments'

const {
  name,
  sizeBytes,
  status,
  error = null,
  removable = false,
} = defineProps<{
  name: string
  sizeBytes: number
  /** Only in the composer; a sent file shows no status. */
  status?: AttachmentStatus
  /** Why the file can't be used, shown under its name. */
  error?: string | null
  removable?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

interface StatusLook {
  icon: IconName
  label: string
  spinning: boolean
}

// A status always has an icon and a word for screen readers, never only a colour.
const statusLooks: Record<AttachmentStatus, StatusLook> = {
  uploading: { icon: 'loader-circle', label: 'Uploading', spinning: true },
  processing: { icon: 'loader-circle', label: 'Reading', spinning: true },
  ready: { icon: 'check', label: 'Ready', spinning: false },
  failed: { icon: 'circle-alert', label: "Couldn't use this file", spinning: false },
}

const look = computed<StatusLook | null>(() => (status === undefined ? null : statusLooks[status]))
const failed = computed<boolean>(() => status === 'failed')
</script>

<template>
  <div
    class="inline-flex max-w-full min-w-0 items-center gap-2 rounded-md border py-1 pr-1 pl-2.5"
    :class="
      failed ? 'border-ember bg-ember-soft text-ember-ink' : 'border-line bg-surface text-ink'
    "
    data-test="attachment-chip"
  >
    <BaseIcon
      :name="look?.icon ?? 'file-text'"
      :size="16"
      class="flex-none"
      :class="[
        { 'motion-safe:animate-spin': look?.spinning },
        failed ? '' : status === 'ready' ? 'text-sprout-ink' : 'text-ink-muted',
      ]"
    />
    <span class="flex min-w-0 flex-col py-0.5">
      <span class="flex min-w-0 items-baseline gap-1.5 text-label">
        <span class="max-w-56 truncate font-semibold" :title="name" data-test="attachment-name">
          {{ name }}
        </span>
        <span class="flex-none font-normal" :class="failed ? '' : 'text-ink-subtle'">
          {{ formatFileSize(sizeBytes) }}
        </span>
        <span v-if="look" class="sr-only">· {{ look.label }}</span>
      </span>
      <span v-if="error" class="text-caption" data-test="attachment-error">{{ error }}</span>
    </span>
    <BaseIconButton
      v-if="removable"
      icon="x"
      :label="`Remove ${name}`"
      size="sm"
      data-test="remove-attachment"
      @click="emit('remove')"
    />
    <span v-else class="w-1.5" aria-hidden="true" />
  </div>
</template>
