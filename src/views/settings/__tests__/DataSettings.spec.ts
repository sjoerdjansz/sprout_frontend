import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { bodyOf, mountSettings } from '@/__tests__/mountSettings'
import { useAuthStore } from '@/stores/auth'

function download(body: string, filename: string, type: string): Response {
  return new Response(body, {
    headers: { 'Content-Type': type, 'Content-Disposition': `attachment; filename="${filename}"` },
  })
}

const tooOften = () =>
  Response.json(
    { message: 'You’ve done this a few times in a row. Wait a minute and try again.' },
    { status: 429 },
  )

describe('DataSettings', () => {
  const savedFiles: string[] = []

  beforeAll(() => {
    // jsdom has neither modal dialogs nor object URLs.
    HTMLDialogElement.prototype.showModal = vi.fn<() => void>()
    URL.createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:sprout')
    URL.revokeObjectURL = vi.fn<(url: string) => void>()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      savedFiles.push(this.download)
    })
  })

  beforeEach(() => {
    savedFiles.length = 0
    localStorage.clear()
    setActivePinia(createPinia())
    useAuthStore().setToken('1|abc')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exports your library as JSON and your cards as CSV', async () => {
    const { wrapper } = await mountSettings('/settings/data', {
      'GET /user/export': download('{}', 'sprout-export-2026-10-31.json', 'application/json'),
      'GET /user/export/flashcards': download('', 'sprout-flashcards-2026-10-31.csv', 'text/csv'),
    })

    await wrapper.get('[data-test="export"]').trigger('click')
    await flushPromises()

    expect(savedFiles).toEqual([
      'sprout-export-2026-10-31.json',
      'sprout-flashcards-2026-10-31.csv',
    ])
    expect(wrapper.get('[data-test="toast-title"]').text()).toBe('Export ready')
  })

  it('says to wait after too many exports', async () => {
    const { wrapper } = await mountSettings('/settings/data', { 'GET /user/export': tooOften })

    await wrapper.get('[data-test="export"]').trigger('click')
    await flushPromises()

    expect(savedFiles).toEqual([])
    expect(wrapper.get('[data-test="form-error"]').text()).toContain('Wait a minute')
  })

  it('resets your progress only after you confirm', async () => {
    const { wrapper, fetchMock } = await mountSettings('/settings/data', {
      'POST /user/progress/reset': new Response(null, { status: 204 }),
    })

    await wrapper.get('[data-test="reset"]').trigger('click')
    expect(fetchMock.mock.calls.some(([input]) => String(input).endsWith('/reset'))).toBe(false)

    await wrapper.get('[data-test="confirm-reset"]').trigger('click')
    await flushPromises()

    expect(fetchMock.mock.calls.some(([input]) => String(input).endsWith('/reset'))).toBe(true)
    expect(wrapper.find('[data-test="confirm-reset"]').exists()).toBe(false)
    expect(wrapper.get('[data-test="toast-title"]').text()).toBe('Progress reset')
  })

  it('keeps the reset dialog open with the reason when it fails', async () => {
    const { wrapper } = await mountSettings('/settings/data', {
      'POST /user/progress/reset': tooOften,
    })

    await wrapper.get('[data-test="reset"]').trigger('click')
    await wrapper.get('[data-test="confirm-reset"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="confirm-reset"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="form-error"]').text()).toContain('Wait a minute')
  })

  it('deletes your account once you type your email, and signs you out', async () => {
    const { wrapper, fetchMock } = await mountSettings('/settings/data', {
      'DELETE /user': new Response(null, { status: 204 }),
    })

    await wrapper.get('[data-test="delete-account"]').trigger('click')
    expect(wrapper.get('[data-test="confirm-delete"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="confirm-email"]').setValue('ADA@example.com')
    await wrapper.get('dialog form').trigger('submit')
    await flushPromises()

    expect(bodyOf(fetchMock, 'DELETE /user')).toEqual({ email: 'ADA@example.com' })
    expect(useAuthStore().isAuthenticated).toBe(false)
  })

  it('shows why the email didn’t match', async () => {
    const message = 'Type your email address exactly as it is on your account.'
    const { wrapper } = await mountSettings('/settings/data', {
      'DELETE /user': Response.json({ message, errors: { email: [message] } }, { status: 422 }),
    })

    await wrapper.get('[data-test="delete-account"]').trigger('click')
    await wrapper.get('[data-test="confirm-email"]').setValue('ada@example.com')
    await wrapper.get('dialog form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain(message)
    expect(useAuthStore().isAuthenticated).toBe(true)
  })
})
