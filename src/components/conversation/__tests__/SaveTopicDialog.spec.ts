import { beforeAll, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ApiError } from '@/lib/api'
import { makeConversation } from '@/__tests__/conversationFixtures'
import SaveTopicDialog from '../SaveTopicDialog.vue'

const draft = makeConversation().draft

describe('SaveTopicDialog', () => {
  beforeAll(() => {
    // jsdom doesn't implement modal dialogs.
    HTMLDialogElement.prototype.showModal = vi.fn<() => void>()
  })

  it('starts from the tutor’s draft', () => {
    const wrapper = mount(SaveTopicDialog, { props: { draft } })

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
    const wrapper = mount(SaveTopicDialog, { props: { draft } })

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

  it('shows what’s missing next to each field', () => {
    const error = new ApiError(422, 'Pick a deadline for your goal.', {
      'goal.deadline': ['Pick a deadline for your goal.'],
      'subtopics.0.content': ['Add notes to every subtopic, so we can make cards from them.'],
    })

    const wrapper = mount(SaveTopicDialog, { props: { draft, error } })

    expect(wrapper.text()).toContain('Pick a deadline for your goal.')
    expect(wrapper.get('[data-test="subtopic"]').text()).toContain(
      'Add notes to every subtopic, so we can make cards from them.',
    )
    expect(wrapper.find('[data-test="form-error"]').exists()).toBe(false)
  })

  it('shows a problem that isn’t about one field above the button', () => {
    const error = new ApiError(503, 'The tutor can’t answer right now. Try again in a moment.')

    const wrapper = mount(SaveTopicDialog, { props: { draft, error } })

    expect(wrapper.get('[data-test="form-error"]').text()).toBe(
      'The tutor can’t answer right now. Try again in a moment.',
    )
  })

  it('can’t be closed while it saves', async () => {
    const wrapper = mount(SaveTopicDialog, { props: { draft, saving: true } })

    await wrapper.get('[data-test="dialog-close"]').trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
    expect(wrapper.get('[data-test="save-topic"]').text()).toBe(
      'Saving… this can take a minute or two',
    )
  })
})
