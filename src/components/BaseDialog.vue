<script setup lang="ts">
import { onMounted, useId, useTemplateRef } from 'vue'
import BaseIconButton from '@/components/BaseIconButton.vue'

const { title, closable = true } = defineProps<{
  title: string
  /** False while something is in progress that closing would interrupt. */
  closable?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()

// Opened as a modal, so the browser traps focus inside and makes the page behind it inert.
// The parent decides whether it's shown (v-if), so it opens as soon as it mounts.
onMounted(() => {
  dialog.value?.showModal()
})

function requestClose(): void {
  if (closable) {
    emit('close')
  }
}

function onCancel(event: Event): void {
  // Escape fires `cancel`; stop the browser from closing it so the parent stays in charge.
  event.preventDefault()
  requestClose()
}
</script>

<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    class="m-auto max-h-[90svh] w-[min(640px,calc(100vw-32px))] overflow-y-auto rounded-xl border border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-onyx/40"
    @cancel="onCancel"
  >
    <div class="flex flex-col gap-6 p-7">
      <div class="flex items-start justify-between gap-4">
        <h2 :id="titleId" class="font-display text-title-lg">{{ title }}</h2>
        <BaseIconButton
          icon="x"
          label="Close"
          :disabled="!closable"
          data-test="dialog-close"
          @click="requestClose"
        />
      </div>

      <slot />
    </div>
  </dialog>
</template>
