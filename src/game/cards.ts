import type { Card, CardValue, Suit } from './types'

export const SUITS: readonly Suit[] = ['oros', 'copas', 'espadas', 'bastos']
export const CARD_VALUES: readonly CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => CARD_VALUES.map((value) => ({ suit, value })))
}

export function isCard(value: unknown): value is Card {
  if (typeof value !== 'object' || value === null) return false
  const card = value as Partial<Card>
  return SUITS.includes(card.suit as Suit) && CARD_VALUES.includes(card.value as CardValue)
}

export function sameCard(first: Card, second: Card): boolean {
  return first.suit === second.suit && first.value === second.value
}

export function compareValues(first: Card, second: Card): -1 | 0 | 1 {
  if (first.value === second.value) return 0
  return first.value < second.value ? -1 : 1
}

export function getParity(card: Card): 'even' | 'odd' {
  return card.value % 2 === 0 ? 'even' : 'odd'
}
