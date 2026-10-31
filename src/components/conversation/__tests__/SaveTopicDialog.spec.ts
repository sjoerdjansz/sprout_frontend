import { beforeAll, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ApiError } from '@/lib/api'
import { makeConversation } from '@/__tests__/conversationFixtures'
import { makeCategories } from '@/__tests__/topicFixtures'
import type { Draft } from '@/stores/conversations'
import SaveTopicDialog from '../SaveTopicDialog.vue'

const draft = makeConversation().draft as Draft
const categories = makeCategories()

describe('SaveTopicDialog', () => {
  beforeAll(() => {
    // jsdom doesn't implement modal dialogs.
    HTMLDialogElement.prototype.showModal = vi.fn<() => void>()
  })

  it('starts from the tutor’s draft', () => {
    const wrapper = mount(SaveTopicDialog, { props: { draft, categories } })

    const value = (selector: string): string =>
      (wrapper.get(selector).element as HTMLInputElement).value
    expect(value('[data-test="topic-title"]')).toBe('Biomechanics of running')
    expect(value('[data-test="goal-description"]')).toBe(
      'Explain the phases of the running gait to the runners I coach.',
    )
    expect(value('[data-test="goal-deadline"]')).toBe('')
    expect(wrapper.findAll('[data-test="subtopic"]')).toHaveLength(1)
  })

  it('lets you add and remove subtopics before saving', async () => {
    const wrapper = mount(SaveTopicDialog, { props: { draft, categories } })

    await wrapper.get('[data-test="add-subtopic"]').trigger('click')
    const subtopics = wrapper.findAll('[data-test="subtopic"]')
    await subtopics[1]?.get('[data-test="subtopic-title"]').setValue('Ground reaction force')
    await subtopics[1]?.get('[data-test="subtopic-content"]').setValue('The ground pushes back.')
    await subtopics[0]?.get('[data-test="remove-subtopic"]').trigger('click')
    await wrapper.get('[data-test="goal-deadline"]').setValue('2026-12-01')
    await wrapper.get('[data-test="goal-recall"]').setValue('80')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          title: 'Biomechanics of running',
          category_id: 1,
          goal: {
            description: 'Explain the phases of the running gait to the runners I coach.',
            deadline: '2026-12-01',
            recall_percentage: 80,
          },
          subtopics: [{ title: 'Ground reaction force', content: 'The ground pushes back.' }],
        },
      ],
    ])
  })

  it('preselects the category the tutor suggested, whatever its capitalisation', async () => {
    const wrapper = mount(SaveTopicDialog, {
      props: { draft: { ...draft, category: 'languages' }, categories },
    })

    expect((wrapper.get('[data-test="category"]').element as HTMLSelectElement).value).toBe('4')
    expect(wrapper.find('[data-test="new-category"]').exists()).toBe(false)

    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ category_id: 4 })
  })

  it('prefills a new category when the tutor suggested one you don’t have', async () => {
    const wrapper = mount(SaveTopicDialog, {
      props: { draft: { ...draft, category: 'Sport' }, categories },
    })

    expect((wrapper.get('[data-test="category"]').element as HTMLSelectElement).value).toBe('new')
    expect((wrapper.get('[data-test="new-category"]').element as HTMLInputElement).value).toBe(
      'Sport',
    )

    await wrapper.get('form').trigger('submit')

    const saved = wrapper.emitted('save')?.[0]?.[0]
    expect(saved).toMatchObject({ category_name: 'Sport' })
    expect(saved).not.toHaveProperty('category_id')
  })

  it('starts on your first category without a suggestion', () => {
    const wrapper = mount(SaveTopicDialog, {
      props: { draft: { ...draft, category: null }, categories },
    })

    expect((wrapper.get('[data-test="category"]').element as HTMLSelectElement).value).toBe('1')
  })

  it('asks no category for a continued topic, which keeps its own', async () => {
    const wrapper = mount(SaveTopicDialog, { props: { draft, categories: null } })

    expect(wrapper.find('[data-test="category"]').exists()).toBe(false)

    await wrapper.get('form').trigger('submit')

    const saved = wrapper.emitted('save')?.[0]?.[0]
    expect(saved).not.toHaveProperty('category_id')
    expect(saved).not.toHaveProperty('category_name')
  })

  it('shows a category problem next to the category', () => {
    const error = new ApiError(422, 'Pick a category for this topic.', {
      category_id: ['Pick a category for this topic.'],
    })

    const wrapper = mount(SaveTopicDialog, { props: { draft, categories, error } })

    expect(wrapper.text()).toContain('Pick a category for this topic.')
    expect(wrapper.find('[data-test="form-error"]').exists()).toBe(false)
  })

  it('shows what’s missing next to each field', () => {
    const error = new ApiError(422, 'Pick a deadline for your goal.', {
      'goal.deadline': ['Pick a deadline for your goal.'],
      'subtopics.0.content': ['Add notes to every subtopic, so we can make cards from them.'],
    })

    const wrapper = mount(SaveTopicDialog, { props: { draft, categories, error } })

    expect(wrapper.text()).toContain('Pick a deadline for your goal.')
    expect(wrapper.get('[data-test="subtopic"]').text()).toContain(
      'Add notes to every subtopic, so we can make cards from them.',
    )
    expect(wrapper.find('[data-test="form-error"]').exists()).toBe(false)
  })

  it('shows a problem that isn’t about one field above the button', () => {
    const error = new ApiError(
      429,
      "You've saved a few times in a row. Wait a minute and try again.",
    )

    const wrapper = mount(SaveTopicDialog, { props: { draft, categories, error } })

    expect(wrapper.get('[data-test="form-error"]').text()).toBe(
      "You've saved a few times in a row. Wait a minute and try again.",
    )
  })

  it('can’t be closed while it saves', async () => {
    const wrapper = mount(SaveTopicDialog, { props: { draft, categories, saving: true } })

    await wrapper.get('[data-test="dialog-close"]').trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
    expect(wrapper.get('[data-test="save-topic"]').text()).toBe('Saving…')
  })
})
