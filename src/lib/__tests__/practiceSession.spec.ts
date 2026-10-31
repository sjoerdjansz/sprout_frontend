import { describe, expect, it } from 'vitest'
import {
  availableModes,
  blockAmount,
  blocksFromPlan,
  buildBlocks,
  cardsDone,
  defaultsFromSettings,
  emptyResult,
  estimateMinutes,
  explanationParts,
  formatInterval,
  isBlockComplete,
  mixableModes,
  pickCards,
  pickConcept,
  pickQuestions,
  resultLine,
  resultsFromDone,
  resumeIndex,
  scopeTitle,
  sessionPlan,
  slippedItems,
  summariseCards,
  unavailableReason,
  type PracticeMaterial,
  type PracticeOptions,
  type PracticeScope,
} from '@/lib/practiceSession'
import { makeFlashcard, makeOpenQuestion, makeQuestion } from '@/__tests__/materialFixtures'
import { makeDone } from '@/__tests__/practiceFixtures'
import { dateFromToday, makeLibrary } from '@/__tests__/topicFixtures'
import type { Topic } from '@/stores/topics'

function biology(): Topic {
  const topic = makeLibrary()[0]
  if (topic === undefined) {
    throw new Error('No Biology')
  }

  return topic
}

/** Biology as a whole: Photosynthesis (101), Cell respiration (102), Chlorophyll (103). */
function wholeTopic(): PracticeScope {
  const topic = biology()

  return { topicId: topic.id, topicTitle: topic.title, subtopic: null, subtopics: topic.subtopics }
}

function oneSubtopic(): PracticeScope {
  const topic = biology()
  const photosynthesis = topic.subtopics[0] ?? null

  return {
    topicId: topic.id,
    topicTitle: topic.title,
    subtopic: photosynthesis,
    subtopics: photosynthesis ? [photosynthesis] : [],
  }
}

function options(overrides: Partial<PracticeOptions> = {}): PracticeOptions {
  return {
    modes: ['cards'],
    cardCount: 20,
    questionCount: 10,
    dueFirst: true,
    interleave: false,
    secondTry: true,
    ...overrides,
  }
}

const noMaterial: PracticeMaterial = { flashcards: [], questions: [] }

