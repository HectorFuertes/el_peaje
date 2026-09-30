import { describe, expect, it, vi } from 'vitest'
import { createDeck, getParity, SUITS } from './cards'
import { QUESTION_POSITIONS, topCard } from './deck'
import { applyAction } from './engine'
import { getReferenceCard, getVisibleTable } from './selectors'
import { createGame } from './setup'
import {
  act, allCards, card, cardKeys, deepFreeze, finalFixture, fixture, keepOrder, withNext,
} from './test-helpers'
import type {
  AnswerOutcome, Card, Choice, CurrentPosition, DrawChoice, GameAction, GameState, QuestionPosition,
} from './types'

const higher = { kind: 'comparison', prediction: 'higher' } as const
const lower = { kind: 'comparison', prediction: 'lower' } as const
const even = { kind: 'parity', prediction: 'even' } as const
const odd = { kind: 'parity', prediction: 'odd' } as const
const cups = { kind: 'suit', suit: 'copas' } as const

describe('transiciones ordinarias', () => {
  it.each<[QuestionPosition, DrawChoice, Card, Card, CurrentPosition, AnswerOutcome, number]>([
    [1, higher, card(5), card(6, 'copas'), 2, 'correct', 0],
    [1, lower, card(5), card(4, 'copas'), 2, 'correct', 0],
    [1, higher, card(5), card(4, 'copas'), 1, 'incorrect', 1],
    [1, lower, card(5), card(6, 'copas'), 1, 'incorrect', 1],
    [2, higher, card(5), card(6, 'copas'), 4, 'correct', 1],
    [2, lower, card(5), card(4, 'copas'), 4, 'correct', 1],
    [2, higher, card(5), card(4, 'copas'), 1, 'incorrect', 1],
    [2, lower, card(5), card(6, 'copas'), 1, 'incorrect', 1],
    [4, even, card(5), card(10, 'copas'), 5, 'correct', 0],
    [4, odd, card(5), card(11, 'copas'), 5, 'correct', 0],
    [4, even, card(5), card(11, 'copas'), 2, 'incorrect', 2],
    [4, odd, card(5), card(12, 'copas'), 2, 'incorrect', 2],
    [5, cups, card(5), card(1, 'copas'), 'final', 'correct', 0],
    [5, cups, card(5), card(1, 'bastos'), 4, 'incorrect', 1],
  ])('posición %s: %j, referencia %j, robo %j → %s (%s)', (
    position, choice, reference, drawn, destination, outcome, penaltyAmount,
  ) => {
    const initial = fixture(position, reference, drawn, { currentPlayerIndex: 1 })
    const ready = deepFreeze(act(initial, { type: 'choose', choice }).state)
    const random = vi.fn(() => 0)
    const result = act(ready, { type: 'draw' }, random)
    expect(result.state.position).toBe(destination)
    expect(result.state.currentPlayerIndex).toBe(outcome === 'correct' ? 2 : 1)
    expect(result.state.phase).toBe(destination === 'final' ? 'awaiting-final-choice' : 'awaiting-choice')
    expect(result.state.choice).toBeNull()
    expect(result.state.table[position]).toEqual([reference, drawn])
    expect(result.state.deck).toHaveLength(34)
    expect(result.state.table[3]).toBe(initial.table[3])
    expect(result.events[0]).toEqual({
      type: 'answer', position, playerId: 'player-2', outcome, referenceCard: reference, drawnCard: drawn,
    })
    const penalties = result.events.filter((event) => event.type === 'penalty')
    expect(penalties).toHaveLength(penaltyAmount ? 1 : 0)
    if (penaltyAmount) expect(penalties[0]).toMatchObject({ playerId: 'player-2', amount: penaltyAmount })
    expect(result.events).toHaveLength(penaltyAmount ? 2 : 1)
    expect(random).not.toHaveBeenCalled()
    expect(cardKeys(allCards(result.state))).toEqual(cardKeys(createDeck()))
    expect(topCard(ready.table[position])).toEqual(reference)
    for (const other of QUESTION_POSITIONS) {
      if (other !== position) expect(result.state.table[other]).toBe(initial.table[other])
    }
  })

  it('cobra el peaje al autor del acierto en posición 2 y avanza el turno exactamente una vez', () => {
    const initial = fixture(2, card(5), card(6, 'copas'), { currentPlayerIndex: 1 })
    const ready = act(initial, { type: 'choose', choice: higher }).state
    const result = act(ready, { type: 'draw' })
    expect(result.events.map((event) => event.type)).toEqual(['answer', 'penalty'])
    expect(result.events[1]).toEqual({ type: 'penalty', playerId: 'player-2', amount: 1, reason: 'toll' })
    expect(result.state.currentPlayerIndex).toBe(2)
    expect(result.state.position).toBe(4)
  })

  it('cobra x2 total al fallar en posición 4 y no vuelve automáticamente a posición 4', () => {
    const initial = fixture(4, card(5), card(11, 'copas'))
    const result = act(act(initial, { type: 'choose', choice: even }).state, { type: 'draw' })
    expect(result.events[1]).toEqual({
      type: 'penalty', playerId: 'player-1', amount: 2, reason: 'wrong-answer-and-toll',
    })
    expect(result.events).toHaveLength(2)
    expect(result.state.position).toBe(2)
    expect(result.state.currentPlayerIndex).toBe(0)
    expect(result.state.choice).toBeNull()
  })

  it('vuelve al primer jugador después del último', () => {
    const initial = fixture(1, card(5), card(6, 'copas'), { currentPlayerIndex: 2 })
    expect(act(act(initial, { type: 'choose', choice: higher }).state, { type: 'draw' }).state.currentPlayerIndex).toBe(0)
  })

  it('funciona con un único jugador', () => {
    const initial = fixture(2, card(5), card(6, 'copas'), { playerNames: ['Jugador 1'] })
    const result = act(act(initial, { type: 'choose', choice: higher }).state, { type: 'draw' })
    expect(result.state.currentPlayerIndex).toBe(0)
    expect(result.state.position).toBe(4)
    expect(result.events[1]).toMatchObject({ playerId: 'player-1', amount: 1 })
  })

  it('el retroceso conserva las cartas y utiliza la superior actual del montón de destino', () => {
    let state: GameState = fixture(1, card(5), card(6, 'copas'))
    state = act(act(state, { type: 'choose', choice: higher }).state, { type: 'draw' }).state
    state = withNext(state, card(1, 'copas'))
    state = act(act(state, { type: 'choose', choice: higher }).state, { type: 'draw' }).state
    expect(state.position).toBe(1)
    expect(getReferenceCard(state)).toEqual(card(6, 'copas'))
    expect(state.table[1]).toEqual([card(5), card(6, 'copas')])
    expect(topCard(state.table[2])).toEqual(card(1, 'copas'))
  })
})

