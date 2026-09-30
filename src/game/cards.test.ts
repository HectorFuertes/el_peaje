import { describe, expect, it } from 'vitest'
import { CARD_VALUES, compareValues, createDeck, getParity, isCard, sameCard, SUITS } from './cards'
import { card, cardKeys } from './test-helpers'
import type { CardValue } from './types'

describe('baraja española', () => {
  it('contiene las 40 combinaciones únicas, sin ochos ni nueves', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(40)
    expect(new Set(cardKeys(deck)).size).toBe(40)
    expect(SUITS).toEqual(['oros', 'copas', 'espadas', 'bastos'])
    expect(CARD_VALUES).toEqual([1, 2, 3, 4, 5, 6, 7, 10, 11, 12])
    for (const suit of SUITS) {
      expect(deck.filter((item) => item.suit === suit).map((item) => item.value)).toEqual(CARD_VALUES)
    }
  })

  it('crea cartas nuevas para cada baraja', () => {
    const first = createDeck()
    const second = createDeck()
    expect(first).toEqual(second)
    expect(first[0]).not.toBe(second[0])
  })

  it('ordena As, números y figuras por su valor numérico, con independencia del palo', () => {
    const expectedOrder: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12]
    for (let index = 0; index < expectedOrder.length; index += 1) {
      expect(compareValues(card(expectedOrder[index]), card(expectedOrder[index], 'copas'))).toBe(0)
      for (let higher = index + 1; higher < expectedOrder.length; higher += 1) {
        expect(compareValues(card(expectedOrder[index]), card(expectedOrder[higher]))).toBe(-1)
        expect(compareValues(card(expectedOrder[higher]), card(expectedOrder[index]))).toBe(1)
      }
    }
  })

  it.each<[CardValue, 'even' | 'odd']>([
    [1, 'odd'], [2, 'even'], [3, 'odd'], [4, 'even'], [5, 'odd'],
    [6, 'even'], [7, 'odd'], [10, 'even'], [11, 'odd'], [12, 'even'],
  ])('el valor %s es %s', (value, expected) => {
    for (const suit of SUITS) expect(getParity(card(value, suit))).toBe(expected)
  })

  it('exige tanto valor como palo para identificar una carta', () => {
    expect(sameCard(card(7), card(7))).toBe(true)
    expect(sameCard(card(7), card(7, 'copas'))).toBe(false)
    expect(sameCard(card(7), card(6))).toBe(false)
  })

  it('valida las cartas y rechaza valores o palos inexistentes', () => {
    for (const item of createDeck()) expect(isCard(item)).toBe(true)
    for (const value of [null, {}, 7, { value: 8, suit: 'oros' }, { value: 9, suit: 'oros' },
      { value: 1, suit: 'tréboles' }, { value: '1', suit: 'oros' }]) {
      expect(isCard(value)).toBe(false)
    }
  })
})
