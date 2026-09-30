import { describe, expect, it, vi } from 'vitest'
import { getCurrentPlayer, getVisibleTable } from '../game/selectors'
import { card, finalFixture, fixture, keepOrder } from '../game/test-helpers'
import type { Choice, GameAction, GameState, QuestionPosition } from '../game/types'
import { initialSession, updateSession } from './gameSession'
import type { GameSession, SessionAction } from './gameSession'

function send(session: GameSession, action: SessionAction): GameSession {
  return updateSession(session, action, keepOrder)
}

function play(session: GameSession, action: GameAction): GameSession {
  return send(session, { type: 'play', action })
}

function fromGame(game: GameState): GameSession {
  return { game, events: [], error: null }
}

function draw(session: GameSession, choice: Choice): GameSession {
  return play(play(session, { type: 'choose', choice }), { type: 'draw' })
}

describe('integración de la sesión con el motor', () => {
  it('delega en el motor el jugador por defecto cuando se empieza sin nombres', () => {
    const session = send(initialSession, { type: 'start', names: [] })
    expect(session.game!.players.map((player) => player.name)).toEqual(['Jugador 1'])
    expect(session.game).toMatchObject({ position: 1, phase: 'awaiting-choice', choice: null })
    expect(session.events).toEqual([])
  })

  it('permite cambiar la elección sin robar cartas ni crear un mensaje', () => {
    const initial = send(initialSession, { type: 'start', names: ['Ana', 'Luis'] })
    const first = play(initial, { type: 'choose', choice: { kind: 'comparison', prediction: 'higher' } })
    const changed = play(first, { type: 'choose', choice: { kind: 'comparison', prediction: 'lower' } })
    expect(changed.game!.choice).toEqual({ kind: 'comparison', prediction: 'lower' })
    expect(changed.game!.deck).toBe(initial.game!.deck)
    expect(changed.game!.table).toBe(initial.game!.table)
    expect(changed.events).toEqual([])
  })

  it('impide otro robo o elección mientras se lee un resultado, incluso tras un empate', () => {
    const initial = fromGame(fixture(1, card(7), card(7, 'copas')))
    const result = draw(initial, { kind: 'comparison', prediction: 'higher' })
    const random = vi.fn(keepOrder)
    for (const action of [
      { type: 'draw' },
      { type: 'choose', choice: { kind: 'comparison', prediction: 'lower' } },
    ] as const) {
      expect(updateSession(result, { type: 'play', action }, random)).toBe(result)
    }
    expect(result.game!.deck.length).toBe(initial.game!.deck.length - 1)
    expect(random).not.toHaveBeenCalled()
  })

  it.each([1, 2] as const)('cerrar el empate de posición %s conserva exactamente el estado y la elección', (position) => {
    const result = draw(fromGame(fixture(position, card(7), card(7, 'copas'))), { kind: 'comparison', prediction: 'higher' })
    const random = vi.fn(keepOrder)
    const dismissed = updateSession(result, { type: 'dismiss' }, random)
    expect(dismissed.game).toBe(result.game)
    expect(dismissed.game).toMatchObject({ position, phase: 'ready-to-draw', choice: { kind: 'comparison', prediction: 'higher' } })
    expect(dismissed.events).toEqual([])
    expect(random).not.toHaveBeenCalled()
    expect(play(dismissed, { type: 'draw' }).game!.deck.length).toBe(result.game!.deck.length - 1)
  })

  it('conserva el destinatario del peaje aunque el jugador activo ya sea el siguiente', () => {
    const result = draw(fromGame(fixture(2, card(5), card(6, 'copas'))), { kind: 'comparison', prediction: 'higher' })
    expect(getCurrentPlayer(result.game!).name).toBe('Luis')
    expect(result.events).toContainEqual({ type: 'penalty', playerId: 'player-1', amount: 1, reason: 'toll' })
    expect(result.game!.position).toBe(4)
    expect(send(result, { type: 'dismiss' }).game).toBe(result.game)
  })

  it.each<[QuestionPosition, Choice, number, QuestionPosition]>([
    [1, { kind: 'comparison', prediction: 'lower' }, 1, 1],
    [2, { kind: 'comparison', prediction: 'lower' }, 1, 1],
    [4, { kind: 'parity', prediction: 'odd' }, 2, 2],
    [5, { kind: 'suit', suit: 'oros' }, 1, 4],
  ])('presenta la penalización del motor en posición %s sin aplicarla otra vez al continuar', (position, choice, amount, destination) => {
    const result = draw(fromGame(fixture(position, card(5), card(6, 'copas'))), choice)
    expect(result.events.filter((event) => event.type === 'penalty')).toMatchObject([{ playerId: 'player-1', amount }])
    expect(result.game).toMatchObject({ position: destination, currentPlayerIndex: 0, choice: null })
    expect(send(result, { type: 'dismiss' }).game).toBe(result.game)
  })

  it('muestra los rechazos del motor sin cambiar la partida', () => {
    const initial = send(initialSession, { type: 'start', names: [] })
    const rejected = play(initial, { type: 'draw' })
    expect(rejected.game).toBe(initial.game)
    expect(rejected.error).toBe('missing-choice')
    expect(rejected.events).toEqual([])
    const dismissed = send(rejected, { type: 'dismiss' })
    expect(dismissed.game).toBe(initial.game)
    expect(dismissed.error).toBeNull()
  })

  it.each(['won', 'lost'] as const)('juega desde el reparto hasta %s y reinicia con el primer jugador', (result) => {
    let session = send(initialSession, { type: 'start', names: ['Ana', 'Luis', 'Mar'] })
    for (const choice of [
      { kind: 'comparison', prediction: 'lower' },
      { kind: 'comparison', prediction: 'lower' },
      { kind: 'parity', prediction: 'odd' },
      { kind: 'suit', suit: 'bastos' },
    ] as const) {
      session = draw(session, choice)
      expect(getVisibleTable(session.game!)[3]).toBeNull()
      session = send(session, { type: 'dismiss' })
    }
    expect(session.game!.position).toBe('final')
    session = play(session, { type: 'choose', choice: { kind: 'exact-card', card: card(result === 'won' ? 10 : 1, 'bastos') } })
    expect(getVisibleTable(session.game!)[3]).toBeNull()
    session = play(session, { type: 'reveal' })
    expect(session.game).toMatchObject({ phase: 'finished', result })
    expect(getVisibleTable(session.game!)[3]).toEqual(card(10, 'bastos'))
    expect(session.events).toEqual([])
    const players = session.game!.players
    const random = vi.fn(() => 0)
    session = updateSession(session, { type: 'play', action: { type: 'restart' } }, random)
    expect(session.game!.players).toBe(players)
    expect(session.game).toMatchObject({ position: 1, currentPlayerIndex: 0, phase: 'awaiting-choice', choice: null })
    expect(getVisibleTable(session.game!)[3]).toBeNull()
    expect(random).toHaveBeenCalledTimes(39)
  })

  it('permite modificar la respuesta final antes de revelar sin adelantar el resultado', () => {
    let session = fromGame(finalFixture())
    session = play(session, { type: 'choose', choice: { kind: 'exact-card', card: card(1) } })
    session = play(session, { type: 'choose', choice: { kind: 'exact-card', card: session.game!.table[3] } })
    expect(session.events).toEqual([])
    expect(getVisibleTable(session.game!)[3]).toBeNull()
    expect(play(session, { type: 'reveal' }).game).toMatchObject({ phase: 'finished', result: 'won' })
  })

  it('vuelve a la preparación sin mantener una partida ni mensajes anteriores', () => {
    const result = draw(fromGame(fixture(1, card(5), card(6, 'copas'))), { kind: 'comparison', prediction: 'lower' })
    expect(send(result, { type: 'setup' })).toEqual(initialSession)
  })
})
