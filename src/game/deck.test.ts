import { describe, expect, it, vi } from 'vitest'
import { createDeck } from './cards'
import { addToPile, QUESTION_POSITIONS, rebuildDeck, shuffle, takeCard, topCard } from './deck'
import { allCards, card, cardKeys, deepFreeze, fixture } from './test-helpers'

describe('mazo y montones', () => {
  it('roba por el final sin modificar el mazo de entrada', () => {
    const deck = deepFreeze([card(1), card(2), card(3)])
    expect(takeCard(deck)).toEqual({ card: card(3), deck: [card(1), card(2)] })
    expect(deck).toHaveLength(3)
    expect(() => takeCard([])).toThrow('no hay cartas')
  })

  it('baraja con Fisher–Yates y una fuente inyectada, sin modificar las cartas originales', () => {
    const cards = deepFreeze([card(1), card(2), card(3), card(4)])
    const random = vi.fn(() => 0)
    expect(shuffle(cards, random)).toEqual([card(2), card(3), card(4), card(1)])
    expect(random).toHaveBeenCalledTimes(3)
    expect(cards).toEqual([card(1), card(2), card(3), card(4)])
    expect(shuffle(cards, () => 0)).toEqual(shuffle(cards, () => 0))
  })

  it.each([-0.1, 1, Number.NaN, Number.POSITIVE_INFINITY])('rechaza una muestra aleatoria inválida: %s', (sample) => {
    expect(() => shuffle([card(1), card(2)], () => sample)).toThrow(RangeError)
  })

  it('baraja sin perder ni duplicar cartas', () => {
    const deck = createDeck()
    expect(cardKeys(shuffle(deck, () => 0.3))).toEqual(cardKeys(deck))
    expect(shuffle([], () => 0)).toEqual([])
    expect(shuffle([card(1)], () => 0)).toEqual([card(1)])
  })

  it.each(QUESTION_POSITIONS)('coloca una carta sobre el montón %s sin modificar los demás', (position) => {
    const state = fixture(position, card(5), card(6, 'copas'))
    const table = deepFreeze(state.table)
    const next = addToPile(table, position, card(6, 'copas'))
    expect(next[position]).toEqual([card(5), card(6, 'copas')])
    expect(topCard(next[position])).toEqual(card(6, 'copas'))
    for (const other of QUESTION_POSITIONS) {
      if (other !== position) expect(next[other]).toBe(table[other])
    }
    expect(next[3]).toBe(table[3])
  })

  it('recoge todas las cartas inferiores y protege exactamente la central y las cuatro superiores', () => {
    const state = fixture(2, card(5), card(6, 'copas'), { lastCard: true })
    const table = deepFreeze(addToPile(state.table, 2, state.deck[0]))
    const random = vi.fn(() => 0)
    const rebuilt = rebuildDeck(table, random)
    expect(rebuilt.deck).toHaveLength(35)
    expect(random).toHaveBeenCalledTimes(34)
    expect(rebuilt.table[3]).toBe(table[3])
    for (const position of QUESTION_POSITIONS) {
      expect(rebuilt.table[position]).toEqual([topCard(table[position])])
    }
    const protectedCards = [table[3], ...QUESTION_POSITIONS.map((position) => topCard(table[position]))]
    const protectedKeys = new Set(cardKeys(protectedCards))
    expect(cardKeys(rebuilt.deck).some((key) => protectedKeys.has(key))).toBe(false)
    expect(cardKeys(allCards({ ...state, ...rebuilt }))).toEqual(cardKeys(createDeck()))
  })

  it('rechaza una reconstrucción sin cartas recuperables', () => {
    const state = fixture(1, card(5), card(6, 'copas'))
    expect(() => rebuildDeck(state.table, () => 0)).toThrow('no hay cartas debajo')
  })
})
