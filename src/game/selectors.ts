import { createDeck, SUITS } from './cards'
import { topCard } from './deck'
import type { Card, Choice, GameAction, GameState, Player, Position } from './types'

export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex]
}

export function getReferenceCard(state: GameState): Card | null {
  return state.position === 'final' ? null : topCard(state.table[state.position])
}

export function getVisibleTable(state: GameState): Readonly<Record<Position, Card | null>> {
  return {
    1: topCard(state.table[1]),
    2: topCard(state.table[2]),
    3: state.phase === 'finished' ? state.table[3] : null,
    4: topCard(state.table[4]),
    5: topCard(state.table[5]),
  }
}

export function getAvailableChoices(state: GameState): readonly Choice[] {
  if (state.phase === 'finished') return []
  switch (state.position) {
    case 1:
    case 2:
      return [
        { kind: 'comparison', prediction: 'higher' },
        { kind: 'comparison', prediction: 'lower' },
      ]
    case 4:
      return [{ kind: 'parity', prediction: 'even' }, { kind: 'parity', prediction: 'odd' }]
    case 5:
      return SUITS.map((suit) => ({ kind: 'suit', suit }))
    case 'final':
      return createDeck().map((card) => ({ kind: 'exact-card', card }))
  }
}

export function getAvailableActions(state: GameState): readonly GameAction['type'][] {
  switch (state.phase) {
    case 'awaiting-choice': return ['choose']
    case 'ready-to-draw': return ['choose', 'draw']
    case 'awaiting-final-choice': return ['choose']
    case 'ready-to-reveal': return ['choose', 'reveal']
    case 'finished': return ['restart']
  }
}
