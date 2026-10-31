<script setup lang="ts">
import { ref, watch } from 'vue'
import AttachmentChip from '@/components/chat/AttachmentChip.vue'
import type { Attachment } from '@/composables/chat/useComposerAttachments'

const { attachments, disabled = false } = defineProps<{
  attachments: Attachment[]
  /** While the message is on its way: nothing to remove. */
  disabled?: boolean
}>()

const emit = defineEmits<{
  remove: [key: number]
}>()

// Reading takes a few seconds, so say when a file is ready or couldn't be used.
const announcement = ref('')

watch(
  () => attachments.map((attachment) => ({ ...attachment })),
  (now, before) => {
    const statusBefore = new Map(before.map((attachment) => [attachment.key, attachment.status]))
    for (const attachment of now) {
      const previous = statusBefore.get(attachment.key)
      if (previous === attachment.status) {
        continue
      }
      if (attachment.status === 'ready') {
        announcement.value = `${attachment.name} is ready.`
      } else if (attachment.status === 'failed') {
        announcement.value = `${attachment.name}: ${attachment.error ?? "Sprout can't use this file."}`
      }
    }
  },
)
</script>

<template>
  <ul
    v-if="attachments.length > 0"
    aria-label="Attached files"
    class="flex flex-wrap gap-1.5 px-1"
    data-test="composer-attachments"
  >
    <li v-for="attachment in attachments" :key="attachment.key" class="max-w-full min-w-0">
      <AttachmentChip
        :name="attachment.name"
        :size-bytes="attachment.sizeBytes"
        :status="attachment.status"
        :error="attachment.error"
        :removable="!disabled"
        @remove="emit('remove', attachment.key)"
      />
    </li>
  </ul>
  <p class="sr-only" aria-live="polite" data-test="attachments-status">{{ announcement }}</p>
</template>
