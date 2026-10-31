import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { makeFlashcard, makeOpenQuestion, makeQuestion } from '@/__tests__/materialFixtures'
import { makeDone, makePracticeSession } from '@/__tests__/practiceFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { makeLibrary, makeSubtopic, makeSubtopicDetail } from '@/__tests__/topicFixtures'
import { undoWindow } from '@/composables/useUndoableDelete'
import { useAuthStore, type User } from '@/stores/auth'
import SubtopicView from '../SubtopicView.vue'

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

const notFound = (): Response =>
  Response.json(
    { message: "We couldn't find that. Check the link, or head back to your dashboard." },
    { status: 404 },
  )

const noContent = (): Response => new Response(null, { status: 204 })

type Routes = Parameters<typeof stubApi>[0]

let fetchMock: ReturnType<typeof stubApi>

async function mountSubtopic(routes: Routes = {}): Promise<VueWrapper> {
  fetchMock = stubApi({
    'GET /user': Response.json(user),
    'GET /conversations': Response.json([]),
    'GET /subtopics/101': Response.json(makeSubtopicDetail()),
    'GET /subtopics/101/flashcards': Response.json([
      makeFlashcard({ id: 41, is_due: true, recall: 52 }),
      makeFlashcard({ id: 42, front: 'Which gas is released?', paused: true }),
    ]),
    'GET /subtopics/101/questions': Response.json([makeQuestion(), makeOpenQuestion()]),
    'GET /subtopics/101/practice-sessions': Response.json([
      makePracticeSession({
        plan: {
          modes: ['cards', 'open'],
          card_ids: [41],
          question_ids: [],
          explain_subtopic_id: null,
        },
        done: makeDone({
          flashcard_reviews: [{ flashcard_id: 41, rating: 'good', reviewed_at: '' }],
          messages: [
            { id: 301, role: 'user', content: 'Quiz me', technique: null, created_at: '' },
            {
              id: 302,
              role: 'tutor',
              content: 'What do leaves need?',
              technique: null,
              created_at: '',
            },
          ],
        }),
        xp_earned: 1,
        subtopics: [
          {
            id: 101,
            title: 'Photosynthesis',
            mastery_before: 20,
            mastery_after: 28,
            next_review_on: null,
          },
        ],
      }),
      makePracticeSession({ id: 50, is_finished: true }),
    ]),
    ...routes,
  })
  await router.push('/subtopics/101')
  const wrapper = mount(SubtopicView, { props: { id: 101 }, global: { plugins: [router] } })
  await flushPromises()

  return wrapper
}

function calls(route: string): number {
  return fetchMock.mock.calls.filter(([input, init]) => {
    const path = String(input).replace(import.meta.env.VITE_API_URL, '')

    return `${init?.method ?? 'GET'} ${path}` === route
  }).length
}

function cardFronts(wrapper: VueWrapper): string[] {
  return wrapper.findAll('[data-test="card-front-text"]').map((front) => front.text())
}

async function openTab(wrapper: VueWrapper, tab: string): Promise<void> {
  await wrapper.get(`[data-test="tab-${tab}"]`).trigger('click')
}