describe('elecciones y empates', () => {
  it.each<[1 | 2, typeof higher | typeof lower]>([
    [1, higher], [1, lower], [2, higher], [2, lower],
  ])('conserva la elección y el turno al empatar en posición %s con %j', (position, choice) => {
    const initial = fixture(position, card(7), card(7, 'copas'), { currentPlayerIndex: 1 })
    const ready = act(initial, { type: 'choose', choice }).state
    const tied = act(ready, { type: 'draw' })
    expect(tied.state.position).toBe(position)
    expect(tied.state.currentPlayerIndex).toBe(1)
    expect(tied.state.phase).toBe('ready-to-draw')
    expect(tied.state.choice).toBe(choice)
    expect(tied.state.table[position]).toEqual([card(7), card(7, 'copas')])
    expect(tied.events).toHaveLength(1)
    expect(tied.events[0]).toMatchObject({ outcome: 'tie' })

    const nextCard = choice.prediction === 'higher' ? card(10) : card(6)
    const after = act(withNext(tied.state, nextCard), { type: 'draw' })
    expect(after.events[0]).toMatchObject({ outcome: 'correct', referenceCard: card(7, 'copas') })
    expect(after.state.currentPlayerIndex).toBe(2)
    expect(after.state.position).toBe(position === 1 ? 2 : 4)
  })

  it('permite cambiar la elección tras un empate y no roba automáticamente', () => {
    const initial = fixture(1, card(7), card(7, 'copas'))
    const ready = act(initial, { type: 'choose', choice: higher }).state
    const tied = act(ready, { type: 'draw' }).state
    expect(tied.deck.length).toBe(initial.deck.length - 1)
    const changed = act(tied, { type: 'choose', choice: lower })
    expect(changed.state.deck).toBe(tied.deck)
    const after = act(withNext(changed.state, card(6)), { type: 'draw' })
    expect(after.events[0]).toMatchObject({ outcome: 'correct' })
  })

  it.each<[QuestionPosition, Choice, Choice, Card]>([
    [1, higher, lower, card(4, 'copas')],
    [2, higher, lower, card(4, 'copas')],
    [4, even, odd, card(11, 'copas')],
    [5, { kind: 'suit', suit: 'oros' }, cups, card(1, 'copas')],
  ])('permite modificar la respuesta en posición %s antes de robar', (position, first, replacement, next) => {
    const initial = deepFreeze(fixture(position, card(5), next))
    const chosen = act(initial, { type: 'choose', choice: first })
    const changed = act(chosen.state, { type: 'choose', choice: replacement })
    expect(chosen.events).toEqual([])
    expect(changed.events).toEqual([])
    expect(changed.state.choice).toEqual(replacement)
    expect(changed.state.deck).toBe(initial.deck)
    expect(changed.state.table).toBe(initial.table)
    expect(changed.state.currentPlayerIndex).toBe(initial.currentPlayerIndex)
    expect(changed.state.position).toBe(initial.position)
    expect(act(changed.state, { type: 'draw' }).events[0]).toMatchObject({ outcome: 'correct' })
  })

  it('borra la elección después de resolver un acierto o un fallo', () => {
    for (const next of [card(4, 'copas'), card(6, 'copas')]) {
      const initial = fixture(1, card(5), next)
      const after = act(act(initial, { type: 'choose', choice: higher }).state, { type: 'draw' }).state
      expect(after.choice).toBeNull()
      expect(applyAction(after, { type: 'draw' }, keepOrder)).toMatchObject({ ok: false, error: 'missing-choice' })
    }
  })
})

