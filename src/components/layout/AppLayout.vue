<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import MobileDrawer from '@/components/layout/MobileDrawer.vue'
import MobileTabBar from '@/components/layout/MobileTabBar.vue'
import MobileTopBar from '@/components/layout/MobileTopBar.vue'
import { ApiError } from '@/lib/api'
import { initials } from '@/lib/names'
import { useAuthStore } from '@/stores/auth'
import { useConversationsStore } from '@/stores/conversations'
import { useSettingsStore } from '@/stores/settings'
import { useSidebarStore } from '@/stores/sidebar'

const { tabBar = true } = defineProps<{
  /** The tab bar at phone width; a chat page leaves it out so its composer sits at the bottom. */
  tabBar?: boolean
}>()

const auth = useAuthStore()
const conversationsStore = useConversationsStore()
const settingsStore = useSettingsStore()
const sidebarStore = useSidebarStore()

const route = useRoute()

// The navigation drawer at phone width. Most links open another page with its own layout, but
// one conversation to the next keeps this page, so close it whenever the URL changes.
const menuOpen = ref(false)
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

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

// Your preferences apply on every page, and "today" and streaks follow your timezone.
async function loadSettings(): Promise<void> {
  try {
    await settingsStore.fetchSettings()
    await settingsStore.syncTimezone()
  } catch (caught) {
    // Without them the page still works; the settings page says what to do when they can't load.
    if (!(caught instanceof ApiError)) {
      throw caught
    }
  }
}

onMounted(() => {
  if (auth.user === null) {
    void loadUser()
  }
  if (settingsStore.settings === null) {
    void loadSettings()
  }
  void loadHistory()
})
</script>

<template>
  <!--
    At phone width: a top bar, the page and a tab bar. From md up: the sidebar next to the page;
    its column narrows to icons when you collapse it (250ms, the toggle speed).
  -->
  <div
    class="flex min-h-svh flex-col transition-[grid-template-columns] duration-250 ease-default motion-reduce:transition-none md:grid md:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]"
    :style="{ '--sidebar-width': sidebarStore.collapsed ? '72px' : '232px' }"
  >
    <MobileTopBar
      :menu-open="menuOpen"
      class="sticky top-0 z-10 md:hidden"
      @open-menu="menuOpen = true"
    />
    <MobileDrawer
      v-if="menuOpen"
      :user-name="userName"
      :user-initials="initials(userName)"
      :user-color="auth.user?.avatar_color"
      :conversations="conversationsStore.conversations"
      :history-error="historyError"
      @close="menuOpen = false"
      @logout="auth.logout()"
    />

    <div class="sticky top-0 hidden h-svh md:block">
      <AppSidebar
        :user-name="userName"
        :user-initials="initials(userName)"
        :user-color="auth.user?.avatar_color"
        :conversations="conversationsStore.conversations"
        :history-error="historyError"
        :collapsed="sidebarStore.collapsed"
        class="h-full overflow-x-hidden overflow-y-auto"
        @logout="auth.logout()"
        @toggle-collapsed="sidebarStore.toggleCollapsed()"
      />
    </div>

    <main
      class="flex min-w-0 flex-auto flex-col gap-6 px-4 pt-4 pb-6 md:gap-8 md:px-10 md:pt-8 md:pb-12"
    >
      <slot />
    </main>

    <MobileTabBar
      v-if="tabBar"
      class="sticky bottom-0 z-10 md:hidden"
      data-test="tab-bar"
      @more="menuOpen = true"
    />
  </div>
</template>
