<script setup lang="ts">
import { computed, onMounted, ref, useSlots } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { ApiError } from '@/lib/api'
import { initials } from '@/lib/names'
import { useAuthStore } from '@/stores/auth'
import { useConversationsStore } from '@/stores/conversations'

const { asideLabel } = defineProps<{
  /** Names the aside for screen readers ("Topic details"); only used with the `aside` slot. */
  asideLabel?: string
}>()

const auth = useAuthStore()
const slots = useSlots()
const conversationsStore = useConversationsStore()

const userName = computed<string>(() => auth.user?.name ?? '')
const historyError = ref<string | null>(null)

// A page with an aside (the knowledge map's detail panel) fits the viewport on wide screens:
// its panels scroll inside, like an app. Below the rail breakpoint the aside sits under the page.
const hasAside = computed<boolean>(() => slots.aside !== undefined)

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
  <div
    class="grid min-h-svh grid-cols-[232px_minmax(0,1fr)]"
    :class="{ 'rail:grid-cols-[232px_minmax(0,1fr)_380px]': hasAside }"
  >
    <AppSidebar
      :user-name="userName"
      :user-initials="initials(userName)"
      :conversations="conversationsStore.conversations"
      :history-error="historyError"
      class="sticky top-0 h-svh overflow-y-auto"
      @logout="auth.logout()"
    />

    <!-- Under the rail breakpoint the aside stacks below the page; from it, `contents` lets main
         and aside each take their own grid column. -->
    <div class="flex min-w-0 flex-col" :class="{ 'rail:contents': hasAside }">
      <main
        class="flex min-w-0 flex-col"
        :class="
          hasAside
            ? 'gap-4 px-6 pt-6 pb-6 rail:h-svh rail:overflow-hidden rail:pl-8'
            : 'flex-auto gap-8 px-10 pt-8 pb-12'
        "
      >
        <slot />
      </main>

      <aside
        v-if="hasAside"
        :aria-label="asideLabel"
        class="flex min-w-0 flex-col border-t border-line bg-surface rail:sticky rail:top-0 rail:h-svh rail:border-t-0 rail:border-l"
      >
        <slot name="aside" />
      </aside>
    </div>
  </div>
</template>
