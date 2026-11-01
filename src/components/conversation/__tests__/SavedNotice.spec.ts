import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import router from '@/router'
import type { SaveResult } from '@/stores/conversations'
import SavedNotice from '../SavedNotice.vue'

function makeSaveResult(addedSubtopics: number): SaveResult {
  return {
    topic: {
      id: 12,
      title: 'Biomechanics',
      goal: { description: 'Explain the gait', deadline: '2026-12-01', recall_percentage: 80 },
      subtopics: [{ id: 40, title: 'Gait cycle', generation_status: 'failed' }],
      created_at: '2026-10-30T15:20:11.000000Z',
    },
    added: { subtopics: addedSubtopics },
  }
}

function mountNotice(props: InstanceType<typeof SavedNotice>['$props']): VueWrapper {
  return mount(SavedNotice, { props, global: { plugins: [router] } })
}

describe('SavedNotice', () => {
  it('counts only the new subtopics, or names the topic when there are none', () => {
    expect(mountNotice({ result: makeSaveResult(4) }).text()).toContain(
      'Saved Biomechanics: 4 new subtopics',
    )
    const noneAdded = mountNotice({ result: makeSaveResult(0) }).text()
    expect(noneAdded).toContain('Saved Biomechanics')
    expect(noneAdded).not.toContain('new subtopic')
  })

  it('says which cards could not be made and where to try again', () => {
    const wrapper = mountNotice({ result: makeSaveResult(1), failedCount: 1 })

    expect(wrapper.get('[data-test="saved-failed"]').text()).toContain(
      "Sprout couldn't make cards for 1 subtopic.",
    )
    expect(wrapper.get('[data-test="saved-failed"] a').attributes('href')).toBe('/topics?topic=12')
  })

  it('shows why asking for the status failed', () => {
    const wrapper = mountNotice({
      result: makeSaveResult(1),
      generatingCount: 1,
      checkError: "Can't reach Sprout right now. Check your connection and try again.",
    })

    expect(wrapper.find('[data-test="saved-generating"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="check-error"]').text()).toContain("Can't reach Sprout")
  })
})
