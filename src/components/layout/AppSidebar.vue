<script setup lang="ts">
import BaseIconButton from '@/components/BaseIconButton.vue'
import SproutLogo from '@/components/SproutLogo.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import ChatHistory from '@/components/layout/ChatHistory.vue'
import SidebarButton from '@/components/layout/SidebarButton.vue'
import SidebarNavLink from '@/components/layout/SidebarNavLink.vue'
import type { AvatarColor } from '@/stores/auth'
import type { ConversationSummary } from '@/stores/conversations'

const {
  userName,
  userInitials,
  userColor = 'sun',
  conversations,
  historyError = null,
  collapsed,
} = defineProps<{
  userName: string
  userInitials: string
  userColor?: AvatarColor
  conversations: ConversationSummary[]
  historyError?: string | null
  /** Icons only: the chat history and the streak nudge hide until you expand it again. */
  collapsed: boolean
}>()

const emit = defineEmits<{
  logout: []
  toggleCollapsed: []
}>()
</script>

<template>
  <nav
    aria-label="Main"
    class="flex flex-col gap-1 border-r border-line py-6"
    :class="collapsed ? 'px-3' : 'px-4'"
  >
    <div
      class="flex gap-2 pb-6"
      :class="collapsed ? 'flex-col items-center gap-3' : 'items-center justify-between pl-2'"
    >
      <SproutLogo :compact="collapsed" />
      <BaseIconButton
        :icon="collapsed ? 'chevron-right' : 'chevron-left'"
        :label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="!collapsed"
        data-test="sidebar-toggle"
        @click="emit('toggleCollapsed')"
      />
    </div>

    <SidebarNavLink icon="house" label="Dashboard" :to="{ name: 'home' }" :collapsed="collapsed" />
    <SidebarNavLink
      icon="network"
      label="Knowledge map"
      :to="{ name: 'knowledge-map' }"
      :collapsed="collapsed"
    />
    <SidebarNavLink
      icon="target"
      label="Practice center"
      :to="{ name: 'practice' }"
      :collapsed="collapsed"
    />
    <SidebarNavLink icon="chart-line" label="Insights" :collapsed="collapsed" />
    <SidebarNavLink
      icon="settings"
      label="Settings"
      :to="{ name: 'settings' }"
      :collapsed="collapsed"
    />

    <!-- Takes the free space and scrolls on its own, so the bottom of the sidebar stays put. -->
    <ChatHistory
      v-if="!collapsed"
      :conversations="conversations"
      :error="historyError"
      class="my-6 min-h-0 grow overflow-y-auto"
      data-test="chat-history"
    />
    <div v-else class="grow" />

    <!-- Who's signed in, so you know which account you're learning on. -->
    <p
      class="flex h-11 items-center gap-2.5 text-body-strong text-ink"
      :class="collapsed ? 'justify-center' : 'px-3'"
      :title="collapsed ? userName : undefined"
      data-test="account"
    >
      <UserAvatar :initials="userInitials" :color="userColor" />
      <span class="sr-only">Signed in as</span>
      <span class="min-w-0 truncate" :class="{ 'sr-only': collapsed }">{{ userName }}</span>
    </p>

    <SidebarButton
      icon="log-out"
      label="Log out"
      :collapsed="collapsed"
      data-test="logout"
      @click="emit('logout')"
    />
  </nav>
</template>
