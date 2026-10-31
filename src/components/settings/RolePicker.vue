<script setup lang="ts">
import { computed } from 'vue'
import IconTile from '@/components/IconTile.vue'
import OptionCard from '@/components/OptionCard.vue'
import { roleOptions, type RoleOption } from '@/lib/settingsOptions'
import type { LearnerRole } from '@/stores/settings'

/** Null until you pick one. */
const role = defineModel<LearnerRole | null>({ required: true })

const picked = computed<RoleOption | undefined>(() =>
  roleOptions.find((option) => option.id === role.value),
)
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-2.5">
    <OptionCard
      v-for="option in roleOptions"
      :key="option.id"
      layout="stacked"
      :pressed="role === option.id"
      :data-test="`role-${option.id}`"
      @toggle="role = option.id"
    >
      <IconTile :icon="option.icon" :tint="option.tint" size="sm" />
      <span class="flex flex-col gap-0.5">
        <b class="text-[15px] leading-5 font-[650]">{{ option.name }}</b>
        <span class="text-caption font-normal text-ink-muted">{{ option.blurb }}</span>
      </span>
    </OptionCard>
  </div>

  <p
    class="rounded-md bg-surface-tint px-3.5 py-3 text-label font-normal text-ink"
    aria-live="polite"
    data-test="role-note"
  >
    <template v-if="picked">
      <b class="text-sprout-ink">{{ picked.tutorTitle }}</b> {{ picked.tutorText }}
    </template>
    <template v-else>Pick one, and the tutor adapts its tone and pace to you.</template>
  </p>
</template>