describe('practice session rules', () => {
  it('says why a mode can’t run on a scope', () => {
    const paused: PracticeMaterial = {
      flashcards: [makeFlashcard({ paused: true })],
      questions: [],
    }
    const onlyFeynman: PracticeMaterial = {
      flashcards: [],
      questions: [makeOpenQuestion({ type: 'feynman' })],
    }

    expect(unavailableReason('cards', oneSubtopic(), noMaterial)).toBe('No flashcards here yet.')
    expect(unavailableReason('cards', oneSubtopic(), paused)).toBe('All cards here are paused.')
    expect(unavailableReason('retrieval', oneSubtopic(), onlyFeynman)).toBe(
      'No quiz questions here yet.',
    )
    expect(unavailableReason('feynman', { ...wholeTopic(), subtopics: [] }, noMaterial)).toBe(
      'Add a subtopic first.',
    )
    expect(availableModes(oneSubtopic(), noMaterial)).toEqual(['feynman', 'open'])
  })

  it('mixes every mode that can run except the open session', () => {
    expect(mixableModes(['cards', 'retrieval', 'feynman', 'open'])).toEqual([
      'cards',
      'retrieval',
      'feynman',
    ])
    expect(mixableModes(['feynman', 'open'])).toEqual(['feynman'])
  })

  it('puts due cards first, leaves paused ones out and cuts to the size', () => {
    const material: PracticeMaterial = {
      flashcards: [
        makeFlashcard({ id: 1, is_due: false, due_on: dateFromToday(3) }),
        makeFlashcard({ id: 2, is_due: true, due_on: dateFromToday(0) }),
        makeFlashcard({ id: 3, paused: true, is_due: true, due_on: dateFromToday(-2) }),
        makeFlashcard({ id: 4, is_due: true, due_on: dateFromToday(-1) }),
      ],
      questions: [],
    }

    const cards = pickCards(material, oneSubtopic(), options({ cardCount: 2 }))

    expect(cards.map((card) => card.id)).toEqual([4, 2])
  })

  it('keeps a whole topic one subtopic at a time, or takes turns when interleaving', () => {
    const material: PracticeMaterial = {
      flashcards: [
        makeFlashcard({ id: 1, subtopic_id: 102, is_due: true, due_on: dateFromToday(-3) }),
        makeFlashcard({ id: 2, subtopic_id: 102, is_due: true, due_on: dateFromToday(-2) }),
        makeFlashcard({ id: 3, subtopic_id: 101, is_due: true, due_on: dateFromToday(-1) }),
        makeFlashcard({ id: 4, subtopic_id: 101, is_due: true, due_on: dateFromToday(0) }),
      ],
      questions: [],
    }

    const grouped = pickCards(material, wholeTopic(), options())
    const mixed = pickCards(material, wholeTopic(), options({ interleave: true }))

    expect(grouped.map((card) => card.id)).toEqual([3, 4, 1, 2])
    expect(mixed.map((card) => card.id)).toEqual([3, 1, 4, 2])
  })

  it('shuffles when what’s due first is off', () => {
    const material: PracticeMaterial = {
      flashcards: [makeFlashcard({ id: 1 }), makeFlashcard({ id: 2 }), makeFlashcard({ id: 3 })],
      questions: [],
    }

    // A random of 0 swaps every card with the first one: 1 2 3 → 2 3 1.
    const cards = pickCards(material, oneSubtopic(), options({ dueFirst: false }), () => 0)

    expect(cards.map((card) => card.id)).toEqual([2, 3, 1])
  })

  it('asks multiple choice and open questions, unanswered and wrong ones first', () => {
    const material: PracticeMaterial = {
      flashcards: [],
      questions: [
        makeQuestion({ id: 1 }),
        makeOpenQuestion({ id: 2, latest_answer: null }),
        makeQuestion({ id: 3, latest_answer: null }),
        makeOpenQuestion({ id: 5, type: 'feynman', latest_answer: null }),
        makeQuestion({
          id: 4,
          latest_answer: {
            response: null,
            option_id: 60,
            score: 0,
            verdict: 'not_quite',
            feedback: 'Not quite.',
            gaps: null,
            answered_at: '2026-10-28T08:00:00.000000Z',
          },
        }),
      ],
    }

    const questions = pickQuestions(material, oneSubtopic(), options())

    expect(questions.map((question) => question.id)).toEqual([2, 3, 4, 1])
  })

  it('explains the subtopic you picked, or the one whose Explain it facet is weakest', () => {
    const material: PracticeMaterial = {
      flashcards: [
        makeFlashcard({ id: 1, subtopic_id: 102, back: 'In the mitochondria.' }),
        makeFlashcard({ id: 2, subtopic_id: 102, back: 'Glucose and oxygen.', paused: true }),
      ],
      questions: [
        makeOpenQuestion({
          id: 5,
          type: 'feynman',
          subtopic_id: 102,
          prompt: 'Explain respiration.',
        }),
      ],
    }

    // Cell respiration has never been explained (null), so it goes first.
    expect(pickConcept(wholeTopic(), material)).toEqual({
      subtopicId: 102,
      subtopicTitle: 'Cell respiration',
      prompt: 'Explain respiration.',
    })
    expect(pickConcept(oneSubtopic(), material).prompt).toBe('Explain Photosynthesis as if I’m 12.')
  })

  it('builds the blocks in the fixed order with the open session last', () => {
    const material: PracticeMaterial = {
      flashcards: [makeFlashcard()],
      questions: [makeQuestion()],
    }

    const blocks = buildBlocks(
      oneSubtopic(),
      material,
      options({ modes: ['open', 'feynman', 'cards', 'retrieval'] }),
    )

    expect(blocks.map((block) => block.mode)).toEqual(['cards', 'retrieval', 'feynman', 'open'])
    expect(blocks.map(blockAmount)).toEqual([
      '1 card',
      '1 question',
      '1 concept, 4 steps',
      'As long as you like',
    ])
    // 0.4 for the card, 1 for the question, 12 for Explain it and 15 for the open session.
    expect(estimateMinutes(blocks)).toBe(28)
  })

  it('leaves out a chosen mode that can’t run here', () => {
    const blocks = buildBlocks(oneSubtopic(), noMaterial, options({ modes: ['cards', 'open'] }))

    expect(blocks.map((block) => block.mode)).toEqual(['open'])
  })

  it('names the scope', () => {
    expect(scopeTitle(oneSubtopic(), options())).toBe('Photosynthesis')
    expect(scopeTitle(wholeTopic(), options())).toBe('Biology · all subtopics')
    expect(scopeTitle(wholeTopic(), options({ interleave: true }))).toBe(
      'Biology · mixed subtopics',
    )
  })

  it('counts a card rated again and then good as done, but not from memory', () => {
    const first = makeFlashcard({ id: 1 })
    const second = makeFlashcard({ id: 2 })
    const ratings = [
      { card: first, rating: 'again' as const },
      { card: second, rating: 'good' as const },
      { card: first, rating: 'good' as const },
    ]

    expect(summariseCards(ratings)).toEqual({ reviewed: 2, fromMemory: 1, again: 1 })
    expect(cardsDone(ratings)).toBe(2)
    expect(cardsDone(ratings.slice(0, 2))).toBe(1)
  })

  it('calls a block complete only when everything in it was done, or it was skipped', () => {
    const block = {
      mode: 'cards' as const,
      cards: [makeFlashcard({ id: 1 }), makeFlashcard({ id: 2 })],
    }
    const halfway = { ...emptyResult('cards'), status: 'finished' as const }
    halfway.ratings = [{ card: makeFlashcard({ id: 1 }), rating: 'good' }]

    expect(isBlockComplete(block, halfway)).toBe(false)
    expect(isBlockComplete(block, { ...halfway, status: 'skipped' })).toBe(true)
    halfway.ratings.push({ card: makeFlashcard({ id: 2 }), rating: 'easy' })
    expect(isBlockComplete(block, halfway)).toBe(true)
  })

  it('reads a block’s result in one line', () => {
    const cards = { ...emptyResult('cards'), status: 'finished' as const }
    cards.ratings = [{ card: makeFlashcard(), rating: 'good' }]
    const quiz = { ...emptyResult('retrieval'), status: 'finished' as const }
    quiz.answers = [
      { question: makeQuestion({ id: 1 }), outcome: 'correct' },
      { question: makeQuestion({ id: 2 }), outcome: 'almost' },
    ]

    expect(resultLine(cards)).toBe('1 of 1 card from memory')
    expect(resultLine(quiz)).toBe('1 right · 1 almost · 0 wrong')
    expect(resultLine({ ...emptyResult('open'), status: 'skipped' })).toBe('Skipped')
  })

  it('lists what slipped by its worst rating', () => {
    const cards = emptyResult('cards')
    cards.ratings = [
      { card: makeFlashcard({ id: 1, front: 'First' }), rating: 'hard' },
      { card: makeFlashcard({ id: 1, front: 'First' }), rating: 'again' },
      { card: makeFlashcard({ id: 2, front: 'Second' }), rating: 'good' },
    ]
    const quiz = emptyResult('retrieval')
    quiz.answers = [{ question: makeQuestion({ prompt: 'Which light?' }), outcome: 'not_quite' }]

    expect(slippedItems([cards, quiz])).toEqual([
      { key: 'card-1', title: 'First', grade: 'Missed it', tone: 'ember' },
      { key: 'question-17', title: 'Which light?', grade: 'Not quite', tone: 'ember' },
    ])
  })
})

