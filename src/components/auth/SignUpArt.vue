<script setup lang="ts">
import BaseBadge from '@/components/BaseBadge.vue'
import BaseIcon from '@/components/BaseIcon.vue'
import LeafPair from '@/components/auth/LeafPair.vue'
</script>

<template>
  <section
    aria-label="A peek inside Sprout"
    class="relative flex min-h-70 min-w-0 flex-[1_1_520px] flex-col justify-between gap-8 overflow-hidden rounded-xl bg-sunbeam p-10 md:min-h-217"
  >
    <div class="relative z-10 flex max-w-115 flex-col gap-2.5">
      <span class="text-overline text-deep-forest">HOW SPROUT TEACHES</span>
      <h2 class="font-display text-title-lg text-onyx md:text-display">
        Guess first. Explain it back. See it again right before you forget.
      </h2>
    </div>

    <!-- A peek at a study session: decoration only, hidden on small screens. -->
    <div aria-hidden="true" class="relative hidden min-h-110 grow md:block">
      <LeafPair
        :width="120"
        left-leaf="fill-deep-forest"
        right-leaf="fill-muted-teal"
        class="absolute bottom-[4%] left-[4%]"
      />
      <LeafPair
        :width="64"
        left-leaf="fill-deep-forest"
        right-leaf="fill-deep-forest"
        class="absolute top-[6%] right-[8%]"
      />

      <div
        class="absolute top-[4%] left-[4%] flex w-105 max-w-[88%] -rotate-2 flex-col gap-4 rounded-xl bg-canvas p-5 shadow-lg"
      >
        <div class="flex items-end gap-3">
          <span
            class="grid size-8 flex-none place-items-center rounded-full bg-primary text-on-primary"
          >
            <BaseIcon name="sprout" :size="18" />
          </span>
          <div class="flex flex-col items-start gap-1.5">
            <BaseBadge tone="sky" icon="brain">Retrieval practice</BaseBadge>
            <p class="rounded-lg rounded-bl-xs bg-surface-tint px-5 py-3.5 text-body-lg text-ink">
              Before I explain: what do you think keeps the Moon in orbit?
            </p>
          </div>
        </div>
        <div class="flex flex-row-reverse items-end gap-3">
          <span
            class="grid size-8 flex-none place-items-center rounded-full bg-sun text-label font-bold text-on-sun"
          >
            SJ
          </span>
          <p
            class="rounded-lg rounded-br-xs border border-line bg-surface px-5 py-3.5 text-body-lg text-ink shadow-sm"
          >
            Gravity? But then why doesn’t it fall?
          </p>
        </div>
      </div>

      <div
        class="absolute top-[58%] right-[4%] flex w-80 rotate-3 flex-col gap-3 rounded-lg bg-surface px-5 py-4.5 shadow-md"
      >
        <div class="flex items-center justify-between">
          <span class="text-heading text-[15px] text-ink">Due for review</span>
          <BaseBadge tone="sun" icon="repeat">12 cards</BaseBadge>
        </div>
        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between text-label">
            <span class="text-ink">Daily goal</span>
            <span class="text-ink-muted tabular-nums">8 / 20</span>
          </div>
          <div class="h-2.5 overflow-hidden rounded-full bg-surface-sunken">
            <div class="h-full w-2/5 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
