<script setup lang="ts">
import SectionHeading from '@/components/SectionHeading.vue'
import StatTile from '@/components/StatTile.vue'
import TextLink from '@/components/TextLink.vue'
import type { Tint } from '@/components/IconTile.vue'
import type { IconName } from '@/components/icons'

export interface WeeklyStat {
  label: string
  value: string
  unit?: string
  hint: string
  icon: IconName
  tint: Tint
}

const { stats } = defineProps<{
  stats: WeeklyStat[]
}>()
</script>

<template>
  <section aria-labelledby="insights-heading" class="flex flex-col gap-4">
    <SectionHeading title="This week" heading-id="insights-heading">
      <TextLink>See all insights</TextLink>
    </SectionHeading>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
      <StatTile
        v-for="stat in stats"
        :key="stat.label"
        :label="stat.label"
        :value="stat.value"
        :unit="stat.unit"
        :hint="stat.hint"
        :icon="stat.icon"
        :tint="stat.tint"
      />
    </div>
  </section>
</template>
