import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { ApiError } from '@/lib/api'
import TopicForm, {
  type TopicFormMode,
  type TopicFormValues,
} from '@/components/knowledgeMap/TopicForm.vue'

const emptyValues: TopicFormValues = {
  title: '',
  description: '',
  notes: '',
  categoryId: 1,
  newCategoryName: '',
  topicId: 1,
}

function mountForm(
  mode: TopicFormMode,
  initialValues: TopicFormValues = emptyValues,
  extraProps: { saving?: boolean; error?: ApiError | null; framed?: boolean } = {},
): VueWrapper {
  return mount(TopicForm, {
    props: {
      ...extraProps,
      mode,
      initialValues,
      categoryOptions: [
        { value: '1', label: 'Science' },
        { value: '2', label: 'Technology' },
      ],
      topicOptions: [
        { value: '1', label: 'Biology' },
        { value: '2', label: 'Chemistry' },
      ],
    },
  })
}

describe('TopicForm', () => {
  it("can't be saved without a name", async () => {
    const wrapper = mountForm('add-topic')

    expect(wrapper.get('[data-test="save"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="name"]').setValue('   ')
    expect(wrapper.get('[data-test="save"]').attributes('disabled')).toBeDefined()
  })

  it('asks a new topic for its category and saves trimmed values', async () => {
    const wrapper = mountForm('add-topic')

    expect(wrapper.get('[data-test="form-title"]').text()).toBe('New topic')
    expect(wrapper.find('[data-test="main-topic"]').exists()).toBe(false)

    await wrapper.get('[data-test="name"]').setValue('  Astronomy ')
    await wrapper.get('[data-test="category"]').setValue('2')
    await wrapper.get('[data-test="description"]').setValue('Stars and planets.')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          title: 'Astronomy',
          description: 'Stars and planets.',
          notes: '',
          categoryId: 2,
          newCategoryName: '',
          topicId: 1,
        },
      ],
    ])
  })

  it('makes a category of your own, which needs a name', async () => {
    const wrapper = mountForm('add-topic')
    await wrapper.get('[data-test="name"]').setValue('Guitar')

    await wrapper.get('[data-test="category"]').setValue('new')
    expect(wrapper.get('[data-test="save"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="new-category"]').setValue(' Music ')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      title: 'Guitar',
      categoryId: null,
      newCategoryName: 'Music',
    })
  })

  it('lets you move a subtopic to another main topic', async () => {
    const wrapper = mountForm('edit-subtopic', { ...emptyValues, title: 'Chlorophyll' })

    expect(wrapper.get('[data-test="form-title"]').text()).toBe('Edit subtopic')
    expect(wrapper.get('[data-test="save"]').text()).toBe('Save changes')

    await wrapper.get('[data-test="main-topic"]').setValue('2')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ title: 'Chlorophyll', topicId: 2 })
  })

  it('closes without saving', async () => {
    const wrapper = mountForm('add-subtopic')

    await wrapper.get('[data-test="close-form"]').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it("can't be saved again while it saves", () => {
    const wrapper = mountForm('edit-topic', { ...emptyValues, title: 'Biology' }, { saving: true })

    expect(wrapper.get('[data-test="save"]').text()).toBe('Saving…')
    expect(wrapper.get('[data-test="save"]').attributes('disabled')).toBeDefined()
  })

  it('shows field errors next to their field and other errors above the buttons', () => {
    const fieldError = new ApiError(422, 'Pick a category, or name a new one.', {
      category_id: ['Pick a category, or name a new one.'],
    })
    const keyError = new ApiError(422, 'Connect your AI key to start learning.', {
      ai_key: ['Connect your AI key to start learning.'],
    })

    expect(mountForm('add-topic', emptyValues, { error: fieldError }).text()).toContain(
      'Pick a category, or name a new one.',
    )
    expect(
      mountForm('add-subtopic', emptyValues, { error: keyError })
        .get('[data-test="form-error"]')
        .text(),
    ).toBe('Connect your AI key to start learning.')
  })

  it('leaves its own title and close button to a dialog', () => {
    const wrapper = mountForm('edit-subtopic', emptyValues, { framed: false })

    expect(wrapper.find('[data-test="form-title"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="close-form"]').exists()).toBe(false)
  })
})
