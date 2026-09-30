import { describe, expect, it } from 'vitest'
import { SUITS } from './cards'
import { evaluateAnswer, isChoiceAllowed, resolveQuestion } from './rules'
import { card, finalFixture, fixture } from './test-helpers'
import type { AnswerOutcome, Choice, CurrentPosition, PenaltyReason, QuestionPosition } from './types'

describe('evaluación y consecuencias', () => {
  it('Mayor/Menor distingue valor mayor, menor e igual, sin comparar palos', () => {
    const higher = { kind: 'comparison', prediction: 'higher' } as const
    const lower = { kind: 'comparison', prediction: 'lower' } as const
    expect(evaluateAnswer(higher, card(7), card(10))).toBe('correct')
    expect(evaluateAnswer(lower, card(10), card(7))).toBe('correct')
    expect(evaluateAnswer(higher, card(10), card(7))).toBe('incorrect')
    expect(evaluateAnswer(lower, card(7), card(10))).toBe('incorrect')
    expect(evaluateAnswer(higher, card(7), card(7, 'copas'))).toBe('tie')
    expect(evaluateAnswer(lower, card(7), card(7, 'copas'))).toBe('tie')
  })

  it('Par/Impar depende de la carta robada, aunque coincida en valor con la referencia', () => {
    expect(evaluateAnswer({ kind: 'parity', prediction: 'even' }, card(10), card(10, 'copas'))).toBe('correct')
    expect(evaluateAnswer({ kind: 'parity', prediction: 'odd' }, card(1), card(12))).toBe('incorrect')
    expect(evaluateAnswer({ kind: 'parity', prediction: 'odd' }, card(12), card(11))).toBe('correct')
  })

  it.each(SUITS)('predice el palo %s sin depender del valor ni del palo de referencia', (suit) => {
    for (const drawnSuit of SUITS) {
      expect(evaluateAnswer({ kind: 'suit', suit }, card(12, 'bastos'), card(1, drawnSuit)))
        .toBe(suit === drawnSuit ? 'correct' : 'incorrect')
    }
  })

  it.each<[QuestionPosition, AnswerOutcome, CurrentPosition, boolean, number, PenaltyReason | null]>([
    [1, 'correct', 2, true, 0, null],
    [1, 'incorrect', 1, false, 1, 'wrong-answer'],
    [1, 'tie', 1, false, 0, null],
    [2, 'correct', 4, true, 1, 'toll'],
    [2, 'incorrect', 1, false, 1, 'wrong-answer'],
    [2, 'tie', 2, false, 0, null],
    [4, 'correct', 5, true, 0, null],
    [4, 'incorrect', 2, false, 2, 'wrong-answer-and-toll'],
    [5, 'correct', 'final', true, 0, null],
    [5, 'incorrect', 4, false, 1, 'wrong-answer'],
  ])('posición %s, %s → %s', (position, outcome, destination, advancePlayer, amount, reason) => {
    expect(resolveQuestion(position, outcome)).toEqual({
      position: destination, advancePlayer,
      penalty: amount ? { amount, reason } : null,
    })
  })

  it('rechaza empates en preguntas que no admiten ese resultado', () => {
    expect(() => resolveQuestion(4, 'tie')).toThrow('Solo Mayor/Menor')
    expect(() => resolveQuestion(5, 'tie')).toThrow('Solo Mayor/Menor')
  })

  it('restringe cada elección a su pregunta y valida valores exactos', () => {
    const choices: Choice[] = [
      { kind: 'comparison', prediction: 'higher' }, { kind: 'parity', prediction: 'even' },
      { kind: 'suit', suit: 'copas' }, { kind: 'exact-card', card: card(1) },
    ]
    const states = [fixture(1, card(5), card(6)), fixture(4, card(5), card(6)),
      fixture(5, card(5), card(6)), finalFixture()]
    states.forEach((state, stateIndex) => choices.forEach((choice, choiceIndex) => {
      expect(isChoiceAllowed(state, choice)).toBe(stateIndex === choiceIndex)
    }))
    const invalid = { kind: 'exact-card', card: { value: 8, suit: 'oros' } } as unknown as Choice
    expect(isChoiceAllowed(finalFixture(), invalid)).toBe(false)
  })
})
