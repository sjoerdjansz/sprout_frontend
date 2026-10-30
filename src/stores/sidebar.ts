import { ref } from 'vue'
import { defineStore } from 'pinia'

// Every page renders its own AppLayout, so the choice is kept here and in localStorage rather
// than in the layout: it survives moving between pages and reloading.
const collapsedKey = 'sprout.sidebarCollapsed'

export const useSidebarStore = defineStore('sidebar', () => {
  const collapsed = ref<boolean>(localStorage.getItem(collapsedKey) === 'true')

  function toggleCollapsed(): void {
    collapsed.value = !collapsed.value
    localStorage.setItem(collapsedKey, String(collapsed.value))
  }

  return { collapsed, toggleCollapsed }
})
