<script setup lang="ts">
import BaseBadge from '@/components/BaseBadge.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import SproutLogo from '@/components/SproutLogo.vue'
import LeafPair from '@/components/auth/LeafPair.vue'

// A static 64% mastery ring: 56px wide with a 6px stroke.
const ringRadius = 25
const ringCircumference = 2 * Math.PI * ringRadius
const ringOffset = ringCircumference * (1 - 0.64)
</script>

<template>
  <section
    aria-label="What Sprout does"
    class="relative flex min-h-75 min-w-0 flex-[1_1_520px] flex-col justify-between gap-8 overflow-hidden rounded-xl bg-deep-forest p-10 md:min-h-197"
  >
    <SproutLogo reversed class="relative z-10" />

    <!-- A peek at the app: decoration only, hidden on small screens. -->
    <div aria-hidden="true" class="relative hidden min-h-95 grow md:block">
      <div class="absolute top-[2%] right-[6%] size-18 rounded-full bg-sunbeam" />
      <LeafPair
        :width="96"
        left-leaf="fill-muted-teal"
        right-leaf="fill-honeydew"
        class="absolute top-[58%] left-[2%]"
      />
      <LeafPair
        :width="56"
        left-leaf="fill-honeydew"
        right-leaf="fill-muted-teal"
        class="absolute top-[4%] left-[58%]"
      />
      <LeafPair
        :width="72"
        left-leaf="fill-muted-teal"
        right-leaf="fill-muted-teal"
        class="absolute right-[10%] bottom-[6%]"
      />

      <div
        class="absolute top-[8%] left-[6%] flex w-75 -rotate-4 flex-col gap-3.5 rounded-xl bg-surface px-5.5 py-5 shadow-lg"
      >
        <div class="flex items-center justify-between">
          <BaseBadge tone="sprout" icon="layers">Flashcards</BaseBadge>
          <span class="text-caption font-semibold text-ink-subtle">4 / 12</span>
        </div>
        <p class="font-display text-title font-medium text-ink">What does chlorophyll absorb?</p>
        <span class="text-caption text-ink-subtle">Tap to flip</span>
      </div>

      <div
        class="absolute top-[46%] right-[4%] flex w-85 rotate-3 items-center gap-3 rounded-lg border border-line bg-surface py-3 pr-4 pl-3 shadow-lg"
      >
        <span
          class="inline-grid size-11 flex-none place-items-center rounded-md bg-sun-soft text-sun-ink"
        >
          <BaseIcon name="flame" :size="22" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-body-strong text-ink">+20 XP · 6-day streak!</p>
          <p class="text-label font-normal text-ink-muted">You reviewed every card that was due.</p>
        </div>
      </div>

      <div
        class="absolute bottom-[4%] left-[16%] flex -rotate-2 items-center gap-3.5 rounded-lg bg-surface py-3.5 pr-5 pl-3.5 shadow-md"
      >
        <div class="relative grid size-14 place-items-center">
          <svg width="56" height="56" viewBox="0 0 56 56" class="-rotate-90">
            <circle
              class="stroke-surface-sunken"
              cx="28"
              cy="28"
              :r="ringRadius"
              fill="none"
              stroke-width="6"
            />
            <circle
              class="stroke-sprout"
              cx="28"
              cy="28"
              :r="ringRadius"
              fill="none"
              stroke-width="6"
              stroke-linecap="round"
              :stroke-dasharray="ringCircumference"
              :stroke-dashoffset="ringOffset"
            />
          </svg>
          <span class="absolute font-display text-[13px] font-semibold text-ink">64%</span>
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-heading text-[15px] text-ink">Photosynthesis</span>
          <span class="text-caption font-normal text-ink-muted">18 of 32 cards stable</span>
        </div>
      </div>
    </div>

    <div class="relative z-10 flex max-w-120 flex-col gap-3">
      <h2 class="font-display text-display text-honeydew lg:text-display-xl">
        Learn anything.<br />Keep it for good.
      </h2>
      <p class="text-body-lg text-muted-teal">
        Your own AI tutor, with flashcards, quizzes and spaced repetition built in.
      </p>
    </div>
  </section>
</template>
