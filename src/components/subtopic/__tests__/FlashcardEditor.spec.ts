import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { ApiError } from '@/lib/api'
import FlashcardEditor from '../FlashcardEditor.vue'

describe('FlashcardEditor', () => {
  it('needs a front and a back, and saves them trimmed', async () => {
    const wrapper = mount(FlashcardEditor, { props: { saving: false, error: null } })

    await wrapper.get('[data-test="card-front"]').setValue('  Where? ')
    expect(wrapper.get('[data-test="save-card"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="card-back"]').setValue(' In the chloroplasts. ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([[{ front: 'Where?', back: 'In the chloroplasts.' }]])
  })

  it('starts from the card you edit and shows a problem that is not about a field', () => {
    const wrapper = mount(FlashcardEditor, {
      props: {
        initialValues: { front: 'Front', back: 'Back' },
        saving: false,
        error: new ApiError(
          0,
          "Can't reach Sprout right now. Check your connection and try again.",
        ),
      },
    })

    expect((wrapper.get('[data-test="card-front"]').element as HTMLInputElement).value).toBe(
      'Front',
    )
    expect(wrapper.get('[data-test="form-error"]').text()).toContain("Can't reach Sprout")
  })
})
