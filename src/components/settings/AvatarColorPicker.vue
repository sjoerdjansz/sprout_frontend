<script setup lang="ts">
import UserAvatar from '@/components/UserAvatar.vue'
import { avatarColorOptions } from '@/lib/settingsOptions'
import type { AvatarColor } from '@/stores/auth'

const { initials } = defineProps<{
  initials: string
}>()

const color = defineModel<AvatarColor>({ required: true })
</script>

<template>
  <div role="group" aria-label="Avatar colour" class="flex flex-wrap gap-2">
    <button
      v-for="option in avatarColorOptions"
      :key="option.id"
      type="button"
      class="inline-grid size-11 cursor-pointer place-items-center rounded-full border-2 transition-colors duration-150 ease-default focus-visible:shadow-focus-ring focus-visible:outline-none"
      :class="color === option.id ? 'border-primary' : 'border-transparent'"
      :aria-pressed="color === option.id"
      :aria-label="option.name"
      :title="option.name"
      :data-test="`avatar-color-${option.id}`"
      @click="color = option.id"
    >
      <UserAvatar :initials="initials" :color="option.id" size="md" />
    </button>
  </div>
</template>
