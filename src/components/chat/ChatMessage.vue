<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import type { AvatarColor } from '@/stores/auth'

const {
  from,
  initials = '',
  avatarColor,
  typing = false,
} = defineProps<{
  from: 'tutor' | 'user'
  /** The learner's initials, for their avatar. */
  initials?: string
  avatarColor?: AvatarColor
  /** Shows bouncing dots instead of the message while the tutor writes its reply. */
  typing?: boolean
}>()
</script>

<template>
  <div class="flex items-end gap-3" :class="{ 'flex-row-reverse': from === 'user' }">
    <span
      v-if="from === 'tutor'"
      aria-hidden="true"
      class="inline-grid size-8 flex-none place-items-center rounded-full bg-primary text-on-primary"
    >
      <BaseIcon name="sprout" :size="16" />
    </span>
    <UserAvatar v-else :initials="initials" :color="avatarColor" size="md" />

    <div
      class="max-w-[min(560px,86%)] px-5 py-3.5 text-body-lg text-ink"
      :class="
        from === 'tutor'
          ? 'rounded-lg rounded-bl-xs bg-surface-tint'
          : 'rounded-lg rounded-br-xs border border-line bg-surface whitespace-pre-wrap shadow-sm'
      "
    >
      <span v-if="typing" class="inline-flex gap-1.5 px-0.5 py-1.5" data-test="typing">
        <span class="sr-only">Sprout is typing…</span>
        <i
          v-for="dot in 3"
          :key="dot"
          aria-hidden="true"
          class="size-1.75 animate-bounce rounded-full bg-sprout motion-reduce:animate-none"
          :style="{ animationDelay: `${(dot - 1) * 150}ms` }"
        />
      </span>
      <slot v-else />
    </div>
  </div>
</template>
