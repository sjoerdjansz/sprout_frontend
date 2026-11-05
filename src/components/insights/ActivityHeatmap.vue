<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import IconTile from '@/components/IconTile.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import SectionStatus from '@/components/insights/SectionStatus.vue'
import {
  activityRange,
  dayDetail,
  dayName,
  heatmap,
  weekdayName,
  type HeatLevel,
  type Heatmap,
} from '@/lib/insights'
import { pluralize } from '@/lib/topics'
import type { Activity, ActivityDay, SectionState } from '@/stores/insights'

const { activity, state } = defineProps<{
  /** Null until it has loaded. */
  activity: Activity | null
  state: SectionState
}>()

const emit = defineEmits<{
  retry: []
}>()

// Sunken for no practice, then from the soft to the solid green: darker means more in light,
// brighter in dark. Every practice day also has its numbers in its label, not just a colour.
const levelClasses: Record<HeatLevel, string> = {
  0: 'bg-surface-sunken',
  1: 'bg-sprout-soft',
  2: 'bg-sprout/55',
  3: 'bg-sprout',
  4: 'bg-primary',
}
const levels: HeatLevel[] = [0, 1, 2, 3, 4]

// One column per week, 13px cells with a 3px gap.
const columnWidth = 16

const grid = computed<Heatmap | null>(() => (activity ? heatmap(activity) : null))

const title = computed<string>(() => {
  const days = activity?.summary.active_days ?? 0

  return `${pluralize(days, 'practice day')} in the last year`
})

// The day whose numbers show below the grid: the one you pick, or else your latest.
const selectedDate = ref<string | null>(null)
const selectedDay = computed<ActivityDay | null>(() => {
  const days = activity?.days ?? []

  return days.find((day) => day.date === selectedDate.value) ?? days[days.length - 1] ?? null
})

// At phone width the year scrolls inside the card; start at today's end, where your practice is.
const scroller = useTemplateRef<HTMLDivElement>('scroller')
watch(
  grid,
  async () => {
    await nextTick()
    if (scroller.value) {
      scroller.value.scrollLeft = scroller.value.scrollWidth
    }
  },
  { immediate: true },
)
</script>

<template>
  <BaseCard role="region" aria-labelledby="activity-heading" class="flex flex-col gap-4">
    <SectionHeading :title="activity ? title : 'Your practice days'" heading-id="activity-heading">
      <span v-if="activity" class="text-label font-normal text-ink-subtle">
        {{ activityRange(activity) }}
      </span>
    </SectionHeading>

    <SectionStatus
      :loading="state.loading || activity === null"
      :error="state.error"
      name="activity"
      @retry="emit('retry')"
    >
      <div v-if="activity && grid" class="flex flex-col gap-4">
        <div ref="scroller" class="overflow-x-auto pb-1">
          <div class="flex w-max flex-col gap-1">
            <!-- Month names over the week in which each month starts. -->
            <div class="relative h-3.5 text-[11px] text-ink-subtle" aria-hidden="true">
              <span
                v-for="month in grid.months"
                :key="`${month.label}-${month.column}`"
                class="absolute"
                :style="{ left: `${34 + month.column * columnWidth}px` }"
              >
                {{ month.label }}
              </span>
            </div>

            <div
              class="flex gap-0.75"
              role="group"
              :aria-label="`Practice days, ${activityRange(activity)}`"
            >
              <div
                class="flex w-7.75 flex-col gap-0.75 text-[11px] leading-3.25 text-ink-subtle"
                aria-hidden="true"
              >
                <span class="h-3.25">Mon</span>
                <span class="h-3.25" />
                <span class="h-3.25">Wed</span>
                <span class="h-3.25" />
                <span class="h-3.25">Fri</span>
                <span class="h-3.25" />
                <span class="h-3.25" />
              </div>

              <div
                v-for="(week, column) in grid.weeks"
                :key="column"
                class="flex flex-col gap-0.75"
              >
                <template v-for="(cell, row) in week.cells" :key="row">
                  <span v-if="cell === null" class="size-3.25" />
                  <!-- Practice days are buttons, so their numbers reach the keyboard and touch. -->
                  <button
                    v-else-if="cell.day"
                    type="button"
                    class="size-3.25 cursor-pointer rounded-[3px] hover:outline-2 hover:outline-offset-1 hover:outline-line-strong focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
                    :class="[
                      levelClasses[cell.level],
                      {
                        'ring-2 ring-primary ring-offset-1 ring-offset-surface':
                          selectedDay?.date === cell.date,
                      },
                    ]"
                    :aria-label="cell.label"
                    :aria-pressed="selectedDay?.date === cell.date"
                    :title="cell.label"
                    :data-level="cell.level"
                    data-test="activity-day"
                    @click="selectedDate = cell.date"
                  />
                  <span
                    v-else
                    class="size-3.25 rounded-[3px]"
                    :class="levelClasses[0]"
                    :title="cell.label"
                    aria-hidden="true"
                  />
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <p
            class="flex items-center gap-3 text-sm"
            aria-live="polite"
            data-test="activity-selected"
          >
            <IconTile icon="calendar-check" tint="mint" size="sm" />
            <span v-if="selectedDay">
              <b class="text-ink">{{ dayName(selectedDay.date) }}</b>
              <span class="text-ink-muted"> · {{ dayDetail(selectedDay) }}</span>
            </span>
            <span v-else class="text-ink-muted">Your practice days will show up here.</span>
          </p>

          <div class="flex items-center gap-1 text-[11px] text-ink-subtle" aria-hidden="true">
            Less
            <span
              v-for="level in levels"
              :key="level"
              class="size-3.25 rounded-[3px]"
              :class="levelClasses[level]"
            />
            More
          </div>
        </div>

        <ul
          v-if="activity.summary.active_days > 0"
          class="flex flex-wrap gap-x-7 gap-y-2 border-t border-line pt-3 text-sm text-ink-muted"
          data-test="activity-summary"
        >
          <li>
            <b class="text-ink">{{ activity.summary.active_days }}</b> active
            {{ activity.summary.active_days === 1 ? 'day' : 'days' }}
          </li>
          <li>
            <b class="text-ink">{{ pluralize(activity.summary.longest_streak_days, 'day') }}</b>
            longest streak
          </li>
          <li v-if="activity.summary.average_minutes_per_active_day !== null">
            <b class="text-ink">{{ activity.summary.average_minutes_per_active_day }} min</b>
            per active day
          </li>
          <li v-if="activity.summary.best_weekday !== null">
            <b class="text-ink">{{ weekdayName(activity.summary.best_weekday) }}</b> is your best
            day
          </li>
        </ul>
      </div>
    </SectionStatus>
  </BaseCard>
</template>