describe('reconstrucción inmediata', () => {
  it.each<[QuestionPosition, Choice, Card, AnswerOutcome, CurrentPosition, number]>([
    [1, higher, card(6, 'copas'), 'correct', 2, 1],
    [2, higher, card(6, 'copas'), 'correct', 4, 1],
    [4, even, card(11, 'copas'), 'incorrect', 2, 0],
    [5, cups, card(6, 'copas'), 'correct', 'final', 1],
    [1, higher, card(5, 'copas'), 'tie', 1, 0],
    [2, lower, card(5, 'copas'), 'tie', 2, 0],
  ])('reconstruye tras %s, %j, %j (%s)', (position, choice, next, outcome, destination, playerIndex) => {
    const initial = fixture(position, card(5), next, { lastCard: true })
    const ready = deepFreeze(act(initial, { type: 'choose', choice }).state)
    const random = vi.fn(() => 0)
    const result = act(ready, { type: 'draw' }, random)
    expect(result.state.deck).toHaveLength(35)
    expect(result.state.position).toBe(destination)
    expect(result.state.currentPlayerIndex).toBe(playerIndex)
    expect(result.state.choice).toEqual(outcome === 'tie' ? choice : null)
    expect(result.state.phase).toBe(outcome === 'tie' ? 'ready-to-draw'
      : destination === 'final' ? 'awaiting-final-choice' : 'awaiting-choice')
    expect(result.state.table[3]).toBe(ready.table[3])
    for (const other of QUESTION_POSITIONS) {
      expect(result.state.table[other]).toEqual([other === position ? next : topCard(ready.table[other])])
    }
    expect(result.events.at(-1)).toEqual({ type: 'deck-rebuilt', cardCount: 35 })
    expect(result.events[0]).toMatchObject({ outcome })
    expect(random).toHaveBeenCalledTimes(34)
    expect(cardKeys(allCards(result.state))).toEqual(cardKeys(createDeck()))
    expect(ready.deck).toEqual([next])
  })

  it('mantiene 40 cartas únicas y los turnos durante cinco reconstrucciones con avances y retrocesos', () => {
    let state = createGame(['Ana', 'Luis', 'Mar'], keepOrder)
    const central = state.table[3]
    const expectedCards = cardKeys(createDeck())
    let rebuilds = 0
    let visits2 = 0
    let visits4 = 0

    for (let drawIndex = 0; drawIndex < 180; drawIndex += 1) {
      if (state.position === 'final') throw new Error('Esta secuencia no debe llegar al final.')
      const position = state.position
      const next = state.deck.at(-1)!
      let choice: DrawChoice
      if (position === 1 || position === 2) {
        const reference = topCard(state.table[position])
        const shouldSucceed = position === 1 || visits2++ % 3 !== 2
        const isHigher = next.value > reference.value
        choice = {
          kind: 'comparison',
          prediction: shouldSucceed === isHigher ? 'higher' : 'lower',
        }
      } else if (position === 4) {
        const parity = getParity(next)
        choice = {
          kind: 'parity',
          prediction: visits4++ % 2 === 0 ? parity : parity === 'even' ? 'odd' : 'even',
        }
      } else {
        choice = { kind: 'suit', suit: SUITS.find((suit) => suit !== next.suit)! }
      }
      const ready = deepFreeze(act(deepFreeze(state), { type: 'choose', choice }).state)
      const result = act(ready, { type: 'draw' }, () => 0.37)
      state = result.state
      expect(cardKeys(allCards(state))).toEqual(expectedCards)
      expect(state.table[3]).toBe(central)
      if (result.events.some((event) => event.type === 'deck-rebuilt')) {
        rebuilds += 1
        expect(state.deck).toHaveLength(35)
        for (const other of QUESTION_POSITIONS) {
          expect(state.table[other]).toEqual([other === position ? next : topCard(ready.table[other])])
        }
      }
    }
    expect(rebuilds).toBe(5)
    expect(visits2).toBeGreaterThan(1)
    expect(visits4).toBeGreaterThan(1)
  })
})

