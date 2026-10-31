import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { makeConversation, makeSummary } from '@/__tests__/conversationFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { makeCategories } from '@/__tests__/topicFixtures'
import { useAuthStore, type User } from '@/stores/auth'
import ConversationView from '../ConversationView.vue'

const user: User = {
  id: 1,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  pending_email: null,
  email_verified_at: '2026-10-29T12:00:00.000000Z',
  avatar_color: 'sun',
  interests: ['maths'],
  wants_daily_reminder: true,
  created_at: '2026-10-29T12:00:00.000000Z',
}

const reply = makeConversation({
  last_activity_at: '2026-10-30T16:00:00.000000Z',
  messages: [
    ...makeConversation().messages,
    {
      id: 103,
      role: 'user',
      content: 'Mostly injuries',
      created_at: '2026-10-30T16:00:00.000000Z',
    },
    {
      id: 104,
      role: 'tutor',
      content: 'Then let’s start with **load**.',
      created_at: '2026-10-30T16:00:05.000000Z',
    },
  ],
})

async function mountConversation(id = 10): Promise<VueWrapper> {
  await router.push(`/conversations/${id}`)
  const wrapper = mount(ConversationView, { props: { id }, global: { plugins: [router] } })
  await flushPromises()

  return wrapper
}

describe('ConversationView', () => {
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
    vi.unstubAllGlobals()
  })

  it('shows the conversation with the tutor’s Markdown rendered', async () => {
    stubApi({
      'GET /user': Response.json(user),
      'GET /conversations': Response.json([makeSummary()]),
      'GET /conversations/10': Response.json(makeConversation()),
    })

    const wrapper = await mountConversation()

    expect(wrapper.get('h1').text()).toBe('Biomechanics of running')
    expect(wrapper.findAll('[data-test="chat-message"]')).toHaveLength(2)
    expect(wrapper.get('[data-test="chat-thread"] strong').text()).toBe('sport')
  })

  it('shows the tutor typing while it answers, then its reply', async () => {
    let answerTutor: (response: Response) => void = () => {}
    stubApi({
      'GET /user': Response.json(user),
      'GET /conversations': Response.json([makeSummary()]),
      'GET /conversations/10': Response.json(makeConversation()),
      'POST /conversations/10/messages': () =>
        new Promise<Response>((resolve) => (answerTutor = resolve)),
    })
    const wrapper = await mountConversation()

    await wrapper.get('[data-test="composer-input"]').setValue('Mostly injuries')
    await wrapper.get('[data-test="composer-input"]').trigger('keydown.enter')

    expect(wrapper.find('[data-test="typing"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="composer-send"]').attributes('disabled')).toBeDefined()

    answerTutor(Response.json(reply, { status: 201 }))
    await flushPromises()

    expect(wrapper.find('[data-test="typing"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-test="chat-message"]')).toHaveLength(4)
    expect(wrapper.text()).toContain('Then let’s start with load.')
  })

  it('keeps your text when Sprout’s AI isn’t working', async () => {
    stubApi({
      'GET /user': Response.json(user),
      'GET /conversations': Response.json([makeSummary()]),
      'GET /conversations/10': Response.json(makeConversation()),
      'POST /conversations/10/messages': () =>
        Response.json(
          {
            message: 'Sprout’s AI isn’t working right now. We’re fixing it, so try again later.',
          },
          { status: 503 },
        ),
    })
    const wrapper = await mountConversation()

    await wrapper.get('[data-test="composer-input"]').setValue('Mostly injuries')
    await wrapper.get('[data-test="composer-send"]').trigger('click')
    await flushPromises()

    const input = wrapper.get('[data-test="composer-input"]').element as HTMLTextAreaElement
    expect(input.value).toBe('Mostly injuries')
    expect(wrapper.get('[data-test="form-error"]').text()).toBe(
      'Sprout’s AI isn’t working right now. We’re fixing it, so try again later.',
    )
    expect(wrapper.findAll('[data-test="chat-message"]')).toHaveLength(2)
  })

  it('says so when the conversation doesn’t exist', async () => {
    stubApi({
      'GET /user': Response.json(user),
      'GET /conversations': Response.json([]),
      // Whatever the API says, the page explains it in its own words.
      'GET /conversations/99': () =>
        Response.json({ message: 'No query results for model [StudySession] 99' }, { status: 404 }),
    })

    const wrapper = await mountConversation(99)

    expect(wrapper.get('[data-test="not-found"]').text()).toBe(
      'We couldn’t find that conversation. Check the link, or head back to your dashboard.',
    )
    expect(wrapper.find('[data-test="composer-input"]').exists()).toBe(false)
  })

  it('makes a saved conversation read-only', async () => {
    stubApi({
      'GET /user': Response.json(user),
      'GET /conversations': Response.json([makeSummary({ is_saved: true })]),
      'GET /conversations/10': Response.json(
        makeConversation({ is_saved: true, topic: { id: 12, title: 'Biomechanics of running' } }),
      ),
    })

    const wrapper = await mountConversation()

    expect(wrapper.find('[data-test="composer-input"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="open-save"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="saved-notice"]').text()).toContain(
      'This conversation is saved to your knowledge map.',
    )
  })

  it('keeps the review closed and says why when your categories don’t load', async () => {
    stubApi({
      'GET /user': Response.json(user),
      'GET /conversations': Response.json([makeSummary()]),
      'GET /conversations/10': Response.json(makeConversation()),
      'GET /categories': Response.json(
        { message: 'Something went wrong on our side. Try again in a moment.' },
        { status: 500 },
      ),
    })
    const wrapper = await mountConversation()

    await wrapper.get('[data-test="open-save"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('dialog').exists()).toBe(false)
    expect(wrapper.get('[data-test="form-error"]').text()).toBe(
      'Something went wrong on our side. Try again in a moment.',
    )
  })

  it('saves the reviewed draft and tells you what was added', async () => {
    const fetchMock = stubApi({
      'GET /user': Response.json(user),
      'GET /conversations': Response.json([makeSummary()]),
      'GET /conversations/10': [
        () => Response.json(makeConversation()),
        () => Response.json(makeConversation({ is_saved: true })),
      ],
      'GET /categories': Response.json(makeCategories()),
      'POST /conversations/10/save': () =>
        Response.json(
          {
            topic: {
              id: 12,
              title: 'Biomechanics of running',
              goal: {
                description: 'Explain the gait',
                deadline: '2026-12-01',
                recall_percentage: 80,
              },
              subtopics: [{ id: 40, title: 'Gait cycle' }],
              created_at: '2026-10-30T15:20:11.000000Z',
            },
            added: { subtopics: 1, flashcards: 18, questions: 7 },
          },
          { status: 201 },
        ),
    })
    const wrapper = await mountConversation()

    await wrapper.get('[data-test="open-save"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-test="goal-deadline"]').setValue('2026-12-01')
    await wrapper.get('[data-test="goal-recall"]').setValue('80')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const saveCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/save'))
    expect(JSON.parse(String(saveCall?.[1]?.body))).toEqual({
      title: 'Biomechanics of running',
      category_id: 1,
      goal: {
        description: 'Explain the phases of the running gait to the runners I coach.',
        deadline: '2026-12-01',
        recall_percentage: 80,
      },
      subtopics: [{ title: 'Gait cycle', content: 'A running stride has a stance phase.' }],
    })
    expect(wrapper.find('dialog').exists()).toBe(false)
    expect(wrapper.get('[data-test="saved-notice"]').text()).toContain(
      'Saved Biomechanics of running: 1 subtopic, 18 flashcards and 7 questions',
    )
    expect(wrapper.find('[data-test="composer-input"]').exists()).toBe(false)
  })
})
