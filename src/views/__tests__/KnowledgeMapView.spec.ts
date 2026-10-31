import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { stubApi } from '@/__tests__/stubApi'
import { makeCategories, makeLibrary, makeSubtopic, makeTopic } from '@/__tests__/topicFixtures'
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

type Routes = Parameters<typeof stubApi>[0]

async function mountKnowledgeMap(routes: Routes = {}): Promise<VueWrapper> {
  stubApi({
    'GET /user': Response.json(user),
    'GET /conversations': Response.json([]),
    'GET /topics': Response.json(makeLibrary()),
    'GET /categories': Response.json(makeCategories()),
    ...routes,
  })
  const wrapper = mount(KnowledgeMapView, { global: { plugins: [router] } })
  await flushPromises()

  return wrapper
}

function cardTitles(wrapper: VueWrapper): string[] {
  return wrapper.findAll('[data-test="topic-card"]').map((card) => card.text())
}

function subtopicTitles(wrapper: VueWrapper): string[] {
  return wrapper.findAll('[data-test="subtopic-title"]').map((title) => title.text())
}

async function selectTopic(wrapper: VueWrapper, title: string): Promise<void> {
  const card = wrapper
    .findAll('[data-test="topic-card"]')
    .find((candidate) => candidate.text().includes(title))
  await card?.trigger('click')
  await flushPromises()
}

