import { beforeAll, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { ApiError } from '@/lib/api'
import TopicFormDialog, {
  type TopicFormMode,
  type TopicFormValues,
} from '@/components/knowledgeMap/TopicFormDialog.vue'

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
  extraProps: { saving?: boolean; error?: ApiError | null } = {},
): VueWrapper {
  return mount(TopicFormDialog, {
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

describe('TopicFormDialog', () => {
  beforeAll(() => {
    // jsdom doesn't implement showModal.
    HTMLDialogElement.prototype.showModal = vi.fn<() => void>()
  })

  it("can't be saved without a name", async () => {
    const wrapper = mountForm('add-topic')

    expect(wrapper.get('[data-test="save"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="name"]').setValue('   ')
    expect(wrapper.get('[data-test="save"]').attributes('disabled')).toBeDefined()
  })

  it('asks a new topic for its category and saves trimmed values', async () => {
    const wrapper = mountForm('add-topic')

    expect(wrapper.get('h2').text()).toBe('New topic')
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

  it('puts the focus on the name when it opens', () => {
    const wrapper = mountForm('add-topic')

    expect(wrapper.get('[data-test="name"]').attributes('autofocus')).toBeDefined()
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

    expect(wrapper.get('h2').text()).toBe('Edit subtopic')
    expect(wrapper.get('[data-test="save"]').text()).toBe('Save changes')

    await wrapper.get('[data-test="main-topic"]').setValue('2')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ title: 'Chlorophyll', topicId: 2 })
  })

  it('closes without saving', async () => {
    const wrapper = mountForm('add-subtopic')

    await wrapper.get('[data-test="dialog-close"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
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
    const rateLimited = new ApiError(
      429,
      "You've saved a few subtopics in a row. Wait a minute and try again.",
    )

    expect(mountForm('add-topic', emptyValues, { error: fieldError }).text()).toContain(
      'Pick a category, or name a new one.',
    )
    expect(
      mountForm('add-subtopic', emptyValues, { error: rateLimited })
        .get('[data-test="form-error"]')
        .text(),
    ).toBe("You've saved a few subtopics in a row. Wait a minute and try again.")
  })

  it('says honestly what happens with the notes of a topic and of a subtopic', () => {
    expect(mountForm('edit-topic').text()).toContain('After you save, Sprout suggests subtopics')
    expect(mountForm('add-subtopic').text()).toContain(
      'Sprout turns these into flashcards and questions after you save.',
    )
  })

  it('counts the notes against the limit and previews them as Markdown', async () => {
    const wrapper = mountForm('add-subtopic')

    await wrapper.get('[data-test="notes"]').setValue('**Light** and water')
    expect(wrapper.get('[data-test="notes-count"]').text()).toBe('19 / 10,000')

    await wrapper.get('[data-test="tab-preview"]').trigger('click')
    expect(wrapper.get('[data-test="notes-preview"] strong').text()).toBe('Light')

    await wrapper.get('[data-test="tab-write"]').trigger('click')
    await wrapper.get('[data-test="notes"]').setValue('a'.repeat(10_001))
    expect(wrapper.get('[data-test="notes-count"]').classes()).toContain('text-ember-ink')
  })

  it('only says it is saving: the cards are made after the save', () => {
    const values = { ...emptyValues, title: 'Light', notes: 'Plants use light.' }

    expect(
      mountForm('add-subtopic', values, { saving: true }).get('[data-test="save"]').text(),
    ).toBe('Saving…')
  })
})
