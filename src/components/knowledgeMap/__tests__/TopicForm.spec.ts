import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
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

function mountForm(mode: TopicFormMode, initialValues: TopicFormValues = emptyValues): VueWrapper {
  return mount(TopicForm, {
    props: {
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
})
