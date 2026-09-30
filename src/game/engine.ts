import { sameCard } from './cards'
import { addToPile, rebuildDeck, takeCard, topCard } from './deck'
import { evaluateAnswer, isChoiceAllowed, resolveQuestion } from './rules'
import { restartGame } from './setup'
import type {
  ActionError, BaseGameState, Choice, CurrentPosition, GameAction, GameEvent,
  GameState, RandomSource, ReadyToDrawState, TransitionResult,
} from './types'

function reject(state: GameState, error: ActionError): TransitionResult {
  return { ok: false, state, events: [], error }
}

function waitingState(base: BaseGameState, position: CurrentPosition): GameState {
  if (position === 'final') {
    return { ...base, position, phase: 'awaiting-final-choice', choice: null }
  }
  return { ...base, position, phase: 'awaiting-choice', choice: null }
}

function choose(state: GameState, choice: Choice): TransitionResult {
  if (!isChoiceAllowed(state, choice)) return reject(state, 'invalid-choice')
  // Narrow both the stage and choice so incompatible pairs cannot enter GameState.
  switch (state.position) {
    case 1:
    case 2:
      if (choice.kind === 'comparison') {
        return { ok: true, state: { ...state, phase: 'ready-to-draw', choice }, events: [] }
      }
      break
    case 4:
      if (choice.kind === 'parity') {
        return { ok: true, state: { ...state, phase: 'ready-to-draw', choice }, events: [] }
      }
      break
    case 5:
      if (choice.kind === 'suit') {
        return { ok: true, state: { ...state, phase: 'ready-to-draw', choice }, events: [] }
      }
      break
    case 'final':
      if (choice.kind === 'exact-card') {
        return { ok: true, state: { ...state, phase: 'ready-to-reveal', choice }, events: [] }
      }
      break
  }
  return reject(state, 'invalid-choice')
}

function draw(state: ReadyToDrawState, random: RandomSource): TransitionResult {
  const playerId = state.players[state.currentPlayerIndex].id
  const referenceCard = topCard(state.table[state.position])
  const drawn = takeCard(state.deck)
  const table = addToPile(state.table, state.position, drawn.card)
  const outcome = evaluateAnswer(state.choice, referenceCard, drawn.card)
  const consequence = resolveQuestion(state.position, outcome)
  const events: GameEvent[] = [{
    type: 'answer', position: state.position, playerId, outcome,
    referenceCard, drawnCard: drawn.card,
  }]

  // Effects belong to the answering player and are resolved before advancing the turn.
  if (consequence.penalty) events.push({ type: 'penalty', playerId, ...consequence.penalty })

  const base: BaseGameState = {
    players: state.players,
    currentPlayerIndex: consequence.advancePlayer
      ? (state.currentPlayerIndex + 1) % state.players.length : state.currentPlayerIndex,
    deck: drawn.deck,
    table,
  }
  let next: GameState = outcome === 'tie'
    ? { ...state, ...base }
    : waitingState(base, consequence.position)

  // Rebuild only after placing and resolving the last card, even when it was a tie.
  if (next.deck.length === 0) {
    const rebuilt = rebuildDeck(next.table, random)
    next = { ...next, ...rebuilt }
    events.push({ type: 'deck-rebuilt', cardCount: rebuilt.deck.length })
  }
  return { ok: true, state: next, events }
}

export function applyAction(
  state: GameState,
  action: GameAction,
  random: RandomSource,
): TransitionResult {
  if (action.type === 'restart') {
    if (state.phase !== 'finished') return reject(state, 'invalid-action')
    return { ok: true, state: restartGame(state, random), events: [] }
  }
  if (state.phase === 'finished') return reject(state, 'game-finished')

  switch (action.type) {
    case 'choose':
      return choose(state, action.choice)
    case 'draw':
      if (state.phase === 'awaiting-choice') return reject(state, 'missing-choice')
      if (state.phase !== 'ready-to-draw') return reject(state, 'invalid-action')
      return draw(state, random)
    case 'reveal': {
      if (state.phase === 'awaiting-final-choice') return reject(state, 'missing-choice')
      if (state.phase !== 'ready-to-reveal') return reject(state, 'invalid-action')
      const result = sameCard(state.choice.card, state.table[3]) ? 'won' : 'lost'
      return {
        ok: true,
        state: { ...state, phase: 'finished', result },
        events: [{
          type: 'game-finished', playerId: state.players[state.currentPlayerIndex].id,
          result, guess: state.choice.card, centralCard: state.table[3],
        }],
      }
    }
  }
}
