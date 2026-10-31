import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { makeConversation, makeMaterial, makeSummary } from '@/__tests__/conversationFixtures'
import { stubApi } from '@/__tests__/stubApi'
import { readPollInterval, readTimeoutMessage } from '@/composables/chat/useComposerAttachments'
import { useAuthStore, type User } from '@/stores/auth'
import ConversationView from '../ConversationView.vue'

/*
 * Attaching files in an open conversation (../specs/chat-attachments.md): the composer's checks,
 * uploading and waiting until Sprout has read a file, and what sending does with them.
 */

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

type Routes = Parameters<typeof stubApi>[0]

let fetchMock: ReturnType<typeof stubApi>

async function mountConversation(routes: Routes = {}): Promise<VueWrapper> {
  fetchMock = stubApi({
    'GET /user': Response.json(user),
    'GET /conversations': Response.json([makeSummary()]),
    'GET /conversations/10': Response.json(makeConversation()),
    ...routes,
  })
  await router.push('/conversations/10')
  const wrapper = mount(ConversationView, { props: { id: 10 }, global: { plugins: [router] } })
  await flushPromises()

  return wrapper
}

function file(name: string, bytes = 1000): File {
  const picked = new File(['text'], name)
  Object.defineProperty(picked, 'size', { value: bytes })

  return picked
}

async function attach(wrapper: VueWrapper, files: File[]): Promise<void> {
  const input = wrapper.get('[data-test="file-input"]')
  Object.defineProperty(input.element, 'files', { value: files, configurable: true })
  await input.trigger('change')
  await flushPromises()
}

function calls(route: string): number {
  return fetchMock.mock.calls.filter(([input, init]) => {
    const path = String(input).replace(import.meta.env.VITE_API_URL, '')

    return `${init?.method ?? 'GET'} ${path}` === route
  }).length
}

function sentBody(route: string): unknown {
  const call = fetchMock.mock.calls.find(([input, init]) => {
    const path = String(input).replace(import.meta.env.VITE_API_URL, '')

    return `${init?.method ?? 'GET'} ${path}` === route
  })

  return JSON.parse(String(call?.[1]?.body))
}

function chipNames(wrapper: VueWrapper): string[] {
  return wrapper
    .findAll('[data-test="composer-attachments"] [data-test="attachment-name"]')
    .map((name) => name.text())
}

function chipErrors(wrapper: VueWrapper): string[] {
  return wrapper
    .findAll('[data-test="composer-attachments"] [data-test="attachment-chip"]')
    .map((chip) => {
      const error = chip.find('[data-test="attachment-error"]')

      return error.exists() ? error.text() : ''
    })
}

function sendButton(wrapper: VueWrapper): ReturnType<VueWrapper['get']> {
  return wrapper.get('[data-test="composer-send"]')
}

/** Answers for two uploads that come back ready straight away (ids 7 and 8). */
function twoReadyUploads(): Routes {
  return {
    'POST /materials': [
      () => Response.json(makeMaterial({ id: 7, status: 'ready' }), { status: 201 }),
      () =>
        Response.json(makeMaterial({ id: 8, original_filename: 'b.md', status: 'ready' }), {
          status: 201,
        }),
    ],
  }
}