describe('SubtopicView', () => {
  beforeAll(() => {
    // jsdom doesn't implement these browser APIs.
    HTMLDialogElement.prototype.showModal = vi.fn<() => void>()
    Element.prototype.scrollIntoView = vi.fn<() => void>()
  })

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows the subtopic with its facets and a count per tab', async () => {
    const wrapper = await mountSubtopic()

    expect(wrapper.get('[data-test="subtopic-title"]').text()).toBe('Photosynthesis')
    expect(wrapper.text()).toContain('Biology · Subtopic')
    expect(wrapper.get('[data-test="level"]').text()).toBe('Growing')
    expect(wrapper.findAll('[data-test="facet"]')).toHaveLength(3)
    expect(wrapper.findAll('[data-test="tab-count"]').map((count) => count.text())).toEqual([
      '2',
      '2',
      '2',
      '1',
    ])
    // Back to the knowledge map with this topic picked.
    expect(wrapper.get('[data-test="crumb-topic"]').attributes('href')).toBe(
      '/knowledge-map?topic=1',
    )
  })

  it('opens the practice setup with this subtopic, and a mode from the tabs', async () => {
    const wrapper = await mountSubtopic()

    await wrapper.get('[data-test="practice"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/practice?subtopic=101')

    await router.push('/subtopics/101')
    await openTab(wrapper, 'questions')
    await wrapper.get('[data-test="quiz-me"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/practice?subtopic=101&modes=retrieval')

    await router.push('/subtopics/101')
    await openTab(wrapper, 'sessions')
    await wrapper.get('[data-test="new-session"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/practice?subtopic=101&modes=open')
  })

  it('shows the not found page for a subtopic that is not yours', async () => {
    const wrapper = await mountSubtopic({ 'GET /subtopics/101': notFound })

    expect(wrapper.get('[data-test="not-found-title"]').text()).toBe('Oops. A little lost.')
  })

  it('filters the cards and shows their status', async () => {
    const wrapper = await mountSubtopic()

    expect(wrapper.findAll('[data-test="card-status"]').map((badge) => badge.text())).toEqual([
      'Due today',
      'Paused',
    ])

    await wrapper.get('[data-test="filter-paused"]').trigger('click')
    expect(cardFronts(wrapper)).toEqual(['Which gas is released?'])

    await wrapper.get('[data-test="filter-weak"]').trigger('click')
    expect(cardFronts(wrapper)).toEqual(['Where in the cell does photosynthesis happen?'])

    await wrapper.get('[data-test="search"]').setValue('nothing like this')
    expect(wrapper.get('[data-test="empty"]').text()).toBe(
      'No cards match. Clear the filter, or add one.',
    )
  })

  it('adds a card and keeps your text when the API refuses it', async () => {
    const added = makeFlashcard({ id: 43, front: 'What does ATP do?', origin: 'user' })
    const wrapper = await mountSubtopic({
      'POST /subtopics/101/flashcards': [
        () =>
          Response.json(
            {
              message: 'Keep the front under 500 characters.',
              errors: { front: ['Keep the front under 500 characters.'] },
            },
            { status: 422 },
          ),
        () => Response.json(added, { status: 201 }),
      ],
    })

    await wrapper.get('[data-test="add-card"]').trigger('click')
    expect(wrapper.get('[data-test="save-card"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="card-front"]').setValue('What does ATP do?')
    await wrapper.get('[data-test="card-back"]').setValue('It supplies the energy.')
    await wrapper.get('[data-test="card-editor"]').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Keep the front under 500 characters.')
    expect((wrapper.get('[data-test="card-front"]').element as HTMLInputElement).value).toBe(
      'What does ATP do?',
    )

    await wrapper.get('[data-test="card-editor"]').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[data-test="card-editor"]').exists()).toBe(false)
    expect(cardFronts(wrapper)).toContain('What does ATP do?')
    // The header is fetched again, since a new card is due.
    expect(calls('GET /subtopics/101')).toBe(2)
  })

  it('edits a card in place', async () => {
    const wrapper = await mountSubtopic({
      'PUT /flashcards/41': Response.json(makeFlashcard({ id: 41, front: 'Sharper front' })),
    })

    await wrapper.get('[data-test="edit-card"]').trigger('click')
    await wrapper.get('[data-test="card-front"]').setValue('Sharper front')
    await wrapper.get('[data-test="card-editor"]').trigger('submit')
    await flushPromises()

    expect(cardFronts(wrapper)[0]).toBe('Sharper front')
  })

  it('pauses a card and refreshes the header', async () => {
    const wrapper = await mountSubtopic({
      'POST /flashcards/41/pause': Response.json(makeFlashcard({ id: 41, paused: true })),
    })

    await wrapper.get('[data-test="toggle-pause"]').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[data-test="card-status"]').map((badge) => badge.text())).toEqual([
      'Paused',
      'Paused',
    ])
    expect(calls('GET /subtopics/101')).toBe(2)
  })

  it('hides a deleted card at once, lets you undo, and deletes it after the toast', async () => {
    const wrapper = await mountSubtopic({ 'DELETE /flashcards/41': noContent })
    vi.useFakeTimers()

    await wrapper.get('[data-test="delete-card"]').trigger('click')
    expect(cardFronts(wrapper)).toEqual(['Which gas is released?'])
    expect(wrapper.get('[data-test="toast"]').text()).toContain('Card deleted')

    await wrapper.get('[data-test="undo"]').trigger('click')
    expect(cardFronts(wrapper)).toHaveLength(2)

    await wrapper.get('[data-test="delete-card"]').trigger('click')
    vi.advanceTimersByTime(undoWindow)
    await flushPromises()

    expect(calls('DELETE /flashcards/41')).toBe(1)
    expect(cardFronts(wrapper)).toEqual(['Which gas is released?'])
    expect(wrapper.find('[data-test="toast"]').exists()).toBe(false)
  })

  it('sends a waiting delete when you leave the page', async () => {
    const wrapper = await mountSubtopic({ 'DELETE /questions/17': noContent })

    await openTab(wrapper, 'questions')
    await wrapper.get('[data-test="delete-question"]').trigger('click')
    expect(calls('DELETE /questions/17')).toBe(0)

    wrapper.unmount()
    await flushPromises()

    expect(calls('DELETE /questions/17')).toBe(1)
  })

  it('says what generating added, or why it could not', async () => {
    const wrapper = await mountSubtopic({
      'POST /subtopics/101/generate': [
        () =>
          Response.json(
            {
              message: 'Add notes to this subtopic first, so we can make cards from them.',
              errors: {
                notes: ['Add notes to this subtopic first, so we can make cards from them.'],
              },
            },
            { status: 422 },
          ),
        () => Response.json({ subtopic: makeSubtopic(), added: { flashcards: 2, questions: 1 } }),
      ],
    })

    await wrapper.get('[data-test="generate"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-test="form-error"]').text()).toBe(
      'Add notes to this subtopic first, so we can make cards from them.',
    )

    await wrapper.get('[data-test="generate"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="form-error"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="toast"]').text()).toContain('Added 2 flashcards and 1 question')
    expect(calls('GET /subtopics/101/flashcards')).toBe(2)
  })

  it('shows your answer and Sprout’s feedback when you open a question', async () => {
    const wrapper = await mountSubtopic()

    await openTab(wrapper, 'questions')
    expect(wrapper.findAll('[data-test="verdict"]').map((badge) => badge.text())).toEqual([
      'Correct',
      'Almost',
    ])

    await wrapper.findAll('[data-test="toggle-question"]')[0]?.trigger('click')
    const options = wrapper.findAll('[data-test="option"]')
    expect(options).toHaveLength(2)
    // You picked the right one.
    expect(options[1]?.text()).toContain('Green')
    expect(options[1]?.text()).toContain('Correct')
    expect(wrapper.get('[data-test="feedback"]').text()).toContain('Green is reflected')

    await wrapper.get('[data-test="filter-feynman"]').trigger('click')
    expect(wrapper.get('[data-test="empty"]').text()).toBe('No questions match this filter.')
  })

  it('lists the practice sessions, shows their chat and continues the one still going', async () => {
    const wrapper = await mountSubtopic()

    await openTab(wrapper, 'sessions')
    const [going, done] = wrapper.findAll('[data-test="session"]')
    expect(going?.text()).toContain('Mixed session')
    expect(going?.text()).toContain('1 card · 1 message')
    expect(going?.get('[data-test="session-mastery"]').text()).toBe('Mastery 20% → 28%')
    expect(going?.get('[data-test="continue-session"]').attributes('href')).toBe(
      '/practice/session',
    )
    // A finished session can't be picked up again.
    expect(done?.find('[data-test="continue-session"]').exists()).toBe(false)

    await going?.get('[data-test="toggle-session"]').trigger('click')
    expect(wrapper.findAll('[data-test="chat-message"]')).toHaveLength(2)

    await wrapper.get('[data-test="search"]').setValue('leaves need')
    expect(wrapper.findAll('[data-test="session"]')).toHaveLength(1)
  })

  it('removes the notes as a source, with a chance to undo', async () => {
    const wrapper = await mountSubtopic({
      'PUT /subtopics/101': Response.json({
        subtopic: makeSubtopic({ notes: null }),
        added: { flashcards: 0, questions: 0 },
      }),
    })

    await openTab(wrapper, 'sources')
    expect(wrapper.get('[data-test="source"]').text()).toContain('Notes · 6 words')

    await wrapper.get('[data-test="remove-source"]').trigger('click')
    expect(wrapper.find('[data-test="source"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="add-source"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="toast"]').text()).toContain('Source removed')

    await wrapper.get('[data-test="undo"]').trigger('click')
    expect(wrapper.find('[data-test="source"]').exists()).toBe(true)
    expect(calls('PUT /subtopics/101')).toBe(0)
  })

  it('edits the subtopic in a dialog with your topics to move it to', async () => {
    const wrapper = await mountSubtopic({
      'GET /topics': Response.json(makeLibrary()),
      'GET /categories': Response.json([]),
      'PUT /subtopics/101': Response.json({
        subtopic: makeSubtopic({ title: 'Light reactions' }),
        added: { flashcards: 0, questions: 0 },
      }),
    })

    await wrapper.get('[data-test="edit-subtopic"]').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('[data-test="main-topic"] option')).toHaveLength(4)

    await wrapper.get('[data-test="name"]').setValue('Light reactions')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const body = JSON.parse(
      String(fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')?.[1]?.body),
    )
    expect(body).toMatchObject({ topic_id: 1, title: 'Light reactions' })
    expect(wrapper.find('dialog').exists()).toBe(false)
  })

  it('deletes the subtopic after you confirm, and goes back to the knowledge map', async () => {
    const wrapper = await mountSubtopic({
      'DELETE /subtopics/101': noContent,
      'GET /topics': Response.json([]),
      'GET /categories': Response.json([]),
    })

    await wrapper.get('[data-test="more"]').trigger('click')
    await wrapper.get('[data-test="delete-subtopic"]').trigger('click')
    expect(wrapper.get('dialog').text()).toContain('Delete Photosynthesis?')

    await wrapper.get('[data-test="confirm-delete"]').trigger('click')
    await flushPromises()

    expect(calls('DELETE /subtopics/101')).toBe(1)
    expect(router.currentRoute.value.name).toBe('knowledge-map')
  })

  it('shows the not found page when the subtopic was deleted elsewhere', async () => {
    const wrapper = await mountSubtopic({
      'POST /flashcards/41/pause': notFound,
      'GET /subtopics/101': [() => Response.json(makeSubtopicDetail()), notFound],
    })

    await wrapper.get('[data-test="toggle-pause"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="not-found-title"]').exists()).toBe(true)
  })
})
