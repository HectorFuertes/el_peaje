import { compareValues, isCard, SUITS, getParity } from './cards'
import type {
  AnswerOutcome, Card, Choice, CurrentPosition, DrawChoice, GameState,
  PenaltyReason, QuestionPosition,
} from './types'

export function isChoiceAllowed(state: GameState, choice: Choice): boolean {
  if (state.phase === 'finished') return false
  switch (state.position) {
    case 1:
    case 2:
      return choice.kind === 'comparison' && ['higher', 'lower'].includes(choice.prediction)
    case 4:
      return choice.kind === 'parity' && ['even', 'odd'].includes(choice.prediction)
    case 5:
      return choice.kind === 'suit' && SUITS.includes(choice.suit)
    case 'final':
      return choice.kind === 'exact-card' && isCard(choice.card)
  }
}

export function evaluateAnswer(choice: DrawChoice, reference: Card, drawn: Card): AnswerOutcome {
  switch (choice.kind) {
    case 'comparison': {
      const comparison = compareValues(drawn, reference)
      if (comparison === 0) return 'tie'
      return (choice.prediction === 'higher' ? comparison > 0 : comparison < 0)
        ? 'correct' : 'incorrect'
    }
    case 'parity':
      return getParity(drawn) === choice.prediction ? 'correct' : 'incorrect'
    case 'suit':
      return drawn.suit === choice.suit ? 'correct' : 'incorrect'
  }
}

export interface Consequence {
  readonly position: CurrentPosition
  readonly advancePlayer: boolean
  readonly penalty: { readonly amount: 1 | 2; readonly reason: PenaltyReason } | null
}

export function resolveQuestion(position: QuestionPosition, outcome: AnswerOutcome): Consequence {
  if (outcome === 'tie') {
    if (position !== 1 && position !== 2) {
      throw new Error('Solo Mayor/Menor puede producir un empate.')
    }
    return { position, advancePlayer: false, penalty: null }
  }

  if (outcome === 'correct') {
    const destinations = { 1: 2, 2: 4, 4: 5, 5: 'final' } as const
    return {
      position: destinations[position],
      advancePlayer: true,
      penalty: position === 2 ? { amount: 1, reason: 'toll' } : null,
    }
  }

  const destinations = { 1: 1, 2: 1, 4: 2, 5: 4 } as const
  return {
    position: destinations[position],
    advancePlayer: false,
    penalty: position === 4
      ? { amount: 2, reason: 'wrong-answer-and-toll' }
      : { amount: 1, reason: 'wrong-answer' },
  }
}
