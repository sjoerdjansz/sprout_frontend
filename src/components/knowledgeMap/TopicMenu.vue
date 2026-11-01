<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'

const { topicTitle } = defineProps<{
  topicTitle: string
}>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()

const isOpen = ref(false)
const root = useTemplateRef<HTMLElement>('root')
const firstItem = useTemplateRef<HTMLButtonElement>('firstItem')

// A click anywhere outside the menu closes it, like a native menu.
function closeOnOutsideClick(event: MouseEvent): void {
  if (!(event.target instanceof Node) || !root.value?.contains(event.target)) {
    close()
  }
}

async function open(): Promise<void> {
  isOpen.value = true
  document.addEventListener('click', closeOnOutsideClick)
  await nextTick()
  firstItem.value?.focus()
}

function close(): void {
  isOpen.value = false
  document.removeEventListener('click', closeOnOutsideClick)
}

function toggle(): void {
  if (isOpen.value) {
    close()
  } else {
    void open()
  }
}

function pick(item: 'edit' | 'delete'): void {
  close()
  if (item === 'edit') {
    emit('edit')
  } else {
    emit('delete')
  }
}

onBeforeUnmount(close)
</script>

<template>
  <div ref="root" class="relative" @keydown.escape="close">
    <BaseIconButton
      icon="ellipsis-vertical"
      :label="`More for ${topicTitle}`"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      data-test="topic-menu"
      @click="toggle"
    />
    <div
      v-if="isOpen"
      role="menu"
      class="absolute top-11 right-0 z-10 flex min-w-44 flex-col rounded-md border border-line bg-surface p-1.5 shadow-lg"
    >
      <button
        ref="firstItem"
        type="button"
        role="menuitem"
        class="flex h-11 cursor-pointer items-center gap-2.5 rounded-sm px-3 text-left text-body-strong text-ink hover:bg-surface-sunken"
        data-test="topic-menu-edit"
        @click="pick('edit')"
      >
        <BaseIcon name="pencil" :size="18" />
        Edit topic
      </button>
      <!-- Ember like every destructive act; the dialog behind it asks you to confirm. -->
      <button
        type="button"
        role="menuitem"
        class="flex h-11 cursor-pointer items-center gap-2.5 rounded-sm px-3 text-left text-body-strong text-ember-ink hover:bg-ember-soft"
        data-test="topic-menu-delete"
        @click="pick('delete')"
      >
        <BaseIcon name="trash-2" :size="18" />
        Delete topic
      </button>
    </div>
  </div>
</template>
