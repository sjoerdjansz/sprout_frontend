<script setup lang="ts">
import BaseBadge from '@/components/BaseBadge.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import AttachmentChip from '@/components/chat/AttachmentChip.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { techniqueBadges, type Technique } from '@/lib/techniques'
import type { AvatarColor } from '@/stores/auth'

/** A file sent with a message: its name and size, it can't be opened or downloaded. */
export interface MessageFile {
  original_filename: string
  size_bytes: number
}

const {
  from,
  initials = '',
  avatarColor,
  typing = false,
  technique = null,
  materials = [],
} = defineProps<{
  from: 'tutor' | 'user'
  /** The learner's initials, for their avatar. */
  initials?: string
  avatarColor?: AvatarColor
  /** Shows bouncing dots instead of the message while the tutor writes its reply. */
  typing?: boolean
  /** The learning technique the tutor applies in this turn, named in a badge above it. */
  technique?: Technique | null
  /** The files you sent with it; the tutor's messages never have any. */
  materials?: MessageFile[]
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
      class="max-w-[min(560px,86%)] px-4 py-3.5 text-body-lg text-ink md:px-5"
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
      <template v-else>
        <BaseBadge
          v-if="technique"
          :tone="techniqueBadges[technique].tone"
          :icon="techniqueBadges[technique].icon"
          class="mb-2"
          data-test="technique"
        >
          {{ techniqueBadges[technique].label }}
        </BaseBadge>
        <slot />
        <ul
          v-if="from === 'user' && materials.length > 0"
          aria-label="Attached files"
          class="mt-2.5 flex flex-wrap gap-1.5 whitespace-normal"
          data-test="message-files"
        >
          <li v-for="(file, index) in materials" :key="index" class="max-w-full min-w-0">
            <AttachmentChip :name="file.original_filename" :size-bytes="file.size_bytes" />
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>
