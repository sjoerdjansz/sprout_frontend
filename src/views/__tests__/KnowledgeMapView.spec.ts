import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { stubApi } from '@/__tests__/stubApi'
import { makeCategories, makeLibrary, makeSubtopic, makeTopic } from '@/__tests__/topicFixtures'
import { pollInterval } from '@/composables/useGenerationPolling'
import { makeSummary } from '@/__tests__/conversationFixtures'
import { makePracticeSession } from '@/__tests__/practiceFixtures'
import { useAuthStore, type User } from '@/stores/auth'
import { useConversationsStore } from '@/stores/conversations'
import { usePracticeStore } from '@/stores/practice'
import KnowledgeMapView from '../KnowledgeMapView.vue'

const user: User = {
  id: 1,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  pending_email: null,
  email_verified_at: '2026-10-29T12:00:00.000000Z',
  avatar_color: 'sun',
  interests: ['science'],
  wants_daily_reminder: true,
  created_at: '2026-10-29T12:00:00.000000Z',
}

type Routes = Parameters<typeof stubApi>[0]

let fetchMock: ReturnType<typeof stubApi>

/** The JSON body of the first request to a route ("POST /topics/1/subtopics"). */
function sentBody(route: string): unknown {
  const call = fetchMock.mock.calls.find(([input, init]) => {
    const path = String(input).replace(import.meta.env.VITE_API_URL, '')
    return `${init?.method ?? 'GET'} ${path}` === route
  })

  return JSON.parse(String(call?.[1]?.body))
}

