import { createDeck } from './cards'
import { shuffle, takeCard } from './deck'
import type { FinishedGameState, GameState, Player, PlayerList, RandomSource } from './types'

function startGame(players: PlayerList, random: RandomSource): GameState {
  const first = takeCard(shuffle(createDeck(), random))
  const second = takeCard(first.deck)
  const third = takeCard(second.deck)
  const fourth = takeCard(third.deck)
  const fifth = takeCard(fourth.deck)

  return {
    players,
    currentPlayerIndex: 0,
    deck: fifth.deck,
    table: { 1: [first.card], 2: [second.card], 3: third.card, 4: [fourth.card], 5: [fifth.card] },
    position: 1,
    phase: 'awaiting-choice',
    choice: null,
  }
}

export function createGame(playerNames: readonly string[], random: RandomSource): GameState {
  const names = playerNames.map((name) => name.trim()).filter((name) => name.length > 0)
  const players: Player[] = (names.length ? names : ['Jugador 1']).map((name, index) => ({
    id: `player-${index + 1}`,
    name,
  }))
  const [first, ...others] = players
  return startGame([first, ...others], random)
}

export function restartGame(state: FinishedGameState, random: RandomSource): GameState {
  return startGame(state.players, random)
}
