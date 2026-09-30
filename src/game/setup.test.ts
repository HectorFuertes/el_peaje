import { describe, expect, it } from 'vitest'
import { createDeck } from './cards'
import { QUESTION_POSITIONS } from './deck'
import { createGame } from './setup'
import { allCards, card, cardKeys, keepOrder } from './test-helpers'

describe('preparación', () => {
  it('reparte de izquierda a derecha y deja 35 cartas para robar', () => {
    const state = createGame(['Ana', 'Luis'], keepOrder)
    expect(state.table).toEqual({
      1: [card(12, 'bastos')], 2: [card(11, 'bastos')], 3: card(10, 'bastos'),
      4: [card(7, 'bastos')], 5: [card(6, 'bastos')],
    })
    expect(state.deck).toHaveLength(35)
    for (const position of QUESTION_POSITIONS) expect(state.table[position]).toHaveLength(1)
    expect(state.position).toBe(1)
    expect(state.phase).toBe('awaiting-choice')
    expect(state.choice).toBeNull()
    expect(state.currentPlayerIndex).toBe(0)
    expect(cardKeys(allCards(state))).toEqual(cardKeys(createDeck()))
  })

  it('usa Jugador 1 cuando no se introducen jugadores', () => {
    expect(createGame([], keepOrder).players).toEqual([{ id: 'player-1', name: 'Jugador 1' }])
    expect(createGame([' ', ''], keepOrder).players).toEqual([{ id: 'player-1', name: 'Jugador 1' }])
  })

  it('limpia espacios y conserva el orden y nombres repetidos con identificadores distintos', () => {
    const names = [' Ana ', '', 'Ana', ' Luis ']
    const state = createGame(names, keepOrder)
    expect(state.players).toEqual([
      { id: 'player-1', name: 'Ana' }, { id: 'player-2', name: 'Ana' }, { id: 'player-3', name: 'Luis' },
    ])
    expect(names).toEqual([' Ana ', '', 'Ana', ' Luis '])
  })

  it('produce el mismo reparto con la misma secuencia aleatoria', () => {
    expect(createGame(['Ana'], () => 0.25)).toEqual(createGame(['Ana'], () => 0.25))
    expect(createGame(['Ana'], () => 0).table).not.toEqual(createGame(['Ana'], keepOrder).table)
  })
})