async function submitForm(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

function validationError(field: string, message: string): Response {
  return Response.json({ message, errors: { [field]: [message] } }, { status: 422 })
}

describe('KnowledgeMapView', () => {
  beforeAll(() => {
    // jsdom doesn't implement showModal.
    HTMLDialogElement.prototype.showModal = vi.fn<() => void>()
  })

  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
    await router.push('/knowledge-map')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sums up your library and shows the subtopics of the first topic', async () => {
    const wrapper = await mountKnowledgeMap()

    expect(wrapper.get('[data-test="summary"]').text()).toBe(
      '4 topics · 8 subtopics · 1 mastered · 11 cards due today',
    )
    expect(cardTitles(wrapper)).toHaveLength(4)
    expect(wrapper.get('[data-test="subtopics-heading"]').text()).toContain('Biology')
    expect(subtopicTitles(wrapper)).toEqual(['Photosynthesis', 'Cell respiration', 'Chlorophyll'])
    expect(wrapper.find('aside').exists()).toBe(false)
  })

  it('opens the page of a subtopic from its row', async () => {
    const wrapper = await mountKnowledgeMap()

    expect(wrapper.get('[data-test="subtopic"]').attributes('href')).toBe('/subtopics/101')
  })

  it('says what to do when the library cannot load, and tries again', async () => {
    const wrapper = await mountKnowledgeMap({
      'GET /topics': [
        () => Response.json({ message: 'Something went wrong.' }, { status: 500 }),
        () => Response.json(makeLibrary()),
      ],
    })

    expect(wrapper.get('[data-test="form-error"]').text()).toContain('Something went wrong.')

    await wrapper.get('[data-test="retry"]').trigger('click')
    await flushPromises()
    expect(cardTitles(wrapper)).toHaveLength(4)
  })

  it('invites you to add a first topic when your library is empty', async () => {
    const wrapper = await mountKnowledgeMap({ 'GET /topics': Response.json([]) })

    expect(wrapper.get('[data-test="empty-library"]').text()).toContain('Your library is empty')
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
    // Biology is filtered out, so the subtopics of the topic you can see show instead.
    expect(wrapper.get('[data-test="subtopics-heading"]').text()).toContain('Spanish')

    await wrapper.get('[data-test="category-all"]').trigger('click')
    await wrapper.get('[data-test="needs-attention"]').trigger('click')
    expect(subtopicTitles(wrapper)).toEqual(['Photosynthesis', 'Cell respiration'])
  })

  it('shows a subtopic you search for, even when another topic was picked', async () => {
    const wrapper = await mountKnowledgeMap()

    await wrapper.get('[data-test="search"]').setValue('recursion')

    expect(wrapper.get('[data-test="subtopics-heading"]').text()).toContain('Computer science')
    expect(subtopicTitles(wrapper)).toEqual(['Recursion'])
    expect(wrapper.get('[data-test="topic-card"][aria-pressed="true"]').text()).toContain(
      'Computer science',
    )
  })

  it('shows the subtopics of the topic you pick', async () => {
    const wrapper = await mountKnowledgeMap()

    await selectTopic(wrapper, 'Chemistry')

    expect(wrapper.get('[data-test="subtopics-heading"]').text()).toContain('Chemistry')
    expect(subtopicTitles(wrapper)).toEqual(['The periodic table', 'Chemical bonds'])
  })

  it('keeps the topic you picked in the URL, so coming back shows it again', async () => {
    await router.push('/knowledge-map?topic=2')
    const wrapper = await mountKnowledgeMap()

    expect(wrapper.get('[data-test="subtopics-heading"]').text()).toContain('Chemistry')

    await selectTopic(wrapper, 'Spanish')
    expect(router.currentRoute.value.query).toEqual({ topic: '4' })
  })

  it('falls back to the first topic for a topic that is not in your library', async () => {
    await router.push('/knowledge-map?topic=999')
    const wrapper = await mountKnowledgeMap()

    expect(wrapper.get('[data-test="subtopics-heading"]').text()).toContain('Biology')
  })

  it('adds a topic in a dialog and shows it', async () => {
    const wrapper = await mountKnowledgeMap({
      'POST /topics': Response.json(makeTopic({ id: 9, title: 'Astronomy' }), { status: 201 }),
    })

    await wrapper.get('[data-test="add-topic"]').trigger('click')
    expect(wrapper.get('dialog h2').text()).toBe('New topic')

    await wrapper.get('[data-test="name"]').setValue('Astronomy')
    await submitForm(wrapper)

    expect(wrapper.find('dialog').exists()).toBe(false)
    expect(cardTitles(wrapper)).toHaveLength(5)
    expect(wrapper.get('[data-test="subtopics-heading"]').text()).toContain('Astronomy')
    expect(wrapper.get('[data-test="no-subtopics"]').text()).toBe(
      'No subtopics yet. Add the first one.',
    )
  })

  it('keeps the dialog open with the API message when saving fails', async () => {
    const wrapper = await mountKnowledgeMap({
      'POST /topics': validationError('title', 'Give your topic a name.'),
    })

    await wrapper.get('[data-test="add-topic"]').trigger('click')
    await wrapper.get('[data-test="name"]').setValue('Astronomy')
    await submitForm(wrapper)

    expect(wrapper.get('dialog').text()).toContain('Give your topic a name.')
    expect((wrapper.get('[data-test="name"]').element as HTMLInputElement).value).toBe('Astronomy')
  })

  it('adds a topic in a category of your own, which then gets a chip', async () => {
    const guitar = makeTopic({ id: 9, title: 'Guitar', category: { id: 31, name: 'Music' } })
    const wrapper = await mountKnowledgeMap({
      'POST /topics': Response.json(guitar, { status: 201 }),
    })

    await wrapper.get('[data-test="add-topic"]').trigger('click')
    await wrapper.get('[data-test="name"]').setValue('Guitar')
    await wrapper.get('[data-test="category"]').setValue('new')
    await wrapper.get('[data-test="new-category"]').setValue('Music')
    await submitForm(wrapper)

    expect(wrapper.findAll('[data-test="category-chip"]').map((chip) => chip.text())).toContain(
      'Music',
    )
  })

  it('edits the topic whose subtopics you see', async () => {
    const wrapper = await mountKnowledgeMap({
      'PUT /topics/1': Response.json(makeTopic({ title: 'Biology basics' })),
    })

    await wrapper.get('[data-test="edit-topic"]').trigger('click')
    expect(wrapper.get('dialog h2').text()).toBe('Edit topic')
    expect((wrapper.get('[data-test="name"]').element as HTMLInputElement).value).toBe('Biology')

    await wrapper.get('[data-test="name"]').setValue('Biology basics')
    await submitForm(wrapper)

    expect(wrapper.get('[data-test="subtopics-heading"]').text()).toContain('Biology basics')
  })

  it('adds a subtopic to the topic and says what was generated', async () => {
    const respiration = makeSubtopic({ id: 501, title: 'Respiration', is_new: true })
    const wrapper = await mountKnowledgeMap({
      'POST /subtopics': Response.json(
        { subtopic: respiration, added: { flashcards: 2, questions: 1 } },
        { status: 201 },
      ),
    })

    await wrapper.get('[data-test="add-subtopic"]').trigger('click')
    expect(wrapper.get('dialog h2').text()).toBe('New subtopic')
    expect((wrapper.get('[data-test="main-topic"]').element as HTMLSelectElement).value).toBe('1')

    await wrapper.get('[data-test="name"]').setValue('Respiration')
    await submitForm(wrapper)

    expect(subtopicTitles(wrapper)).toContain('Respiration')
    expect(wrapper.get('[data-test="toast"]').text()).toContain('2 flashcards and 1 question')
  })
})