describe('Attachments in a conversation', () => {
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

  it('opens the file picker from a labelled button, for document types only', async () => {
    const wrapper = await mountConversation()

    const button = wrapper.get('[data-test="attach"]')
    expect(button.element.tagName).toBe('BUTTON')
    expect(button.attributes('aria-label')).toBe('Attach files')
    expect(wrapper.get('[data-test="file-input"]').attributes('accept')).toBe(
      '.pdf,.docx,.doc,.pages,.txt,.md',
    )
  })

  it('refuses a file that is too big or of another type without uploading it', async () => {
    const wrapper = await mountConversation()

    await attach(wrapper, [file('photo.png'), file('Lecture.pdf', 11 * 1024 * 1024)])

    expect(chipNames(wrapper)).toEqual(['photo.png', 'Lecture.pdf'])
    expect(chipErrors(wrapper)).toEqual([
      'Upload a PDF, Word, Pages, text or Markdown file.',
      'Keep files under 10 MB.',
    ])
    expect(calls('POST /materials')).toBe(0)
  })

  it('takes five files per message and says so when you add a sixth', async () => {
    const wrapper = await mountConversation()

    // Refused files count too, until you remove them.
    await attach(
      wrapper,
      ['a', 'b', 'c', 'd', 'e', 'f'].map((name) => file(`${name}.png`)),
    )

    expect(chipNames(wrapper)).toHaveLength(5)
    expect(wrapper.get('[data-test="attachment-notice"]').text()).toBe(
      'Attach up to 5 files per message.',
    )
  })

  it('uploads at once, waits until Sprout has read the file, and only then lets you send', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const wrapper = await mountConversation({
      'POST /materials': () =>
        Response.json(makeMaterial({ status: 'processing' }), { status: 201 }),
      'GET /materials/7': [
        () => Response.json(makeMaterial({ status: 'processing' })),
        () => Response.json(makeMaterial({ status: 'ready' })),
      ],
    })
    await wrapper.get('[data-test="composer-input"]').setValue('Here are my notes')

    await attach(wrapper, [file('Lecture 1.pdf')])
    expect(calls('POST /materials')).toBe(1)
    expect(sendButton(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-test="composer-hint"]').text()).toBe(
      'Wait until your files are ready.',
    )

    await vi.advanceTimersByTimeAsync(readPollInterval)
    expect(sendButton(wrapper).attributes('disabled')).toBeDefined()

    await vi.advanceTimersByTimeAsync(readPollInterval)
    await flushPromises()
    expect(calls('GET /materials/7')).toBe(2)
    expect(sendButton(wrapper).attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-test="composer-hint"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="attachments-status"]').text()).toBe('Lecture 1.pdf is ready.')
  })

  it('shows why Sprout couldn’t read a file, and keeps Send off until you remove it', async () => {
    const unreadable =
      "We couldn't find any text in this file. If it's a scan, copy the text into a file and upload that."
    const wrapper = await mountConversation({
      'POST /materials': () =>
        Response.json(makeMaterial({ status: 'failed', error: unreadable }), { status: 201 }),
      'DELETE /materials/7': () => new Response(null, { status: 204 }),
    })
    await wrapper.get('[data-test="composer-input"]').setValue('Here are my notes')

    await attach(wrapper, [file('scan.pdf')])
    expect(chipErrors(wrapper)).toEqual([unreadable])
    expect(sendButton(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-test="composer-hint"]').text()).toBe(
      "Remove the files Sprout couldn't read.",
    )

    const remove = wrapper.get('[data-test="remove-attachment"]')
    expect(remove.attributes('aria-label')).toBe('Remove scan.pdf')
    await remove.trigger('click')
    await flushPromises()

    expect(chipNames(wrapper)).toEqual([])
    expect(calls('DELETE /materials/7')).toBe(1)
    expect(sendButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('removes a chip even when deleting the file fails, without blocking you', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = await mountConversation({
      'POST /materials': () => Response.json(makeMaterial({ status: 'ready' }), { status: 201 }),
      'DELETE /materials/7': () => Response.json({ message: 'Server error' }, { status: 500 }),
    })

    await attach(wrapper, [file('Lecture 1.pdf')])
    await wrapper.get('[data-test="remove-attachment"]').trigger('click')
    await flushPromises()

    expect(chipNames(wrapper)).toEqual([])
    expect(wrapper.find('[data-test="form-error"]').exists()).toBe(false)
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('stops asking after a file once the page is gone', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const wrapper = await mountConversation({
      'POST /materials': () =>
        Response.json(makeMaterial({ status: 'processing' }), { status: 201 }),
      'GET /materials/7': () => Response.json(makeMaterial({ status: 'processing' })),
    })
    await attach(wrapper, [file('Lecture 1.pdf')])

    await vi.advanceTimersByTimeAsync(readPollInterval)
    expect(calls('GET /materials/7')).toBe(1)

    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(readPollInterval * 5)
    expect(calls('GET /materials/7')).toBe(1)
  })

  it('gives up on a file Sprout takes too long to read', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const wrapper = await mountConversation({
      'POST /materials': () =>
        Response.json(makeMaterial({ status: 'processing' }), { status: 201 }),
      'GET /materials/7': () => Response.json(makeMaterial({ status: 'processing' })),
    })
    await attach(wrapper, [file('Lecture 1.pdf')])

    await vi.advanceTimersByTimeAsync(2 * 60_000 + readPollInterval)
    await flushPromises()

    expect(chipErrors(wrapper)).toEqual([readTimeoutMessage])
  })

  it('sends the ready files with your message and shows them on it', async () => {
    const sentConversation = makeConversation({
      messages: [
        ...makeConversation().messages,
        {
          id: 103,
          role: 'user',
          content: 'Here are my notes',
          materials: [makeMaterial({ id: 7 }), makeMaterial({ id: 8, original_filename: 'b.md' })],
          created_at: '2026-10-30T16:00:00.000000Z',
        },
        { id: 104, role: 'tutor', content: 'Thanks!', materials: [], created_at: '' },
      ],
    })
    const wrapper = await mountConversation({
      ...twoReadyUploads(),
      'POST /conversations/10/messages': () => Response.json(sentConversation, { status: 201 }),
    })

    await attach(wrapper, [file('Lecture 1.pdf'), file('b.md')])
    await wrapper.get('[data-test="composer-input"]').setValue('Here are my notes')
    await sendButton(wrapper).trigger('click')
    await flushPromises()

    expect(sentBody('POST /conversations/10/messages')).toEqual({
      message: 'Here are my notes',
      material_ids: [7, 8],
    })
    // The composer starts empty again, and the files are on your message.
    expect(chipNames(wrapper)).toEqual([])
    const input = wrapper.get('[data-test="composer-input"]').element as HTMLTextAreaElement
    expect(input.value).toBe('')
    const messages = wrapper.findAll('[data-test="chat-message"]')
    expect(
      messages[2]?.findAll('[data-test="attachment-name"]').map((name) => name.text()),
    ).toEqual(['Lecture 1.pdf', 'b.md'])
  })

  it('puts your text and files back when the tutor can’t answer, to send them again', async () => {
    const wrapper = await mountConversation({
      ...twoReadyUploads(),
      'POST /conversations/10/messages': () =>
        Response.json(
          { message: 'The tutor can’t answer right now. Try again in a moment.' },
          { status: 503 },
        ),
    })

    await attach(wrapper, [file('Lecture 1.pdf'), file('b.md')])
    await wrapper.get('[data-test="composer-input"]').setValue('Here are my notes')
    await sendButton(wrapper).trigger('click')
    await flushPromises()

    const input = wrapper.get('[data-test="composer-input"]').element as HTMLTextAreaElement
    expect(input.value).toBe('Here are my notes')
    expect(chipNames(wrapper)).toEqual(['Lecture 1.pdf', 'b.md'])
    expect(wrapper.get('[data-test="form-error"]').text()).toBe(
      'The tutor can’t answer right now. Try again in a moment.',
    )
    // The same files go again, without uploading them again.
    expect(sendButton(wrapper).attributes('disabled')).toBeUndefined()
    expect(calls('POST /materials')).toBe(2)
  })

  it('puts an error about one file on that file’s chip', async () => {
    const alreadySent = 'This file is already in a message. Upload it again to send it here.'
    const wrapper = await mountConversation({
      ...twoReadyUploads(),
      'POST /conversations/10/messages': () =>
        Response.json(
          { message: alreadySent, errors: { 'material_ids.1': [alreadySent] } },
          { status: 422 },
        ),
    })

    await attach(wrapper, [file('Lecture 1.pdf'), file('b.md')])
    await wrapper.get('[data-test="composer-input"]').setValue('Here are my notes')
    await sendButton(wrapper).trigger('click')
    await flushPromises()

    expect(chipErrors(wrapper)).toEqual(['', alreadySent])
    // The chip says it; no second copy above the composer.
    expect(wrapper.find('[data-test="form-error"]').exists()).toBe(false)
    expect(sendButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('shows an error about the files as a whole above the composer', async () => {
    const wrapper = await mountConversation({
      ...twoReadyUploads(),
      'POST /conversations/10/messages': () =>
        Response.json(
          {
            message: 'Attach up to 5 files per message.',
            errors: { material_ids: ['Attach up to 5 files per message.'] },
          },
          { status: 422 },
        ),
    })

    await attach(wrapper, [file('Lecture 1.pdf')])
    await wrapper.get('[data-test="composer-input"]').setValue('Here are my notes')
    await sendButton(wrapper).trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="form-error"]').text()).toBe('Attach up to 5 files per message.')
  })
})
