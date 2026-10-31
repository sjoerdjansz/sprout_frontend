<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import FormError from '@/components/FormError.vue'
import StatTile from '@/components/StatTile.vue'
import SettingsCard from '@/components/settings/SettingsCard.vue'
import { usageKinds, usagePeriod } from '@/lib/settingsOptions'
import type { AiUsage } from '@/stores/settings'

const { usage, error = null } = defineProps<{
  /** Null while it loads. */
  usage: AiUsage | null
  error?: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<!-- No bar or limit yet: there's no monthly allowance (see ../specs/settings.md, To do later). -->
<template>
  <SettingsCard title="Usage this month">
    <template #aside>
      <span v-if="usage" class="text-label font-normal text-ink-subtle" data-test="usage-period">
        {{ usagePeriod(usage.month) }}
      </span>
    </template>

    <div v-if="error" class="flex flex-col items-start gap-3">
      <FormError :message="error" />
      <BaseButton variant="secondary" size="sm" icon="rotate-ccw" @click="emit('retry')">
        Try again
      </BaseButton>
    </div>

    <p v-else-if="usage === null" class="text-ink-muted" aria-live="polite">
      Counting your AI calls…
    </p>

    <template v-else>
      <p class="flex items-baseline gap-2">
        <span class="font-display text-stat text-ink tabular-nums" data-test="usage-total">
          {{ usage.total }}
        </span>
        <span class="text-body text-ink-muted">AI calls so far</span>
      </p>
      <div class="grid grid-cols-[repeat(auto-fit,minmax(min(170px,100%),1fr))] gap-3">
        <StatTile
          v-for="kind in usageKinds"
          :key="kind.key"
          :label="kind.label"
          :value="String(usage[kind.key])"
          :icon="kind.icon"
          :tint="kind.tint"
          :hint="kind.hint"
          :data-test="`usage-${kind.key}`"
        />
      </div>
      <p class="text-label font-normal text-ink-subtle">
        One AI call is one time Sprout’s AI worked for you, counted per kind.
      </p>
    </template>
  </SettingsCard>
</template>
