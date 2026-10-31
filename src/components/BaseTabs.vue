<script setup lang="ts" generic="Id extends string">
import { useTemplateRef } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'

export interface TabItem<ItemId extends string = string> {
  id: ItemId
  label: string
  icon?: IconName
  /** Shown in a small pill after the label. */
  count?: number
}

const { items, label } = defineProps<{
  items: TabItem<Id>[]
  /** Names the tablist for screen readers ("Materials"). */
  label: string
}>()

const selected = defineModel<Id>({ required: true })

const tabs = useTemplateRef<HTMLButtonElement[]>('tabs')

// Arrow keys move between tabs (and select them), as the ARIA tabs pattern expects.
function moveFocus(event: KeyboardEvent, index: number): void {
  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (step === 0) {
    return
  }
  event.preventDefault()

  const nextIndex = (index + step + items.length) % items.length
  const nextItem = items[nextIndex]
  if (nextItem === undefined) {
    return
  }
  selected.value = nextItem.id
  tabs.value?.[nextIndex]?.focus()
}
</script>

<template>
  <div
    role="tablist"
    :aria-label="label"
    class="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-surface-sunken p-1"
  >
    <button
      v-for="(item, index) in items"
      :key="item.id"
      ref="tabs"
      type="button"
      role="tab"
      :aria-selected="selected === item.id"
      :tabindex="selected === item.id ? 0 : -1"
      class="inline-flex h-9.5 flex-none cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-label transition duration-200 ease-default"
      :class="
        selected === item.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
      "
      :data-test="`tab-${item.id}`"
      @click="selected = item.id"
      @keydown="moveFocus($event, index)"
    >
      <BaseIcon v-if="item.icon" :name="item.icon" :size="16" />
      {{ item.label }}
      <span
        v-if="item.count !== undefined"
        class="inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold"
        :class="
          selected === item.id
            ? 'bg-sprout-soft text-sprout-ink'
            : 'bg-surface-sunken text-ink-muted'
        "
        data-test="tab-count"
      >
        {{ item.count }}
      </span>
    </button>
  </div>
</template>
