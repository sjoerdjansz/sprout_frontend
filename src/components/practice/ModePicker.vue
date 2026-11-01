<script setup lang="ts">
import { computed } from 'vue'
import IconTile from '@/components/IconTile.vue'
import OptionCard from '@/components/OptionCard.vue'
import { practiceModes, type PracticeModeId } from '@/lib/practiceModes'
import { mixableModes } from '@/lib/practiceSession'

const { unavailable } = defineProps<{
  /** Why a mode can't run on the scope you picked; modes that can run aren't in it. */
  unavailable: Partial<Record<PracticeModeId, string>>
}>()

/** In the order you picked them; the session puts them in its own order. */
const selected = defineModel<PracticeModeId[]>({ required: true })

const availableIds = computed<PracticeModeId[]>(() =>
  practiceModes.map((mode) => mode.id).filter((id) => unavailable[id] === undefined),
)

// The open session has no end, so the mix leaves it to its own toggle.
const mixIds = computed<PracticeModeId[]>(() => mixableModes(availableIds.value))

const isMixed = computed<boolean>(
  () => mixIds.value.length > 1 && mixIds.value.every((id) => selected.value.includes(id)),
)

// Every mode switches off, the last one too; the summary then asks you to pick one.
function toggle(id: PracticeModeId): void {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((selectedId) => selectedId !== id)
    : [...selected.value, id]
}

// Switching the mix off leaves the first mode, so you're never left with nothing chosen. The
// open session stays as you set it either way.
function toggleMix(): void {
  const first = mixIds.value[0]
  const open: PracticeModeId[] = selected.value.includes('open') ? ['open'] : []
  selected.value =
    isMixed.value && first !== undefined ? [first, ...open] : [...mixIds.value, ...open]
}
</script>

<template>
  <!-- Fixed columns per width, not auto-fit: the mix spans two of them, which only lines up when
       the column count is known. Sized to the container, as the page beside it may be narrow. -->
  <div class="@container">
    <div class="grid grid-cols-1 gap-2.5 @md:grid-cols-2 @2xl:grid-cols-3">
      <OptionCard
        v-for="mode in practiceModes"
        :key="mode.id"
        :pressed="selected.includes(mode.id)"
        :disabled="unavailable[mode.id] !== undefined"
        :data-test="`mode-${mode.id}`"
        @toggle="toggle(mode.id)"
      >
        <IconTile :icon="mode.icon" :tint="mode.tint" />
        <span class="flex min-w-0 flex-col">
          <b class="text-body-strong">{{ mode.name }}</b>
          <span class="text-caption font-normal text-ink-muted">
            {{ unavailable[mode.id] ?? mode.blurb }}
          </span>
        </span>
      </OptionCard>

      <OptionCard
        :pressed="isMixed"
        :disabled="mixIds.length < 2"
        class="@md:col-span-2"
        data-test="mode-mix"
        @toggle="toggleMix"
      >
        <IconTile icon="shuffle" tint="gray" />
        <span class="flex min-w-0 flex-col">
          <b class="text-body-strong">Mix it all</b>
          <span class="text-caption font-normal text-ink-muted">
            Every way to practise in one session. You can add or omit the open session.
          </span>
        </span>
      </OptionCard>
    </div>
  </div>
</template>
