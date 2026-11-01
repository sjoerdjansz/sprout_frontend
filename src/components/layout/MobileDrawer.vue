<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import BaseIcon from '@/components/BaseIcon.vue'
import BaseIconButton from '@/components/BaseIconButton.vue'
import SproutLogo from '@/components/SproutLogo.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import type { IconName } from '@/components/icons'
import ChatHistory from '@/components/layout/ChatHistory.vue'
import type { AvatarColor } from '@/stores/auth'
import type { ConversationSummary } from '@/stores/conversations'

const {
  userName,
  userInitials,
  userColor = 'sun',
  conversations,
  historyError = null,
} = defineProps<{
  userName: string
  userInitials: string
  userColor?: AvatarColor
  conversations: ConversationSummary[]
  historyError?: string | null
}>()

const emit = defineEmits<{
  close: []
  logout: []
}>()

interface DrawerLink {
  icon: IconName
  label: string
  description: string
  /** Left out while the page doesn't exist yet: the link then does nothing, as in the sidebar. */
  to?: RouteLocationRaw
}

const links: DrawerLink[] = [
  {
    icon: 'house',
    label: 'Dashboard',
    description: 'Chat, today’s queue, progress',
    to: { name: 'home' },
  },
  {
    icon: 'network',
    label: 'Topics',
    description: 'All topics and mastery scores',
    to: { name: 'topics' },
  },
  {
    icon: 'target',
    label: 'Practice',
    description: 'Feynman, flashcards, quizzes',
    to: { name: 'practice' },
  },
  { icon: 'chart-line', label: 'Insights', description: 'Study time and progress per subject' },
  {
    icon: 'settings',
    label: 'Settings',
    description: 'Profile, effort, reminders, appearance',
    to: { name: 'settings' },
  },
]

const linkClasses =
  'group flex min-h-14 items-center gap-3.5 rounded-md px-3 text-ink transition-colors duration-150 ease-default hover:bg-surface-sunken aria-[current=page]:bg-sprout-soft aria-[current=page]:text-sprout-ink'

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

// A modal dialog, like BaseDialog: the browser traps focus inside and makes the page inert. The
// parent decides whether it's shown (v-if), so it opens as soon as it mounts.
onMounted(() => {
  dialog.value?.showModal()
})

function onCancel(event: Event): void {
  // Escape fires `cancel`; stop the browser from closing it so the parent stays in charge.
  event.preventDefault()
  emit('close')
}

// A click on the dimmed page next to the drawer lands on the dialog itself, not on its content.
function onClick(event: MouseEvent): void {
  if (event.target === dialog.value) {
    emit('close')
  }
}
</script>

<template>
  <dialog
    ref="dialog"
    aria-label="Menu"
    class="m-0 h-svh max-h-none w-78 max-w-[calc(100vw-48px)] rounded-r-xl border-0 bg-surface p-0 text-ink shadow-lg transition-transform duration-250 ease-default backdrop:bg-onyx/40 starting:-translate-x-full motion-reduce:transition-none"
    data-test="drawer"
    @cancel="onCancel"
    @click="onClick"
  >
    <nav aria-label="Main" class="flex h-full flex-col gap-1 px-3 pt-4 pb-6">
      <div class="flex items-center justify-between pb-3 pl-2">
        <SproutLogo />
        <BaseIconButton
          icon="x"
          label="Close menu"
          class="size-11"
          data-test="close-menu"
          @click="emit('close')"
        />
      </div>

      <!-- Who's signed in, so you know which account you're learning on. -->
      <p class="mx-1 mb-3 flex items-center gap-3 rounded-lg bg-canvas p-3" data-test="account">
        <UserAvatar :initials="userInitials" :color="userColor" size="md" />
        <span class="sr-only">Signed in as</span>
        <span class="min-w-0 truncate text-body-strong">{{ userName }}</span>
      </p>

      <template v-for="link in links" :key="link.label">
        <RouterLink v-if="link.to" :to="link.to" :class="linkClasses" data-test="drawer-link">
          <BaseIcon :name="link.icon" />
          <span class="flex flex-col">
            <span class="text-body-strong">{{ link.label }}</span>
            <span
              class="text-caption font-normal text-ink-subtle group-aria-[current=page]:text-sprout-ink"
            >
              {{ link.description }}
            </span>
          </span>
        </RouterLink>
        <a v-else href="#" :class="linkClasses" data-test="drawer-link" @click.prevent>
          <BaseIcon :name="link.icon" />
          <span class="flex flex-col">
            <span class="text-body-strong">{{ link.label }}</span>
            <span class="text-caption font-normal text-ink-subtle">{{ link.description }}</span>
          </span>
        </a>
      </template>

      <!-- Takes the free space and scrolls on its own, so Log out stays at the bottom. -->
      <ChatHistory
        :conversations="conversations"
        :error="historyError"
        class="my-4 min-h-0 grow overflow-y-auto"
        data-test="chat-history"
      />

      <button
        type="button"
        class="flex min-h-12 cursor-pointer items-center gap-3.5 rounded-md px-3 text-label text-ink-muted transition-colors duration-150 ease-default hover:bg-surface-sunken hover:text-ink"
        data-test="logout"
        @click="emit('logout')"
      >
        <BaseIcon name="log-out" />
        Log out
      </button>
    </nav>
  </dialog>
</template>
