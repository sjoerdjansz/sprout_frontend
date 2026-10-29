<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'
import type { IconName } from '@/components/icons'
import type { Interest } from '@/stores/auth'

interface InterestOption {
  id: Interest
  label: string
  icon: IconName
}

const { error } = defineProps<{
  error?: string
}>()

const options: InterestOption[] = [
  { id: 'languages', label: 'Languages', icon: 'message-circle' },
  { id: 'science', label: 'Science', icon: 'sprout' },
  { id: 'coding', label: 'Coding', icon: 'list-checks' },
  { id: 'history', label: 'History', icon: 'book-open' },
  { id: 'maths', label: 'Maths', icon: 'chart-no-axes-column' },
  { id: 'other', label: 'Something else', icon: 'sparkles' },
]

/** The ids of the picked interests. */
const picked = defineModel<Interest[]>({ required: true })

function toggle(id: Interest): void {
  picked.value = picked.value.includes(id)
    ? picked.value.filter((pickedId) => pickedId !== id)
    : [...picked.value, id]
}
</script>

<template>
  <fieldset class="flex flex-col gap-2.5">
    <legend class="mb-2.5 text-label text-ink">
      What are you curious about?
      <span class="font-medium text-ink-subtle">Pick a few, or skip</span>
    </legend>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="interest in options"
        :key="interest.id"
        type="button"
        :aria-pressed="picked.includes(interest.id)"
        class="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-label transition-colors duration-150"
        :class="
          picked.includes(interest.id)
            ? 'border-primary bg-primary text-on-primary'
            : 'border-line bg-canvas text-ink-muted hover:border-transparent hover:bg-sprout-soft hover:text-sprout-ink'
        "
        :data-test="`interest-${interest.id}`"
        @click="toggle(interest.id)"
      >
        <BaseIcon :name="picked.includes(interest.id) ? 'check' : interest.icon" :size="15" />
        {{ interest.label }}
      </button>
    </div>

    <p v-if="error" class="flex items-center gap-1 text-caption text-ember-ink">
      <BaseIcon name="circle-help" :size="14" />
      {{ error }}
    </p>
  </fieldset>
</template>
