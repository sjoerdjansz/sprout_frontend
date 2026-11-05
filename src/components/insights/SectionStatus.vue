<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import FormError from '@/components/FormError.vue'

const { loading, error, name } = defineProps<{
  loading: boolean
  /** Why loading failed, from the API; shown with a retry. */
  error: string | null
  /** Names the part of the page in `data-test` ("activity" gives "activity-error"). */
  name: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div>
    <!-- An error wins, so a part that failed says so instead of looking like it's still coming. -->
    <div v-if="error !== null" class="flex flex-col items-start gap-3" :data-test="`${name}-error`">
      <FormError :message="error" />
      <BaseButton
        variant="secondary"
        size="sm"
        icon="rotate-ccw"
        :data-test="`${name}-retry`"
        @click="emit('retry')"
      >
        Try again
      </BaseButton>
    </div>

    <div v-else-if="loading" :data-test="`${name}-loading`">
      <span class="sr-only" role="status">Loading…</span>
      <!-- The part's own skeleton, shaped like what's coming; a few lines by default. -->
      <slot name="skeleton">
        <div class="flex flex-col gap-3" aria-hidden="true">
          <div class="h-5 w-2/3 rounded-sm bg-surface-sunken motion-safe:animate-pulse" />
          <div class="h-28 rounded-md bg-surface-sunken motion-safe:animate-pulse" />
        </div>
      </slot>
    </div>

    <slot v-else />
  </div>
</template>
