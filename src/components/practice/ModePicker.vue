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

// A session needs at least one mode, so the last one can't be switched off.
function toggle(id: PracticeModeId): void {
  if (!selected.value.includes(id)) {
    selected.value = [...selected.value, id]
  } else if (selected.value.length > 1) {
    selected.value = selected.value.filter((selectedId) => selectedId !== id)
  }
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
  <div class="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-2.5">
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
      class="col-span-full"
      data-test="mode-mix"
      @toggle="toggleMix"
    >
      <IconTile icon="shuffle" tint="peach" />
      <span class="flex min-w-0 flex-col">
        <b class="text-body-strong">Mix it all</b>
        <span class="text-caption font-normal text-ink-muted">
          Every way to practise in one session, one after the other. The open session you add
          yourself.
        </span>
      </span>
    </OptionCard>
  </div>
</template>
