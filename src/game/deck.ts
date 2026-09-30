import type { Card, CardPile, QuestionPosition, RandomSource, Table } from './types'

export const QUESTION_POSITIONS = [1, 2, 4, 5] as const

export function shuffle(cards: readonly Card[], random: RandomSource): Card[] {
  const shuffled = [...cards]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const sample = random()
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new RangeError('La fuente de aleatoriedad debe devolver un número en [0, 1).')
    }
    const target = Math.floor(sample * (index + 1))
    ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }
  return shuffled
}

/** The last element is the next card to draw. */
export function takeCard(deck: readonly Card[]): { card: Card; deck: readonly Card[] } {
  const card = deck.at(-1)
  if (!card) throw new Error('Estado inválido: no hay cartas en el mazo de robo.')
  return { card, deck: deck.slice(0, -1) }
}

/** Piles are ordered from bottom to top. */
export function topCard(pile: CardPile): Card {
  return pile[pile.length - 1]
}

export function addToPile(table: Table, position: QuestionPosition, card: Card): Table {
  const pile: CardPile = [...table[position], card]
  return { ...table, [position]: pile }
}

export function rebuildDeck(table: Table, random: RandomSource): {
  table: Table
  deck: readonly Card[]
} {
  const collected = QUESTION_POSITIONS.flatMap((position) => table[position].slice(0, -1))
  if (collected.length === 0) {
    throw new Error('Estado inválido: no hay cartas debajo de los montones para reconstruir el mazo.')
  }
  return {
    table: {
      1: [topCard(table[1])],
      2: [topCard(table[2])],
      3: table[3],
      4: [topCard(table[4])],
      5: [topCard(table[5])],
    },
    deck: shuffle(collected, random),
  }
}
