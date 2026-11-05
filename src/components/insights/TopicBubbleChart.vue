<script setup lang="ts">
import { computed } from 'vue'
import type { Tint } from '@/components/IconTile.vue'
import { bubbleRadius, formatStudyTime, minutesAxisMax, type TopicBubble } from '@/lib/insights'
import { pluralize, topicAppearance } from '@/lib/topics'

const { bubbles, selectedId } = defineProps<{
  /** Only topics with study time or mastery; the card lists the others. */
  bubbles: TopicBubble[]
  selectedId: number | null
}>()

const emit = defineEmits<{
  select: [topicId: number]
}>()

// The plot inside a 640 × 360 view box, with room for the axis labels.
const plot = { left: 60, right: 620, top: 20, bottom: 320 }

// The topic's own tint, as on its tile, so a bubble is recognisable across the app.
const fillClasses: Record<Tint, string> = {
  mint: 'fill-sprout',
  sun: 'fill-sun',
  peach: 'fill-ember',
  sky: 'fill-sky-ink',
  gray: 'fill-line-strong',
  canvas: 'fill-sprout',
}

const axisMax = computed<number>(() => minutesAxisMax(bubbles.map((bubble) => bubble.minutes)))

const timeTicks = computed<{ x: number; label: string }[]>(() =>
  [0, 0.5, 1].map((share) => ({
    x: plot.left + share * (plot.right - plot.left),
    label: formatStudyTime(Math.round(axisMax.value * share)),
  })),
)

const masteryTicks = [0, 50, 100].map((percent) => ({
  y: plot.bottom - (percent / 100) * (plot.bottom - plot.top),
  label: `${percent}%`,
}))

interface PlacedBubble {
  bubble: TopicBubble
  cx: number
  cy: number
  r: number
  labelY: number
  fill: string
  label: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

// A bubble stays inside the plot, so one at 0 minutes or 0% rests against its axis; its name goes
// below it, or above when there's no room.
const placed = computed<PlacedBubble[]>(() =>
  bubbles.map((bubble) => {
    const r = bubbleRadius(bubble.cardCount)
    const x = plot.left + (bubble.minutes / axisMax.value) * (plot.right - plot.left)
    const y = plot.bottom - (bubble.mastery / 100) * (plot.bottom - plot.top)
    const cx = clamp(x, plot.left + r, plot.right - r)
    const cy = clamp(y, plot.top + r, plot.bottom - r)
    const below = cy + r + 14

    return {
      bubble,
      cx,
      cy,
      r,
      labelY: below <= plot.bottom - 4 ? below : cy - r - 6,
      fill: fillClasses[topicAppearance(bubble.topic).tint],
      label: `${bubble.title}: ${formatStudyTime(bubble.minutes)}, ${bubble.mastery}% mastery, ${pluralize(bubble.cardCount, 'card')}`,
    }
  }),
)
</script>

<template>
  <!-- Wide enough to read on a phone: the chart scrolls inside its card there. -->
  <div class="overflow-x-auto">
    <svg
      viewBox="0 0 640 360"
      class="block h-auto w-full min-w-120"
      role="group"
      aria-label="Topics by study time (across) and mastery (up); size is the number of cards"
    >
      <rect
        :x="plot.left"
        :y="plot.top"
        :width="plot.right - plot.left"
        :height="plot.bottom - plot.top"
        rx="12"
        class="fill-canvas"
      />
      <g class="text-[11px]" aria-hidden="true">
        <template v-for="tick in masteryTicks" :key="tick.label">
          <line
            :x1="plot.left"
            :x2="plot.right"
            :y1="tick.y"
            :y2="tick.y"
            class="stroke-line"
            stroke-dasharray="4 4"
          />
          <text :x="plot.left - 8" :y="tick.y + 4" text-anchor="end" class="fill-ink-subtle">
            {{ tick.label }}
          </text>
        </template>
        <text
          v-for="tick in timeTicks"
          :key="tick.label"
          :x="tick.x"
          :y="plot.bottom + 18"
          :text-anchor="tick.x === plot.left ? 'start' : tick.x === plot.right ? 'end' : 'middle'"
          class="fill-ink-subtle"
        >
          {{ tick.label }}
        </text>
        <text :x="plot.right" :y="plot.bottom + 36" text-anchor="end" class="fill-ink-subtle">
          study time →
        </text>
        <text :x="14" :y="plot.top - 6" class="fill-ink-subtle">mastery ↑</text>
        <line
          :x1="plot.left"
          :x2="plot.right"
          :y1="plot.bottom"
          :y2="plot.bottom"
          class="stroke-line-strong"
        />
        <line
          :x1="plot.left"
          :x2="plot.left"
          :y1="plot.top"
          :y2="plot.bottom"
          class="stroke-line-strong"
        />
      </g>

      <g
        v-for="item in placed"
        :key="item.bubble.id"
        role="button"
        tabindex="0"
        :aria-label="item.label"
        :aria-pressed="item.bubble.id === selectedId"
        class="cursor-pointer outline-none [&:focus-visible>circle]:stroke-focus [&:focus-visible>circle]:stroke-3"
        data-test="topic-bubble"
        @click="emit('select', item.bubble.id)"
        @keydown.enter.prevent="emit('select', item.bubble.id)"
        @keydown.space.prevent="emit('select', item.bubble.id)"
      >
        <title>{{ item.label }}</title>
        <!-- A topic without cards is an outline: there's nothing to size it by. -->
        <circle
          :cx="item.cx"
          :cy="item.cy"
          :r="item.r"
          :class="[
            item.bubble.cardCount === 0 ? 'fill-transparent stroke-line-strong' : item.fill,
            item.bubble.id === selectedId
              ? 'stroke-ink opacity-100'
              : 'opacity-75 hover:opacity-100',
          ]"
          :stroke-width="item.bubble.id === selectedId ? 2.5 : 1.5"
          :stroke-dasharray="item.bubble.cardCount === 0 ? '3 3' : undefined"
        />
        <text
          :x="item.cx"
          :y="item.labelY"
          text-anchor="middle"
          class="fill-ink text-xs font-[650]"
          aria-hidden="true"
        >
          {{ item.bubble.title }}
        </text>
      </g>
    </svg>
  </div>
</template>
