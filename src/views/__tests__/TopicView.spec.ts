import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { stubApi } from '@/__tests__/stubApi'
import { makeCategories, makeLibrary, makeSubtopic, makeTopic } from '@/__tests__/topicFixtures'
import { pollInterval } from '@/composables/useGenerationPolling'
import { useAuthStore, type User } from '@/stores/auth'
import type { Topic } from '@/stores/topics'
import TopicView from '../TopicView.vue'

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

/** Biology from the fixture library: Photosynthesis, Cell respiration (slipping), Chlorophyll. */
function biology(): Topic {
  const topic = makeLibrary()[0]
  if (topic === undefined) {
    throw new Error('The fixture library has no topics')
  }

  return topic
}

async function mountTopic(routes: Routes = {}, id = 1): Promise<VueWrapper> {
  fetchMock = stubApi({
    'GET /user': Response.json(user),
    'GET /conversations': Response.json([]),
    'GET /topics/1/subtopics': Response.json(biology()),
    // The forms list every topic and category, so they load the library first.
    'GET /topics': Response.json(makeLibrary()),
    'GET /categories': Response.json(makeCategories()),
    ...routes,
  })
  await router.push(`/topics/${id}`)
  const wrapper = mount(TopicView, { props: { id }, global: { plugins: [router] } })
  await flushPromises()

  return wrapper
}

function calls(route: string): number {
  return fetchMock.mock.calls.filter(([input, init]) => {
    const path = String(input).replace(import.meta.env.VITE_API_URL, '')
    return `${init?.method ?? 'GET'} ${path}` === route
  }).length
}

function subtopicTitles(wrapper: VueWrapper): string[] {
  return wrapper.findAll('[data-test="subtopic-title"]').map((title) => title.text())
}

function captions(wrapper: VueWrapper): string[] {
  return wrapper.findAll('[data-test="subtopic-caption"]').map((caption) => caption.text())
}