describe('pregunta final y nueva partida', () => {
  it.each(['exact', 'wrong-value', 'wrong-suit', 'wrong-both'] as const)('resuelve la respuesta final: %s', (scenario) => {
    const initial = deepFreeze(finalFixture())
    const central = initial.table[3]
    const differentValue = central.value === 1 ? 2 : 1
    const differentSuit = central.suit === 'oros' ? 'copas' : 'oros'
    const guess: Card = {
      value: scenario === 'wrong-value' || scenario === 'wrong-both' ? differentValue : central.value,
      suit: scenario === 'wrong-suit' || scenario === 'wrong-both' ? differentSuit : central.suit,
    }
    const ready = act(initial, { type: 'choose', choice: { kind: 'exact-card', card: guess } }).state
    expect(getVisibleTable(ready)[3]).toBeNull()
    const random = vi.fn(() => 0)
    const result = act(deepFreeze(ready), { type: 'reveal' }, random)
    expect(result.state.phase).toBe('finished')
    expect(result.state).toMatchObject({ result: scenario === 'exact' ? 'won' : 'lost' })
    expect(result.state.currentPlayerIndex).toBe(initial.currentPlayerIndex)
    expect(result.state.deck).toBe(initial.deck)
    expect(result.state.table).toBe(initial.table)
    expect(getVisibleTable(result.state)[3]).toBe(central)
    expect(result.events).toEqual([{
      type: 'game-finished', playerId: initial.players[initial.currentPlayerIndex].id,
      result: scenario === 'exact' ? 'won' : 'lost', guess, centralCard: central,
    }])
    expect(random).not.toHaveBeenCalled()
  })

  it('permite sustituir la respuesta exacta hasta revelar', () => {
    const initial = finalFixture()
    const first = act(initial, { type: 'choose', choice: { kind: 'exact-card', card: card(1) } }).state
    const replaced = act(first, { type: 'choose', choice: { kind: 'exact-card', card: initial.table[3] } })
    expect(replaced.events).toEqual([])
    expect(replaced.state.deck).toBe(initial.deck)
    expect(replaced.state.table).toBe(initial.table)
    expect(act(replaced.state, { type: 'reveal' }).state).toMatchObject({ phase: 'finished', result: 'won' })
  })

  it.each([true, false])('reinicia después de ganar=%s, conserva jugadores y vuelve a repartir', (win) => {
    const initial = finalFixture()
    const guess = win ? initial.table[3] : card(1)
    const ready = act(initial, { type: 'choose', choice: { kind: 'exact-card', card: guess } }).state
    const finished = deepFreeze(act(ready, { type: 'reveal' }).state)
    const random = vi.fn(() => 0)
    const restarted = act(finished, { type: 'restart' }, random)
    expect(restarted.events).toEqual([])
    expect(restarted.state.players).toBe(finished.players)
    expect(restarted.state.currentPlayerIndex).toBe(0)
    expect(restarted.state.position).toBe(1)
    expect(restarted.state.phase).toBe('awaiting-choice')
    expect(restarted.state.choice).toBeNull()
    expect(restarted.state).not.toHaveProperty('result')
    expect(restarted.state.deck).toHaveLength(35)
    for (const position of QUESTION_POSITIONS) expect(restarted.state.table[position]).toHaveLength(1)
    expect(restarted.state.table[3]).not.toBe(finished.table[3])
    expect(getVisibleTable(restarted.state)[3]).toBeNull()
    expect(cardKeys(allCards(restarted.state))).toEqual(cardKeys(createDeck()))
    expect(random).toHaveBeenCalledTimes(39)
  })

  it('recorre una partida desde el reparto hasta la victoria sin usar estados artificiales', () => {
    let state = createGame(['Ana', 'Luis', 'Mar'], keepOrder)
    const choices: Choice[] = [lower, lower, odd, { kind: 'suit', suit: 'bastos' }]
    const destinations: CurrentPosition[] = [2, 4, 5, 'final']
    choices.forEach((choice, index) => {
      state = act(state, { type: 'choose', choice }).state
      const result = act(state, { type: 'draw' })
      state = result.state
      expect(result.events[0]).toMatchObject({ outcome: 'correct', playerId: `player-${index % 3 + 1}` })
      expect(state.position).toBe(destinations[index])
    })
    expect(state.currentPlayerIndex).toBe(1)
    expect(state.deck).toHaveLength(31)
    expect(getVisibleTable(state)[3]).toBeNull()
    state = act(state, { type: 'choose', choice: { kind: 'exact-card', card: card(10, 'bastos') } }).state
    expect(act(state, { type: 'reveal' }).state).toMatchObject({ phase: 'finished', result: 'won' })
  })
})

