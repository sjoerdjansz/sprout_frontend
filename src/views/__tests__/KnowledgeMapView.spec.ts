import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { stubApi } from '@/__tests__/stubApi'
import { useAuthStore, type User } from '@/stores/auth'
import KnowledgeMapView from '../KnowledgeMapView.vue'

const user: User = {
  id: 1,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  email_verified_at: '2026-10-29T12:00:00.000000Z',
  interests: ['science'],
  wants_daily_reminder: true,
  created_at: '2026-10-29T12:00:00.000000Z',
}

async function mountKnowledgeMap(): Promise<VueWrapper> {
  // The sidebar loads you and your chat history; the library itself is demo data for now.
  stubApi({ 'GET /user': Response.json(user), 'GET /conversations': Response.json([]) })
  const wrapper = mount(KnowledgeMapView, { global: { plugins: [router] } })
  await flushPromises()

  return wrapper
}

function cardTitles(wrapper: VueWrapper): string[] {
  return wrapper.findAll('[data-test="topic-card"]').map((card) => card.text())
}

function subtopicTitles(wrapper: VueWrapper): string[] {
  return wrapper.findAll('[data-test="subtopic"]').map((row) => row.find('span').text())
}

describe('KnowledgeMapView', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
    await router.push('/knowledge-map')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sums up your library and opens on a subtopic you are working on', async () => {
    const wrapper = await mountKnowledgeMap()

    expect(wrapper.get('[data-test="summary"]').text()).toBe(
      '4 topics · 13 subtopics · 2 mastered · 32 cards due today',
    )
    expect(cardTitles(wrapper)).toHaveLength(4)
    expect(wrapper.get('[data-test="subtopics-heading"]').text()).toContain('Biology')
    expect(wrapper.get('[data-test="detail-title"]').text()).toBe('Photosynthesis')
    expect(wrapper.findAll('[data-test="facet"]')).toHaveLength(3)
  })

  it('narrows the cards as you search, and clears the filters when nothing matches', async () => {
    const wrapper = await mountKnowledgeMap()

    await wrapper.get('[data-test="search"]').setValue('recursion')
    expect(cardTitles(wrapper)).toEqual([expect.stringContaining('Computer science')])

    await wrapper.get('[data-test="search"]').setValue('astronomy')
    expect(wrapper.find('[data-test="topic-card"]').exists()).toBe(false)

    await wrapper.get('[data-test="clear-filters"]').trigger('click')
    expect(cardTitles(wrapper)).toHaveLength(4)
    expect((wrapper.get('[data-test="search"]').element as HTMLInputElement).value).toBe('')
  })

  it('filters by category and by what needs attention', async () => {
    const wrapper = await mountKnowledgeMap()

    const chips = wrapper.findAll('[data-test="category-chip"]')
    // Only categories in use get a chip.
    expect(chips.map((chip) => chip.text())).toEqual(['Science', 'Technology', 'Languages'])
    await chips[2]?.trigger('click')
    expect(cardTitles(wrapper)).toEqual([expect.stringContaining('Spanish')])
    // Biology is filtered out, so its subtopics go too.
    expect(wrapper.find('[data-test="subtopics-heading"]').exists()).toBe(false)

    await wrapper.get('[data-test="category-all"]').trigger('click')
    await wrapper.get('[data-test="needs-attention"]').trigger('click')
    expect(subtopicTitles(wrapper)).toEqual([
      'Photosynthesis',
      'Cell respiration',
      'DNA replication',
    ])
  })

  it('shows a topic with its subtopics, and a subtopic with its facets', async () => {
    const wrapper = await mountKnowledgeMap()

    const chemistryCard = wrapper
      .findAll('[data-test="topic-card"]')
      .find((card) => card.text().includes('Chemistry'))
    await chemistryCard?.trigger('click')

    expect(wrapper.get('[data-test="detail-title"]').text()).toBe('Chemistry')
    expect(subtopicTitles(wrapper)).toEqual(['The periodic table', 'Chemical bonds'])
    expect(wrapper.find('[data-test="facet"]').exists()).toBe(false)

    await wrapper.findAll('[data-test="subtopic"]')[1]?.trigger('click')
    expect(wrapper.get('[data-test="detail-title"]').text()).toBe('Chemical bonds')
    expect(wrapper.findAll('[data-test="facet"]')).toHaveLength(3)
  })

  it('adds a topic and selects it', async () => {
    const wrapper = await mountKnowledgeMap()

    await wrapper.get('[data-test="add-topic"]').trigger('click')
    expect(wrapper.get('[data-test="form-title"]').text()).toBe('New topic')

    await wrapper.get('[data-test="name"]').setValue('Astronomy')
    await wrapper.get('form').trigger('submit')

    expect(cardTitles(wrapper)).toHaveLength(5)
    expect(wrapper.get('[data-test="detail-title"]').text()).toBe('Astronomy')
    expect(wrapper.get('[data-test="level"]').text()).toBe('New')
    expect(wrapper.get('[data-test="no-subtopics"]').text()).toBe(
      'No subtopics yet. Add the first one.',
    )
  })

  it('adds a topic in a category of your own, which then gets a chip', async () => {
    const wrapper = await mountKnowledgeMap()

    await wrapper.get('[data-test="add-topic"]').trigger('click')
    await wrapper.get('[data-test="name"]').setValue('Guitar')
    await wrapper.get('[data-test="category"]').setValue('new')
    await wrapper.get('[data-test="new-category"]').setValue('Music')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[data-test="detail-title"]').text()).toBe('Guitar')
    expect(wrapper.text()).toContain('Main topic · Music')
    expect(wrapper.findAll('[data-test="category-chip"]').map((chip) => chip.text())).toContain(
      'Music',
    )
  })

  it('moves a subtopic to another topic when you edit it', async () => {
    const wrapper = await mountKnowledgeMap()

    await wrapper.get('[data-test="edit"]').trigger('click')
    expect(wrapper.get('[data-test="form-title"]').text()).toBe('Edit subtopic')
    expect((wrapper.get('[data-test="name"]').element as HTMLInputElement).value).toBe(
      'Photosynthesis',
    )

    await wrapper.get('[data-test="main-topic"]').setValue('2')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[data-test="subtopics-heading"]').text()).toContain('Chemistry')
    expect(subtopicTitles(wrapper)).toContain('Photosynthesis')
    expect(wrapper.get('[data-test="summary"]').text()).toContain('13 subtopics')
  })

  it('opens the practice picker on the suggested mode', async () => {
    const wrapper = await mountKnowledgeMap()

    expect(wrapper.get('[data-test="suggestion"]').text()).toBe(
      'Suggested: Explain it — your weakest facet.',
    )

    await wrapper.get('[data-test="practice"]').trigger('click')
    expect(wrapper.get('[data-test="mode-feynman"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('[data-test="start-practice"]').text()).toBe('Start explaining')

    await wrapper.get('[data-test="mode-cards"]').trigger('click')
    expect(wrapper.get('[data-test="start-practice"]').text()).toBe('Start flashcards')

    await wrapper.get('[data-test="close-practice"]').trigger('click')
    expect(wrapper.find('[data-test="practice"]').exists()).toBe(true)
  })
})
