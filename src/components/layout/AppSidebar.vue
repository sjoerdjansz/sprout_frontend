<script setup lang="ts">
import SproutLogo from '@/components/SproutLogo.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import SidebarNavLink from '@/components/layout/SidebarNavLink.vue'
import StreakNudge from '@/components/layout/StreakNudge.vue'

const { userName, userInitials } = defineProps<{
  userName: string
  userInitials: string
}>()

const emit = defineEmits<{
  logout: []
}>()
</script>

<template>
  <nav aria-label="Main" class="flex flex-col gap-1 border-r border-line px-4 py-6">
    <SproutLogo class="px-2 pb-6" />

    <SidebarNavLink icon="house" :to="{ name: 'home' }">Dashboard</SidebarNavLink>
    <SidebarNavLink icon="network">Knowledge map</SidebarNavLink>
    <SidebarNavLink icon="target">Practice center</SidebarNavLink>
    <SidebarNavLink icon="chart-line">Insights</SidebarNavLink>

    <div class="min-h-6 grow" />

    <!-- Placeholder until the API tracks streaks. -->
    <StreakNudge :days="6" nudge="Review today’s queue to make it 7." class="mb-3" />

    <SidebarNavLink icon="settings">Settings</SidebarNavLink>

    <!-- Temporary: logs you out until there's a profile menu. -->
    <button
      type="button"
      title="Log out"
      data-test="logout"
      class="flex h-11 cursor-pointer items-center gap-2.5 rounded-md px-3 text-left text-body-strong text-ink-muted transition-colors duration-150 ease-default hover:bg-surface hover:text-ink"
      @click="emit('logout')"
    >
      <UserAvatar :initials="userInitials" />
      {{ userName }}
      <span class="sr-only">· Log out</span>
    </button>
  </nav>
</template>