describe('acciones inválidas', () => {
  it('rechaza acciones incompatibles con la fase sin mutar el estado ni emitir eventos', () => {
    const initial = createGame([], keepOrder)
    const final = finalFixture()
    const readyFinal = act(final, { type: 'choose', choice: { kind: 'exact-card', card: final.table[3] } }).state
    const finished = act(readyFinal, { type: 'reveal' }).state
    const cases: [GameState, GameAction, string][] = [
      [initial, { type: 'draw' }, 'missing-choice'],
      [initial, { type: 'reveal' }, 'invalid-action'],
      [initial, { type: 'restart' }, 'invalid-action'],
      [final, { type: 'reveal' }, 'missing-choice'],
      [final, { type: 'draw' }, 'invalid-action'],
      [readyFinal, { type: 'draw' }, 'invalid-action'],
      [finished, { type: 'draw' }, 'game-finished'],
      [finished, { type: 'reveal' }, 'game-finished'],
      [finished, { type: 'choose', choice: higher }, 'game-finished'],
    ]
    for (const [state, action, error] of cases) {
      const random = vi.fn(() => 0)
      const result = applyAction(deepFreeze(state), action, random)
      expect(result).toEqual({ ok: false, error, state, events: [] })
      expect(result.state).toBe(state)
      expect(random).not.toHaveBeenCalled()
    }
  })

  it('rechaza elecciones incorrectas para la pregunta y valores inexistentes', () => {
    const cases: [GameState, Choice][] = [
      [fixture(1, card(5), card(6)), cups],
      [fixture(2, card(5), card(6)), even],
      [fixture(4, card(5), card(6)), higher],
      [fixture(5, card(5), card(6)), lower],
      [finalFixture(), cups],
      [finalFixture(), { kind: 'exact-card', card: { value: 8, suit: 'oros' } } as unknown as Choice],
      [fixture(1, card(5), card(6)), { kind: 'comparison', prediction: 'equal' } as unknown as Choice],
      [fixture(5, card(5), card(6)), { kind: 'suit', suit: 'tréboles' } as unknown as Choice],
    ]
    for (const [state, choice] of cases) {
      const result = applyAction(deepFreeze(state), { type: 'choose', choice }, keepOrder)
      expect(result).toEqual({ ok: false, error: 'invalid-choice', state, events: [] })
      expect(result.state).toBe(state)
    }
  })
})
