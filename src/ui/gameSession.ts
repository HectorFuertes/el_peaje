import { applyAction } from '../game/engine'
import { createGame } from '../game/setup'
import type { ActionError, GameAction, GameEvent, GameState, RandomSource } from '../game/types'

export interface GameSession {
  readonly game: GameState | null
  readonly events: readonly GameEvent[]
  readonly error: ActionError | null
}

export type SessionAction =
  | { readonly type: 'start'; readonly names: readonly string[] }
  | { readonly type: 'play'; readonly action: GameAction }
  | { readonly type: 'dismiss' }
  | { readonly type: 'setup' }

export const initialSession: GameSession = { game: null, events: [], error: null }

/** Coordinates UI messages; every rule and game transition belongs to the engine. */
export function updateSession(
  session: GameSession,
  action: SessionAction,
  random: RandomSource,
): GameSession {
  switch (action.type) {
    case 'start':
      return { game: createGame(action.names, random), events: [], error: null }
    case 'setup':
      return initialSession
    case 'dismiss':
      return { ...session, events: [], error: null }
    case 'play': {
      // Reading a result must not trigger another draw, including rapid double taps.
      if (!session.game || session.events.length > 0 || session.error !== null) return session
      const result = applyAction(session.game, action.action, random)
      if (!result.ok) return { ...session, error: result.error }
      return {
        game: result.state,
        // Finished games show their result directly in GameOver.
        events: result.state.phase === 'finished' ? [] : result.events,
        error: null,
      }
    }
  }
}
