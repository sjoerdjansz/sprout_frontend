<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { ApiError } from '@/lib/api'
import { initials } from '@/lib/names'
import { useAuthStore } from '@/stores/auth'
import { useConversationsStore } from '@/stores/conversations'
import { useSidebarStore } from '@/stores/sidebar'

const auth = useAuthStore()
const conversationsStore = useConversationsStore()
const sidebarStore = useSidebarStore()

const userName = computed<string>(() => auth.user?.name ?? '')
const historyError = ref<string | null>(null)

async function loadUser(): Promise<void> {
  try {
    await auth.fetchUser()
  } catch (caught) {
    // A 401 signs you out (App.vue then shows the login screen). An unreachable API leaves
    // the name empty; the screen's own data calls will say what to do.
    if (!(caught instanceof ApiError)) {
      throw caught
    }
  }
}

// The sidebar shows the chat history on every page; the dashboard also reads it from the store.
async function loadHistory(): Promise<void> {
  historyError.value = null

  try {
    await conversationsStore.fetchConversations()
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    historyError.value = caught.message
  }
}

onMounted(() => {
  if (auth.user === null) {
    void loadUser()
  }
  void loadHistory()
})
</script>

<template>
  <!-- The sidebar column narrows to icons when you collapse it (250ms, the toggle speed). -->
  <div
    class="grid min-h-svh grid-cols-[var(--sidebar-width)_minmax(0,1fr)] transition-[grid-template-columns] duration-250 ease-default motion-reduce:transition-none"
    :style="{ '--sidebar-width': sidebarStore.collapsed ? '72px' : '232px' }"
  >
    <AppSidebar
      :user-name="userName"
      :user-initials="initials(userName)"
      :conversations="conversationsStore.conversations"
      :history-error="historyError"
      :collapsed="sidebarStore.collapsed"
      class="sticky top-0 h-svh overflow-x-hidden overflow-y-auto"
      @logout="auth.logout()"
      @toggle-collapsed="sidebarStore.toggleCollapsed()"
    />

    <main class="flex min-w-0 flex-auto flex-col gap-8 px-10 pt-8 pb-12">
      <slot />
    </main>
  </div>
</template>
