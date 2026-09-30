import { describe, expect, it } from 'vitest'
import { createDeck } from './cards'
import { isChoiceAllowed } from './rules'
import {
  getAvailableActions, getAvailableChoices, getCurrentPlayer, getReferenceCard, getVisibleTable,
} from './selectors'
import { createGame } from './setup'
import { act, card, cardKeys, finalFixture, fixture, keepOrder } from './test-helpers'

describe('datos para la interfaz', () => {
  it('obtiene el jugador y la carta superior de referencia sin exponer cartas inferiores', () => {
    const initial = fixture(1, card(5), card(6, 'copas'))
    const ready = act(initial, { type: 'choose', choice: { kind: 'comparison', prediction: 'lower' } }).state
    const state = act(ready, { type: 'draw' }).state
    expect(getCurrentPlayer(state)).toEqual({ id: 'player-1', name: 'Ana' })
    expect(getReferenceCard(state)).toEqual(card(6, 'copas'))
    expect(getVisibleTable(state)[1]).toEqual(card(6, 'copas'))
    expect(getVisibleTable(state)[3]).toBeNull()
    expect(getReferenceCard(finalFixture())).toBeNull()
  })

  it('oculta la central hasta terminar, incluida la fase preparada para revelar', () => {
    const initial = createGame([], keepOrder)
    const final = finalFixture()
    const ready = act(final, { type: 'choose', choice: { kind: 'exact-card', card: final.table[3] } }).state
    for (const state of [initial, final, ready]) expect(getVisibleTable(state)[3]).toBeNull()
    const finished = act(ready, { type: 'reveal' }).state
    expect(getVisibleTable(finished)[3]).toBe(finished.table[3])
  })

  it('ofrece las respuestas correspondientes a cada pregunta incluso después de elegir', () => {
    for (const position of [1, 2, 4, 5] as const) {
      const state = fixture(position, card(5), card(6))
      const choices = getAvailableChoices(state)
      expect(choices).toHaveLength(position === 5 ? 4 : 2)
      for (const choice of choices) expect(isChoiceAllowed(state, choice)).toBe(true)
      const chosen = act(state, { type: 'choose', choice: choices[0] }).state
      expect(getAvailableChoices(chosen)).toEqual(choices)
    }
  })

  it('mantiene las 40 respuestas finales, incluidas cartas visibles y previamente vistas', () => {
    const state = finalFixture()
    const choices = getAvailableChoices(state)
    const cards = choices.flatMap((choice) => choice.kind === 'exact-card' ? [choice.card] : [])
    expect(choices).toHaveLength(40)
    expect(cardKeys(cards)).toEqual(cardKeys(createDeck()))
    expect(choices).toContainEqual({ kind: 'exact-card', card: state.table[5][0] })
    expect(choices).toContainEqual({ kind: 'exact-card', card: state.table[5].at(-1) })
    for (const choice of choices) expect(isChoiceAllowed(state, choice)).toBe(true)
  })

  it('ofrece acciones según la fase y solo reiniciar después del final', () => {
    const initial = createGame([], keepOrder)
    expect(getAvailableActions(initial)).toEqual(['choose'])
    const ready = act(initial, { type: 'choose', choice: { kind: 'comparison', prediction: 'lower' } }).state
    expect(getAvailableActions(ready)).toEqual(['choose', 'draw'])
    const final = finalFixture()
    expect(getAvailableActions(final)).toEqual(['choose'])
    const readyFinal = act(final, { type: 'choose', choice: { kind: 'exact-card', card: final.table[3] } }).state
    expect(getAvailableActions(readyFinal)).toEqual(['choose', 'reveal'])
    const finished = act(readyFinal, { type: 'reveal' }).state
    expect(getAvailableActions(finished)).toEqual(['restart'])
    expect(getAvailableChoices(finished)).toEqual([])
    expect(isChoiceAllowed(finished, { kind: 'exact-card', card: final.table[3] })).toBe(false)
  })
})
