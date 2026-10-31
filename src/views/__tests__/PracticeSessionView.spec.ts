import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { makeFlashcard, makeQuestion } from '@/__tests__/materialFixtures'
import { makeSubtopic } from '@/__tests__/topicFixtures'
import type { PracticeMaterial, PracticeOptions, PracticeScope } from '@/lib/practiceSession'
import type { PracticeModeId } from '@/lib/practiceModes'
import { useAuthStore } from '@/stores/auth'
import { usePracticeStore } from '@/stores/practice'
import PracticeSessionView from '../PracticeSessionView.vue'

const photosynthesis = makeSubtopic()

const scope: PracticeScope = {
  topicId: 1,
  topicTitle: 'Biology',
  subtopic: photosynthesis,
  subtopics: [photosynthesis],
}

function material(): PracticeMaterial {
  return {
    flashcards: [
      makeFlashcard({ id: 1, front: 'First front', is_due: true }),
      makeFlashcard({ id: 2, front: 'Second front', is_due: true }),
    ],
    questions: [makeQuestion()],
  }
}

async function mountSession(modes: PracticeModeId[]): Promise<VueWrapper> {
  const practice = usePracticeStore()
  practice.material = material()
  const options: PracticeOptions = {
    modes,
    cardCount: 20,
    questionCount: 10,
    dueFirst: true,
    interleave: false,
  }
  practice.start(scope, options)
  await router.push('/practice/session')
  const wrapper = mount(PracticeSessionView, { global: { plugins: [router] } })
  await flushPromises()

  return wrapper
}

async function flipAndRate(wrapper: VueWrapper, rating: string): Promise<void> {
  await wrapper.get('[data-test="show-answer"]').trigger('click')
  await wrapper.get(`[data-test="rate-${rating}"]`).trigger('click')
}

function front(wrapper: VueWrapper): string {
  return wrapper.get('[data-test="flashcard-front"]').text()
}

describe('PracticeSessionView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends you to the setup without a plan', async () => {
    await router.push('/practice/session')
    mount(PracticeSessionView, { global: { plugins: [router] } })
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('practice')
  })

  it('shows the rating only after the flip, and brings a card rated again back later', async () => {
    const wrapper = await mountSession(['cards'])

    expect(wrapper.get('[data-test="session-title"]').text()).toBe('Photosynthesis')
    expect(wrapper.find('[data-test="rate-good"]').exists()).toBe(false)
    expect(front(wrapper)).toBe('First front')

    await flipAndRate(wrapper, 'again')
    expect(front(wrapper)).toBe('Second front')
    expect(wrapper.text()).toContain('That one comes back later in this session.')

    await flipAndRate(wrapper, 'good')
    expect(front(wrapper)).toBe('First front')
    expect(wrapper.get('[data-test="session-progress"]').text()).toBe('1 of 2')

    await flipAndRate(wrapper, 'hard')
    expect(wrapper.find('[data-test="session-done"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="done-headline"]').text()).toBe('That’s everything you planned.')
    expect(wrapper.get('[data-test="done-tile"]').text()).toContain('50%')
    expect(wrapper.get('[data-test="slipped"]').text()).toContain('First front')
  })

  it('flips with space and rates with 1–4', async () => {
    const wrapper = await mountSession(['cards'])

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    await flushPromises()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' }))
    await flushPromises()

    expect(front(wrapper)).toBe('Second front')
    expect(usePracticeStore().results[0]?.ratings[0]?.rating).toBe('good')
  })

  it('shows "next up" between the blocks of a mixed session', async () => {
    const wrapper = await mountSession(['cards', 'retrieval'])

    expect(wrapper.get('[data-test="session-progress"]').text()).toBe('Block 1 of 2 · 0 of 2')

    await wrapper.get('[data-test="finish-block"]').trigger('click')
    const nextUp = wrapper.get('[data-test="next-up"]')
    expect(nextUp.text()).toContain('Flashcards done.')
    expect(nextUp.text()).toContain('Retrieval quiz')
    expect(nextUp.text()).toContain('1 question')

    await wrapper.get('[data-test="skip-next"]').trigger('click')
    expect(wrapper.find('[data-test="session-done"]').exists()).toBe(true)
  })

  it('ends early with what you did so far', async () => {
    const wrapper = await mountSession(['cards', 'retrieval'])

    await flipAndRate(wrapper, 'good')
    await wrapper.get('[data-test="end-session"]').trigger('click')

    expect(wrapper.get('[data-test="done-headline"]').text()).toBe(
      'Good stop. Here’s what you did.',
    )
    expect(wrapper.text()).toContain('Not reached')
  })

  it('goes again with the same scope and modes', async () => {
    const wrapper = await mountSession(['cards'])
    await wrapper.get('[data-test="end-session"]').trigger('click')

    await wrapper.get('[data-test="done-again"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ modes: 'cards', subtopic: '101' })
  })
})
