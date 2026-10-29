<script setup lang="ts">
import BaseIcon from '@/components/BaseIcon.vue'

const { message } = defineProps<{
  message: string
}>()
</script>

<template>
  <p
    role="alert"
    class="flex items-start gap-2 rounded-md bg-ember-soft px-4 py-3 text-body text-ember-ink"
    data-test="form-error"
  >
    <BaseIcon name="circle-help" :size="18" class="mt-0.5" />
    {{ message }}
  </p>
</template>
