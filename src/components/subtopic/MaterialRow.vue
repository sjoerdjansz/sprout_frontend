<script setup lang="ts">
import IconTile, { type Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'

const {
  icon,
  tint,
  highlighted = false,
  dimmed = false,
} = defineProps<{
  icon: IconName
  tint: Tint
  /** Expanded rows get a sunken ground, so their details read as part of them. */
  highlighted?: boolean
  /** A paused card fades back. */
  dimmed?: boolean
}>()
</script>

<!--
  One item in a tab of the subtopic page: icon tile, content, a meta column (status, dates) and
  the row's actions. On a narrow screen the meta and actions wrap under the content.
-->
<template>
  <li
    class="flex flex-wrap items-start gap-x-3.5 gap-y-2 rounded-md py-3 pr-2.5 pl-3.5 transition-colors duration-150 ease-default"
    :class="[
      highlighted ? 'bg-surface-sunken' : 'hover:bg-surface-sunken',
      { 'opacity-55': dimmed },
    ]"
  >
    <IconTile :icon="icon" :tint="tint" size="sm" />
    <div class="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
      <slot />
    </div>
    <div class="flex w-37.5 flex-none flex-col items-end gap-1 max-sm:items-start">
      <slot name="meta" />
    </div>
    <div class="flex flex-none items-center gap-0.5">
      <slot name="actions" />
    </div>
  </li>
</template>
