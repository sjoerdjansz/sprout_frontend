<script setup lang="ts">
import BaseIconButton from '@/components/BaseIconButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseTextarea from '@/components/BaseTextarea.vue'

const { position, titleError, contentError } = defineProps<{
  /** 1-based, so "Remove subtopic 2" says which one. */
  position: number
  titleError?: string
  contentError?: string
}>()

const emit = defineEmits<{
  remove: []
}>()

const title = defineModel<string>('title', { required: true })
const content = defineModel<string>('content', { required: true })
</script>

<template>
  <fieldset class="flex flex-col gap-3 rounded-lg border border-line p-4" data-test="subtopic">
    <div class="flex items-end gap-2">
      <BaseInput
        v-model="title"
        :label="`Subtopic ${position}`"
        :error="titleError"
        data-test="subtopic-title"
      />
      <BaseIconButton
        icon="x"
        :label="`Remove subtopic ${position}`"
        class="mb-0.5"
        data-test="remove-subtopic"
        @click="emit('remove')"
      />
    </div>
    <BaseTextarea
      v-model="content"
      label="Notes"
      :error="contentError"
      rows="3"
      data-test="subtopic-content"
    />
  </fieldset>
</template>
