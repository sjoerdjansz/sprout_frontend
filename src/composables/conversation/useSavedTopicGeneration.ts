import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { useGenerationPolling } from '@/composables/useGenerationPolling'
import type { SaveResult } from '@/stores/conversations'
import { useTopicsStore, type GenerationStatus } from '@/stores/topics'

/**
 * After saving a conversation, its subtopics' cards are made in the background: how many are still
 * generating or failed, asked again through `GET /topics` until none is generating.
 */
export function useSavedTopicGeneration(saveResult: Ref<SaveResult | null>): {
  generatingCount: ComputedRef<number>
  failedCount: ComputedRef<number>
  /** Why asking for the status failed; Sprout keeps asking. */
  checkError: Ref<string | null>
} {
  const topicsStore = useTopicsStore()

  // From the save itself, then from each ask. Not from the store's library straight away: that
  // can be from before the save.
  const statuses = ref<GenerationStatus[]>([])

  watch(saveResult, (result) => {
    statuses.value = result?.topic.subtopics.map((subtopic) => subtopic.generation_status) ?? []
  })

  const generatingCount = computed<number>(
    () => statuses.value.filter((status) => status === 'generating').length,
  )
  const failedCount = computed<number>(
    () => statuses.value.filter((status) => status === 'failed').length,
  )

  async function refresh(): Promise<void> {
    const topicId = saveResult.value?.topic.id
    await topicsStore.fetchTopics()
    // A topic deleted in the meantime has nothing left to wait for.
    const topic = topicsStore.topics.find((candidate) => candidate.id === topicId)
    statuses.value = topic?.subtopics.map((subtopic) => subtopic.generation_status) ?? []
  }

  const { error: checkError } = useGenerationPolling(() => generatingCount.value > 0, refresh)

  return { generatingCount, failedCount, checkError }
}
