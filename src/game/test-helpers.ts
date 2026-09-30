import { createDeck, sameCard } from './cards'
import { QUESTION_POSITIONS } from './deck'
import { applyAction } from './engine'
import { createGame } from './setup'
import type {
  Card, CardPile, CardValue, GameAction, GameEvent, GameState,
  QuestionGameState, QuestionPosition, RandomSource, Suit,
} from './types'

export const keepOrder: RandomSource = () => 0.999999

export function card(value: CardValue, suit: Suit = 'oros'): Card {
  return { value, suit }
}

export function act(
  state: GameState,
  action: GameAction,
  random: RandomSource = keepOrder,
): { state: GameState; events: readonly GameEvent[] } {
  const result = applyAction(state, action, random)
  if (!result.ok) throw new Error(`Acción rechazada: ${result.error}`)
  return result
}

/** Creates a controlled position while preserving all 40 unique cards. */
export function fixture(
  position: QuestionPosition,
  reference: Card,
  next: Card,
  options: { lastCard?: boolean; currentPlayerIndex?: number; playerNames?: readonly string[] } = {},
): QuestionGameState {
  if (sameCard(reference, next)) throw new Error('La referencia y el robo deben ser cartas distintas.')
  const initial = createGame(options.playerNames ?? ['Ana', 'Luis', 'Mar'], keepOrder)
  const remaining = createDeck().filter((item) => !sameCard(item, reference) && !sameCard(item, next))
  const central = remaining.pop()!
  const piles: Record<QuestionPosition, CardPile> = {
    1: [reference], 2: [reference], 4: [reference], 5: [reference],
  }
  for (const other of QUESTION_POSITIONS) {
    if (other !== position) piles[other] = [remaining.pop()!]
  }
  if (options.lastCard) {
    const [bottom, ...others] = remaining
    piles[1] = [bottom, ...others, ...piles[1]]
  }
  return {
    ...initial,
    currentPlayerIndex: options.currentPlayerIndex ?? 0,
    position,
    phase: 'awaiting-choice',
    choice: null,
    table: { ...piles, 3: central },
    deck: options.lastCard ? [next] : [...remaining, next],
  }
}

export function finalFixture(): GameState {
  const initial = fixture(5, card(1), card(2, 'copas'))
  const chosen = act(initial, { type: 'choose', choice: { kind: 'suit', suit: 'copas' } }).state
  return act(chosen, { type: 'draw' }).state
}

export function allCards(state: GameState): readonly Card[] {
  return [...state.deck, state.table[3], ...QUESTION_POSITIONS.flatMap((position) => state.table[position])]
}

export function cardKeys(cards: readonly Card[]): string[] {
  return cards.map((item) => `${item.suit}-${item.value}`).sort()
}

export function withNext(state: GameState, next: Card): GameState {
  const index = state.deck.findIndex((item) => sameCard(item, next))
  if (index === -1) throw new Error('La carta solicitada debe estar en el mazo.')
  return { ...state, deck: [...state.deck.filter((_, itemIndex) => itemIndex !== index), next] }
}

export function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