async function submitForm(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

async function pickFromSubtopicMenu(
  wrapper: VueWrapper,
  item: 'edit' | 'delete',
  subtopicTitle = 'Photosynthesis',
): Promise<void> {
  await wrapper
    .get(`[data-test="subtopic-menu"][aria-label="More for ${subtopicTitle}"]`)
    .trigger('click')
  await wrapper.get(`[data-test="subtopic-menu-${item}"]`).trigger('click')
  await flushPromises()
}

describe('TopicView', () => {
  beforeAll(() => {
    // jsdom doesn't implement showModal.
    HTMLDialogElement.prototype.showModal = vi.fn<() => void>()
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

  it('shows the topic with its subtopics, each linking to its own page', async () => {
    const wrapper = await mountTopic()

    expect(wrapper.get('[data-test="topic-title"]').text()).toBe('Biology')
    expect(wrapper.get('[data-test="topic-meta"]').text()).toBe('3 subtopics · 9 cards due today')
    expect(wrapper.get('[data-test="topic-description"]').text()).toBe(
      'How living things work, from cells to whole ecosystems.',
    )
    expect(wrapper.get('[data-test="crumb-library"]').attributes('href')).toBe('/topics')
    expect(subtopicTitles(wrapper)).toEqual(['Photosynthesis', 'Cell respiration', 'Chlorophyll'])
    expect(wrapper.get('[data-test="subtopic"]').attributes('href')).toBe('/subtopics/101')
    // Only this topic is asked for, not the whole library.
    expect(calls('GET /topics')).toBe(0)
  })

  it('practises the topic', async () => {
    const wrapper = await mountTopic()

    await wrapper.get('[data-test="practice"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/practice?topic=1')
  })

  it('shows the not found page for a topic that isn’t yours', async () => {
    const wrapper = await mountTopic({
      'GET /topics/1/subtopics': Response.json({ message: 'Not found.' }, { status: 404 }),
    })

    expect(wrapper.get('[data-test="not-found-title"]').text()).toBe('Oops. A little lost.')
    expect(router.currentRoute.value.fullPath).toBe('/topics/1')
  })

  it('says what to do when the topic cannot load, and tries again', async () => {
    const wrapper = await mountTopic({
      'GET /topics/1/subtopics': [
        () => Response.json({ message: 'Something went wrong.' }, { status: 500 }),
        () => Response.json(biology()),
      ],
    })

    expect(wrapper.get('[data-test="form-error"]').text()).toContain('Something went wrong.')

    await wrapper.get('[data-test="retry"]').trigger('click')
    await flushPromises()
    expect(subtopicTitles(wrapper)).toHaveLength(3)
  })

  it('finds subtopics by name and by what needs doing, with a count per filter', async () => {
    const wrapper = await mountTopic()

    expect(wrapper.get('[data-test="filter-all"]').text()).toBe('All 3')
    expect(wrapper.get('[data-test="filter-attention"]').text()).toBe('Needs attention 2')
    expect(wrapper.get('[data-test="filter-new"]').text()).toBe('New 0')

    await wrapper.get('[data-test="filter-attention"]').trigger('click')
    expect(subtopicTitles(wrapper)).toEqual(['Photosynthesis', 'Cell respiration'])

    await wrapper.get('[data-test="search"]').setValue('cell')
    expect(subtopicTitles(wrapper)).toEqual(['Cell respiration'])

    await wrapper.get('[data-test="filter-mastered"]').trigger('click')
    expect(wrapper.get('[data-test="no-matches"]').text()).toContain('No subtopics match')

    await wrapper.get('[data-test="clear-filters"]').trigger('click')
    expect(subtopicTitles(wrapper)).toHaveLength(3)
    expect((wrapper.get('[data-test="search"]').element as HTMLInputElement).value).toBe('')
  })

  it('invites you to add the first subtopic of an empty topic', async () => {
    const wrapper = await mountTopic({
      'GET /topics/1/subtopics': Response.json(makeTopic()),
    })

    expect(wrapper.get('[data-test="no-subtopics"]').text()).toContain('No subtopics yet')
    // Nothing to search or filter yet.
    expect(wrapper.find('[data-test="search"]').exists()).toBe(false)
  })

  it('adds a subtopic to the topic and says Sprout is making its cards', async () => {
    const respiration = makeSubtopic({
      id: 501,
      title: 'Respiration',
      is_new: true,
      generation_status: 'generating',
    })
    const wrapper = await mountTopic({
      'POST /subtopics': Response.json({ subtopic: respiration }, { status: 201 }),
    })

    await wrapper.get('[data-test="add-subtopic"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('dialog h2').text()).toBe('New subtopic')
    expect((wrapper.get('[data-test="main-topic"]').element as HTMLSelectElement).value).toBe('1')

    await wrapper.get('[data-test="name"]').setValue('Respiration')
    await submitForm(wrapper)

    expect(subtopicTitles(wrapper)).toContain('Respiration')
    expect(wrapper.get('[data-test="toast"]').text()).toContain('Added Respiration')
    expect(captions(wrapper)).toContain('Sprout is making your cards…')
    wrapper.unmount()
  })

  it('edits a subtopic with its own notes filled in', async () => {
    const wrapper = await mountTopic({
      'PUT /subtopics/101': Response.json({
        subtopic: makeSubtopic({ title: 'Photosynthesis basics' }),
      }),
    })

    await pickFromSubtopicMenu(wrapper, 'edit')

    expect(wrapper.get('dialog h2').text()).toBe('Edit subtopic')
    expect((wrapper.get('[data-test="notes"]').element as HTMLTextAreaElement).value).toBe(
      'Plants use chlorophyll to capture light.',
    )

    await wrapper.get('[data-test="name"]').setValue('Photosynthesis basics')
    await submitForm(wrapper)

    expect(wrapper.find('dialog').exists()).toBe(false)
    expect(subtopicTitles(wrapper)).toContain('Photosynthesis basics')
  })

  it('says where a subtopic went when you move it to another topic', async () => {
    const wrapper = await mountTopic({
      'PUT /subtopics/101': Response.json({ subtopic: makeSubtopic({ topic_id: 2 }) }),
    })

    await pickFromSubtopicMenu(wrapper, 'edit')
    await wrapper.get('[data-test="main-topic"]').setValue('2')
    await submitForm(wrapper)

    expect(subtopicTitles(wrapper)).toEqual(['Cell respiration', 'Chlorophyll'])
    expect(wrapper.get('[data-test="toast"]').text()).toContain('Moved to Chemistry')
  })

  it('deletes a subtopic once you confirm, and keeps the others', async () => {
    const wrapper = await mountTopic({
      'DELETE /subtopics/101': new Response(null, { status: 204 }),
    })

    await pickFromSubtopicMenu(wrapper, 'delete')
    await wrapper.get('[data-test="confirm-delete"]').trigger('click')
    await flushPromises()

    expect(subtopicTitles(wrapper)).toEqual(['Cell respiration', 'Chlorophyll'])
    expect(wrapper.get('[data-test="toast"]').text()).toContain('Deleted Photosynthesis')
  })

  it('edits the topic from its menu', async () => {
    const wrapper = await mountTopic({
      'PUT /topics/1': Response.json(makeTopic({ title: 'Biology basics' })),
    })

    await wrapper.get('[data-test="topic-menu"]').trigger('click')
    await wrapper.get('[data-test="topic-menu-edit"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('dialog h2').text()).toBe('Edit topic')

    await wrapper.get('[data-test="name"]').setValue('Biology basics')
    await submitForm(wrapper)

    expect(wrapper.get('[data-test="topic-title"]').text()).toBe('Biology basics')
  })

  it('goes back to the library after deleting the topic, which says so', async () => {
    const wrapper = await mountTopic({
      'DELETE /topics/1': new Response(null, { status: 204 }),
    })

    await wrapper.get('[data-test="topic-menu"]').trigger('click')
    await wrapper.get('[data-test="topic-menu-delete"]').trigger('click')
    await wrapper.get('[data-test="confirm-delete-topic"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('topics')
    expect(window.history.state.deletedTopic).toBe('Biology')
  })

  it('starts reading the source of a topic you just added', async () => {
    fetchMock = stubApi({})
    await router.push({ name: 'topic', params: { id: 1 }, state: { suggestSubtopics: true } })
    const wrapper = await mountTopic({
      'POST /topics/1/subtopic-suggestions': Response.json({
        suggestions: [{ title: 'Cadence', description: null, notes: null }],
      }),
    })

    expect(wrapper.get('dialog h2').text()).toBe('Sprout suggests these subtopics')
    // Only once: the history entry forgets it.
    expect(window.history.state.suggestSubtopics).toBe(false)
  })

  it('asks again while cards are being made, until they are ready', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const generating = biology()
    const first = generating.subtopics[0]
    if (first !== undefined) {
      first.generation_status = 'generating'
    }
    const wrapper = await mountTopic({
      'GET /topics/1/subtopics': [() => Response.json(generating), () => Response.json(biology())],
    })
    expect(captions(wrapper)).toContain('Sprout is making your cards…')

    await vi.advanceTimersByTimeAsync(pollInterval)
    await flushPromises()
    expect(calls('GET /topics/1/subtopics')).toBe(2)
    expect(captions(wrapper)).not.toContain('Sprout is making your cards…')

    await vi.advanceTimersByTimeAsync(pollInterval * 5)
    expect(calls('GET /topics/1/subtopics')).toBe(2)
  })

  it('shows a subtopic whose cards could not be made', async () => {
    const failed = biology()
    const first = failed.subtopics[0]
    if (first !== undefined) {
      first.generation_status = 'failed'
    }
    const wrapper = await mountTopic({ 'GET /topics/1/subtopics': Response.json(failed) })

    expect(captions(wrapper)).toContain("Sprout couldn't make its cards. Try again on its page.")
  })
})
