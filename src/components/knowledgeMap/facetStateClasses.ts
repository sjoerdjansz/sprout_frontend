import type { FacetState } from '@/lib/knowledgeMap'

/** Solid sprout once a facet holds, soft while you're practising it, sunken before you start. */
export const facetStateClasses: Record<FacetState, string> = {
  holding: 'bg-sprout text-on-sprout',
  started: 'bg-sprout-soft text-sprout-ink',
  'not-started': 'bg-surface-sunken text-ink-subtle',
}
