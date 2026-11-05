<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import IconTile, { type Tint } from '@/components/IconTile.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import type { IconName } from '@/components/icons'
import PlantArt from '@/components/insights/PlantArt.vue'
import SectionStatus from '@/components/insights/SectionStatus.vue'
import {
  leavesChangeText,
  periodPhrase,
  plantGrowth,
  plantStages,
  type PlantGrowth,
} from '@/lib/insights'
import { pluralize } from '@/lib/topics'
import type { InsightsPeriod, Leaves, SectionState } from '@/stores/insights'

const { leaves, period, state } = defineProps<{
  /** The selected period's leaves; null until they've loaded. */
  leaves: Leaves | null
  period: InsightsPeriod
  state: SectionState
}>()

const emit = defineEmits<{
  retry: []
}>()

interface Source {
  key: keyof Leaves['sources']
  /** What you did, with its count: "41 cards rated". */
  what: (count: number) => string
  worth: string
  icon: IconName
  tint: Tint
}

// What practice earns (`../API.md`, GET /insights `leaves`); the Done screen gives the same.
const sources: Source[] = [
  {
    key: 'cards',
    what: (count) => `${pluralize(count, 'card')} rated`,
    worth: '1 leaf each',
    icon: 'layers',
    tint: 'mint',
  },
  {
    key: 'questions',
    what: (count) => `${pluralize(count, 'quiz question')} answered`,
    worth: '2 leaves each',
    icon: 'list-checks',
    tint: 'sky',
  },
  {
    key: 'explanations',
    what: (count) => `${pluralize(count, 'explanation')} checked`,
    worth: '10 leaves each',
    icon: 'lightbulb',
    tint: 'sun',
  },
]

const growth = computed<PlantGrowth>(() => plantGrowth(leaves?.total ?? 0))

const changeText = computed<string | null>(() =>
  leaves === null ? null : leavesChangeText(period, leaves.change),
)
</script>

<template>
  <BaseCard role="region" aria-labelledby="leaves-heading" class="flex flex-col gap-4">
    <h2 id="leaves-heading" class="sr-only">Leaves</h2>

    <SectionStatus
      :loading="state.loading || leaves === null"
      :error="state.error"
      name="leaves"
      @retry="emit('retry')"
    >
      <div v-if="leaves" class="flex flex-wrap items-stretch gap-7">
        <div class="flex min-w-0 flex-[1_1_320px] flex-wrap items-center gap-5">
          <PlantArt
            :stage-index="growth.stageIndex"
            :label="`Your plant is a ${growth.stage.name.toLowerCase()}`"
          />

          <div class="flex min-w-0 flex-1 flex-col gap-2.5">
            <p class="flex items-baseline gap-2.5">
              <span
                class="font-display text-[44px] leading-12 font-semibold tracking-[-0.03em] text-ink tabular-nums"
                data-test="leaves-total"
              >
                {{ leaves.total.toLocaleString('en-US') }}
              </span>
              <span class="inline-flex items-center gap-1 text-body-strong text-sprout-ink">
                <BaseIcon name="sprout" :size="16" />
                leaves
              </span>
            </p>

            <p class="text-sm text-ink-muted" data-test="leaves-earned">
              <b class="text-ink">+{{ leaves.earned }}</b> {{ periodPhrase[period] }}
              <template v-if="changeText">({{ changeText }})</template>
            </p>

            <ProgressBar
              :value="growth.progress"
              :max="growth.span"
              :label="growth.next ? `Next: ${growth.next.name}` : 'Fully grown'"
              :value-text="
                growth.next ? `${growth.next.from - leaves.total} to ${growth.next.name}` : 'Tree'
              "
              tone="sun"
              size="sm"
            />

            <ul class="flex flex-wrap gap-1.5" aria-label="Stages">
              <li
                v-for="(stage, index) in plantStages"
                :key="stage.name"
                class="inline-flex items-center rounded-full px-2 py-0.75 text-[11px] font-bold"
                :class="
                  index <= growth.stageIndex
                    ? 'bg-sprout-soft text-sprout-ink'
                    : 'bg-surface-sunken text-ink-subtle'
                "
              >
                {{ stage.name }} · {{ stage.from }}
              </li>
            </ul>
          </div>
        </div>

        <div class="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5">
          <div class="flex items-baseline justify-between gap-3">
            <h3 class="text-label text-ink">How you earn leaves</h3>
            <span class="text-label font-normal text-ink-subtle">{{ periodPhrase[period] }}</span>
          </div>

          <ul class="flex flex-col gap-2.5">
            <li
              v-for="source in sources"
              :key="source.key"
              class="flex items-center gap-3 text-sm text-ink"
              :data-test="`leaves-${source.key}`"
            >
              <IconTile :icon="source.icon" :tint="source.tint" size="sm" />
              <span class="min-w-0 flex-1">
                {{ source.what(leaves.sources[source.key].count) }}
                <span class="text-ink-subtle">· {{ source.worth }}</span>
              </span>
              <b class="font-display text-sprout-ink tabular-nums">
                +{{ leaves.sources[source.key].leaves }}
              </b>
            </li>
          </ul>
        </div>
      </div>
    </SectionStatus>
  </BaseCard>
</template>