describe('a session on the API', () => {
  const card = makeFlashcard({ id: 41 })
  const question = makeQuestion({ id: 17 })
  const feynman = makeOpenQuestion({
    id: 31,
    type: 'feynman',
    prompt: 'Explain Photosynthesis as if I’m 12.',
    latest_answer: {
      response: 'Plants make food from light.',
      option_id: null,
      score: 70,
      verdict: 'almost',
      feedback: 'Name the sugar.',
      gaps: [{ text: 'make food', note: 'What kind of food?' }],
      answered_at: '2026-10-31T09:05:00.000000Z',
    },
  })
  const material: PracticeMaterial = { flashcards: [card], questions: [question, feynman] }

  it('keeps the plan as ids in block order, and rebuilds the blocks from it', () => {
    const blocks = buildBlocks(
      oneSubtopic(),
      material,
      options({ modes: ['cards', 'retrieval', 'feynman'] }),
    )
    const plan = sessionPlan(blocks)

    expect(plan).toEqual({
      modes: ['cards', 'retrieval', 'feynman'],
      card_ids: [41],
      question_ids: [17],
      explain_subtopic_id: 101,
    })
    expect(blocksFromPlan(plan, oneSubtopic(), material)).toEqual(blocks)
  })

  it('leaves out a card deleted since the session started', () => {
    const plan = {
      modes: ['cards' as const],
      card_ids: [41, 99],
      question_ids: [],
      explain_subtopic_id: null,
    }

    const [block] = blocksFromPlan(plan, oneSubtopic(), material)

    expect(block?.mode === 'cards' && block.cards.map((each) => each.id)).toEqual([41])
  })

  it('rebuilds what you did from what the API kept', () => {
    const blocks = blocksFromPlan(
      {
        modes: ['cards', 'retrieval', 'feynman', 'open'],
        card_ids: [41],
        question_ids: [17],
        explain_subtopic_id: 101,
      },
      oneSubtopic(),
      material,
    )
    const done = makeDone({
      flashcard_reviews: [
        { flashcard_id: 41, rating: 'again', reviewed_at: '2026-10-31T09:01:00.000000Z' },
        { flashcard_id: 41, rating: 'good', reviewed_at: '2026-10-31T09:02:00.000000Z' },
      ],
      answers: [
        { question_id: 17, option_id: 60, score: null, verdict: 'not_quite', answered_at: '' },
        { question_id: 17, option_id: 61, score: 60, verdict: 'almost', answered_at: '' },
      ],
      explanations: [
        { question_id: 31, version: 1, score: 70, verdict: 'almost', answered_at: '' },
      ],
    })

    const results = resultsFromDone(blocks, done, material)

    expect(results[0]?.ratings.map((entry) => entry.rating)).toEqual(['again', 'good'])
    // The wrong first pick has no score, so only its second try counts.
    expect(results[1]?.answers).toEqual([{ question, outcome: 'almost' }])
    expect(results[2]?.explanations).toEqual([
      {
        version: 1,
        text: 'Plants make food from light.',
        feedback: 'Name the sugar.',
        gaps: [{ text: 'make food', note: 'What kind of food?' }],
      },
    ])
    expect(results.map((result) => result.status)).toEqual([
      'started',
      'started',
      'started',
      'not_started',
    ])
    // Cards and quiz are done; Explain it still needs its simpler version.
    expect(resumeIndex(blocks, results)).toBe(2)
  })

  it('has nothing left to pick up when every block is done, but never ends an open session', () => {
    const cardsOnly = blocksFromPlan(
      { modes: ['cards'], card_ids: [41], question_ids: [], explain_subtopic_id: null },
      oneSubtopic(),
      material,
    )
    const rated = resultsFromDone(
      cardsOnly,
      makeDone({ flashcard_reviews: [{ flashcard_id: 41, rating: 'good', reviewed_at: '' }] }),
      material,
    )
    const openOnly = blocksFromPlan(
      { modes: ['open'], card_ids: [], question_ids: [], explain_subtopic_id: null },
      oneSubtopic(),
      material,
    )

    expect(resumeIndex(cardsOnly, rated)).toBeNull()
    expect(resumeIndex(openOnly, [emptyResult('open')])).toBe(0)
  })

  it('shows when a card comes back in minutes or days', () => {
    expect(formatInterval(10)).toBe('10 min')
    expect(formatInterval(1440)).toBe('1 day')
    expect(formatInterval(4320)).toBe('3 days')
  })

  it('splits an explanation around the gaps it quotes', () => {
    const gap = { text: 'make food', note: 'What kind of food?' }

    expect(
      explanationParts('Plants make food from light.', [gap, { text: 'missing', note: '' }]),
    ).toEqual([
      { text: 'Plants ', gap: null },
      { text: 'make food', gap },
      { text: ' from light.', gap: null },
    ])
  })
})

describe('defaultsFromSettings', () => {
  it('takes the same step on the quiz’s sizes as on the cards’', () => {
    const settings = {
      session_size: 40 as const,
      interleave_subtopics: false,
      hint_before_answer: false,
    }

    expect(defaultsFromSettings(settings)).toEqual({
      cardCount: 40,
      questionCount: 20,
      interleave: false,
      secondTry: false,
    })
    expect(defaultsFromSettings({ ...settings, session_size: 10 }).questionCount).toBe(5)
  })
})