async function mountKnowledgeMap(routes: Routes = {}): Promise<VueWrapper> {
  fetchMock = stubApi({
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

function captions(wrapper: VueWrapper): string[] {
  return wrapper.findAll('[data-test="subtopic-caption"]').map((caption) => caption.text())
}

function topicCalls(): number {
  return fetchMock.mock.calls.filter(
    ([input, init]) =>
      String(input).replace(import.meta.env.VITE_API_URL, '') === '/topics' &&
      (init?.method ?? 'GET') === 'GET',
  ).length
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
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('sums up your library and shows the subtopics of the first topic', async () => {
    const wrapper = await mountKnowledgeMap()

    expect(wrapper.get('[data-test="summary"]').text()).toBe(
      '4 topics · 8 subtopics · 1 mastered · 11 cards due today',
    )
    expect(cardTitles(wrapper)).toHaveLength(4)
    expect(wrapper.get('[data-test="subtopics-heading"]').text()).toContain('Biology')
    // Only flashcards have a review schedule, so the count says what it counts.
    expect(wrapper.findAll('[data-test="topic-meta"]')[0]?.text()).toContain('· 9 cards due')
    expect(subtopicTitles(wrapper)).toEqual(['Photosynthesis', 'Cell respiration', 'Chlorophyll'])
    expect(wrapper.get('[data-test="topic-description"]').text()).toBe(
      'How living things work, from cells to whole ecosystems.',
    )
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

  it('scrolls to the subtopics when they are below the screen', async () => {
    const scrollIntoView = vi.fn<(options?: ScrollIntoViewOptions) => void>()
    Element.prototype.scrollIntoView = scrollIntoView
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    const wrapper = await mountKnowledgeMap()
    const list = wrapper.get('section[aria-label="Subtopics"]').element

    // On screen (jsdom's default position): nothing moves.
    await selectTopic(wrapper, 'Chemistry')
    expect(scrollIntoView).not.toHaveBeenCalled()

    // Below the screen, as on a phone under all the cards.
    vi.spyOn(list, 'getBoundingClientRect').mockReturnValue({ top: 2000 } as DOMRect)
    await selectTopic(wrapper, 'Spanish')
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' })
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

  it("edits any topic from its card's menu", async () => {
    const wrapper = await mountKnowledgeMap({
      'PUT /topics/2': Response.json(makeTopic({ id: 2, title: 'Chemistry basics' })),
    })

    const menuButton = wrapper.get('[data-test="topic-menu"][aria-label="More for Chemistry"]')
    await menuButton.trigger('click')
    expect(menuButton.attributes('aria-expanded')).toBe('true')

    await wrapper.get('[data-test="topic-menu-edit"]').trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(wrapper.get('dialog h2').text()).toBe('Edit topic')
    expect((wrapper.get('[data-test="name"]').element as HTMLInputElement).value).toBe('Chemistry')

    await wrapper.get('[data-test="name"]').setValue('Chemistry basics')
    await submitForm(wrapper)

    expect(sentBody('PUT /topics/2')).toMatchObject({ title: 'Chemistry basics' })
    expect(wrapper.get('[data-test="subtopics-heading"]').text()).toContain('Chemistry basics')
  })

  it('adds a subtopic to the topic and says Sprout is making its cards', async () => {
    const respiration = makeSubtopic({
      id: 501,
      title: 'Respiration',
      is_new: true,
      generation_status: 'generating',
    })
    const wrapper = await mountKnowledgeMap({
      'POST /subtopics': Response.json({ subtopic: respiration }, { status: 201 }),
    })

    await wrapper.get('[data-test="add-subtopic"]').trigger('click')
    expect(wrapper.get('dialog h2').text()).toBe('New subtopic')
    expect((wrapper.get('[data-test="main-topic"]').element as HTMLSelectElement).value).toBe('1')

    await wrapper.get('[data-test="name"]').setValue('Respiration')
    await submitForm(wrapper)

    expect(subtopicTitles(wrapper)).toContain('Respiration')
    expect(wrapper.get('[data-test="toast"]').text()).toContain('Added Respiration')
    expect(wrapper.get('[data-test="toast"]').text()).toContain(
      'Sprout is making cards from your notes.',
    )
    expect(captions(wrapper)).toContain('Sprout is making your cards…')
    wrapper.unmount()
  })

  it('asks again while cards are being made, once for all of them, until they are ready', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const generatingLibrary = makeLibrary()
    for (const subtopic of generatingLibrary[0]?.subtopics.slice(0, 2) ?? []) {
      subtopic.generation_status = 'generating'
    }
    const wrapper = await mountKnowledgeMap({
      'GET /topics': [
        () => Response.json(generatingLibrary),
        () => Response.json(generatingLibrary),
        () => Response.json(makeLibrary()),
      ],
    })
    expect(
      captions(wrapper).filter((text) => text === 'Sprout is making your cards…'),
    ).toHaveLength(2)

    await vi.advanceTimersByTimeAsync(pollInterval)
    await flushPromises()
    expect(topicCalls()).toBe(2)

    await vi.advanceTimersByTimeAsync(pollInterval)
    await flushPromises()
    expect(topicCalls()).toBe(3)
    expect(captions(wrapper)).not.toContain('Sprout is making your cards…')

    await vi.advanceTimersByTimeAsync(pollInterval * 5)
    expect(topicCalls()).toBe(3)
  })

  it('shows why asking for the status failed, and keeps asking', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const generatingLibrary = makeLibrary()
    const first = generatingLibrary[0]?.subtopics[0]
    if (first !== undefined) {
      first.generation_status = 'generating'
    }
    const wrapper = await mountKnowledgeMap({
      'GET /topics': [
        () => Response.json(generatingLibrary),
        () => Response.json({ message: 'Something went wrong on our side.' }, { status: 500 }),
        () => Response.json(makeLibrary()),
      ],
    })

    await vi.advanceTimersByTimeAsync(pollInterval)
    await flushPromises()
    expect(wrapper.get('[data-test="check-error"]').text()).toContain(
      'Something went wrong on our side.',
    )

    await vi.advanceTimersByTimeAsync(pollInterval)
    await flushPromises()
    expect(wrapper.find('[data-test="check-error"]').exists()).toBe(false)
    expect(topicCalls()).toBe(3)
  })

  it('shows a subtopic whose cards could not be made', async () => {
    const failedLibrary = makeLibrary()
    const first = failedLibrary[0]?.subtopics[0]
    if (first !== undefined) {
      first.generation_status = 'failed'
    }
    const wrapper = await mountKnowledgeMap({ 'GET /topics': Response.json(failedLibrary) })

    expect(captions(wrapper)).toContain("Sprout couldn't make its cards. Try again on its page.")
  })

  describe('building a topic from its source', () => {
    const source = '# Running form\n\nWeek 1: cadence. Week 2: stride length.'
    const suggested = {
      suggestions: [
        { title: 'Cadence', description: 'Steps per minute.', notes: '# Week 1: Cadence' },
        { title: 'Stride length', description: null, notes: '# Week 2: Stride length' },
      ],
    }

    async function saveSource(wrapper: VueWrapper): Promise<void> {
      await wrapper.get('[data-test="edit-topic"]').trigger('click')
      await wrapper.get('[data-test="notes"]').setValue(source)
      await submitForm(wrapper)
    }

    function titleInputs(wrapper: VueWrapper): string[] {
      return wrapper
        .findAll('[data-test="suggestion-title"]')
        .map((input) => (input.element as HTMLInputElement).value)
    }

    it('suggests subtopics after you save a changed source, and adds the ones you keep', async () => {
      const wrapper = await mountKnowledgeMap({
        'PUT /topics/1': Response.json(makeTopic({ notes: source })),
        'POST /topics/1/subtopic-suggestions': Response.json(suggested),
        'POST /topics/1/subtopics': Response.json(
          {
            subtopics: [
              makeSubtopic({ id: 601, title: 'Cadence 101', generation_status: 'generating' }),
              makeSubtopic({ id: 602, title: 'Warming up', notes: null }),
            ],
            added: { subtopics: 2 },
          },
          { status: 201 },
        ),
      })

      await saveSource(wrapper)
      expect(wrapper.get('dialog h2').text()).toBe('Sprout suggests these subtopics')
      expect(titleInputs(wrapper)).toEqual(['Cadence', 'Stride length'])

      // Rename one, leave one out, add one of your own.
      await wrapper.findAll('[data-test="suggestion-title"]')[0]?.setValue('Cadence 101')
      await wrapper.findAll('[data-test="suggestion-keep"] [role="switch"]')[1]?.trigger('click')
      await wrapper.get('[data-test="add-own"]').trigger('click')
      expect(wrapper.get('[data-test="suggestions-add"]').attributes('disabled')).toBeDefined()
      await wrapper.findAll('[data-test="suggestion-title"]')[2]?.setValue('Warming up')
      expect(wrapper.get('[data-test="suggestions-add"]').text()).toBe('Add 2 subtopics')

      await wrapper.get('[data-test="suggestions-add"]').trigger('click')
      await flushPromises()

      expect(sentBody('POST /topics/1/subtopics')).toEqual({
        subtopics: [
          { title: 'Cadence 101', description: 'Steps per minute.', notes: '# Week 1: Cadence' },
          { title: 'Warming up', description: null, notes: null },
        ],
      })
      expect(wrapper.find('[data-test="suggestions"]').exists()).toBe(false)
      expect(subtopicTitles(wrapper)).toContain('Cadence 101')
      expect(wrapper.get('[data-test="toast"]').text()).toContain('Added 2 subtopics')
      expect(wrapper.get('[data-test="toast"]').text()).toContain('Sprout is making their cards.')
      wrapper.unmount()
    })

    it('says when your subtopics already cover the source', async () => {
      const wrapper = await mountKnowledgeMap({
        'PUT /topics/1': Response.json(makeTopic({ notes: source })),
        'POST /topics/1/subtopic-suggestions': Response.json({ suggestions: [] }),
      })

      await saveSource(wrapper)

      expect(wrapper.find('[data-test="suggestions"]').exists()).toBe(false)
      expect(wrapper.get('[data-test="toast"]').text()).toContain(
        'Your subtopics already cover this source.',
      )
    })

    it('asks no suggestions when the source didn’t change', async () => {
      const wrapper = await mountKnowledgeMap({
        'PUT /topics/1': Response.json(makeTopic({ title: 'Biology basics' })),
      })

      await wrapper.get('[data-test="edit-topic"]').trigger('click')
      await wrapper.get('[data-test="name"]').setValue('Biology basics')
      await submitForm(wrapper)

      expect(wrapper.find('[data-test="suggestions"]').exists()).toBe(false)
    })

    it('lets you try again when Sprout can’t read the source, and skip', async () => {
      const wrapper = await mountKnowledgeMap({
        'PUT /topics/1': Response.json(makeTopic({ notes: source })),
        'POST /topics/1/subtopic-suggestions': [
          () => Response.json({ message: 'The tutor can’t answer right now.' }, { status: 503 }),
          () => Response.json(suggested),
        ],
      })

      await saveSource(wrapper)
      expect(wrapper.get('[data-test="form-error"]').text()).toContain('can’t answer right now')

      await wrapper.get('[data-test="suggestions-retry"]').trigger('click')
      await flushPromises()
      expect(titleInputs(wrapper)).toEqual(['Cadence', 'Stride length'])

      await wrapper.get('[data-test="suggestions-skip"]').trigger('click')
      expect(wrapper.find('[data-test="suggestions"]').exists()).toBe(false)
    })

    it('shows a name the topic already has under its row, and keeps the review', async () => {
      const wrapper = await mountKnowledgeMap({
        'PUT /topics/1': Response.json(makeTopic({ notes: source })),
        'POST /topics/1/subtopic-suggestions': Response.json(suggested),
        'POST /topics/1/subtopics': validationError(
          'subtopics.1.title',
          'This topic already has a subtopic with that name. Pick another name.',
        ),
      })

      await saveSource(wrapper)
      await wrapper.get('[data-test="suggestions-add"]').trigger('click')
      await flushPromises()

      const rows = wrapper.findAll('[data-test="suggestion"]')
      expect(rows[1]?.text()).toContain('This topic already has a subtopic with that name.')
      expect(wrapper.find('[data-test="suggestions"] [data-test="form-error"]').exists()).toBe(
        false,
      )
      expect(titleInputs(wrapper)).toEqual(['Cadence', 'Stride length'])
    })
  })

  describe('deleting a topic', () => {
    async function openDelete(wrapper: VueWrapper, topicTitle: string): Promise<void> {
      await wrapper
        .get(`[data-test="topic-menu"][aria-label="More for ${topicTitle}"]`)
        .trigger('click')
      await wrapper.get('[data-test="topic-menu-delete"]').trigger('click')
    }

    function showsCard(wrapper: VueWrapper, topicTitle: string): boolean {
      return cardTitles(wrapper).some((text) => text.includes(topicTitle))
    }

    function topicDeletes(): number {
      return fetchMock.mock.calls.filter(([, init]) => init?.method === 'DELETE').length
    }

    it('says what goes and deletes the topic once you confirm', async () => {
      const wrapper = await mountKnowledgeMap({
        'GET /conversations': Response.json([
          makeSummary({ id: 7, topic: { id: 2, title: 'Chemistry' } }),
          makeSummary({ id: 8, topic: { id: 1, title: 'Biology' } }),
        ]),
        'DELETE /topics/2': new Response(null, { status: 204 }),
      })
      await useConversationsStore().fetchConversations()
      usePracticeStore().current = makePracticeSession({ topic: { id: 2, title: 'Chemistry' } })

      await openDelete(wrapper, 'Chemistry')

      expect(wrapper.get('dialog h2').text()).toBe('Delete Chemistry?')
      expect(wrapper.get('[data-test="delete-topic-what-goes"]').text()).toContain(
        'its 2 subtopics',
      )
      expect(topicDeletes()).toBe(0)

      await wrapper.get('[data-test="confirm-delete-topic"]').trigger('click')
      await flushPromises()

      expect(topicDeletes()).toBe(1)
      expect(showsCard(wrapper, 'Chemistry')).toBe(false)
      expect(wrapper.find('dialog').exists()).toBe(false)
      expect(wrapper.get('[data-test="toast"]').text()).toContain('Deleted Chemistry')
      // Its chats and practice session went with it on the API.
      expect(useConversationsStore().conversations.map((summary) => summary.id)).toEqual([8])
      expect(usePracticeStore().current).toBeNull()
    })

    it('deletes nothing when you cancel', async () => {
      const wrapper = await mountKnowledgeMap()

      await openDelete(wrapper, 'Chemistry')
      const cancel = wrapper.findAll('dialog button').find((button) => button.text() === 'Cancel')
      await cancel?.trigger('click')

      expect(wrapper.find('dialog').exists()).toBe(false)
      expect(topicDeletes()).toBe(0)
      expect(showsCard(wrapper, 'Chemistry')).toBe(true)
    })

    it('keeps the topic and shows the API’s message when deleting fails', async () => {
      const wrapper = await mountKnowledgeMap({
        'DELETE /topics/2': Response.json(
          { message: 'Can’t reach Sprout right now. Try again.' },
          { status: 500 },
        ),
      })

      await openDelete(wrapper, 'Chemistry')
      await wrapper.get('[data-test="confirm-delete-topic"]').trigger('click')
      await flushPromises()

      expect(wrapper.get('[data-test="form-error"]').text()).toContain(
        'Can’t reach Sprout right now',
      )
      expect(showsCard(wrapper, 'Chemistry')).toBe(true)
    })

    it('treats a topic that is already gone as deleted', async () => {
      const wrapper = await mountKnowledgeMap({
        'DELETE /topics/2': Response.json({ message: 'Not found.' }, { status: 404 }),
      })

      await openDelete(wrapper, 'Chemistry')
      await wrapper.get('[data-test="confirm-delete-topic"]').trigger('click')
      await flushPromises()

      expect(showsCard(wrapper, 'Chemistry')).toBe(false)
      expect(wrapper.find('dialog').exists()).toBe(false)
    })
  })
})
