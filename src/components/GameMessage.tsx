import { useEffect, useRef } from 'react'
import type { ActionError, GameEvent, Player } from '../game/types'
import { cardLabel } from './labels'

interface GameMessageProps {
  readonly events: readonly GameEvent[]
  readonly players: readonly Player[]
  readonly error: ActionError | null
  readonly onContinue: () => void
}

const errors: Record<ActionError, string> = {
  'invalid-action': 'Esta acción no está disponible ahora.',
  'invalid-choice': 'Elige una respuesta disponible para esta pregunta.',
  'missing-choice': 'Selecciona una respuesta antes de continuar.',
  'game-finished': 'La partida ya ha terminado.',
}

export function GameMessage({ events, players, error, onContinue }: GameMessageProps) {
  const continueButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    continueButton.current?.focus()
  }, [])

  return (
    <section className="panel message-panel" aria-labelledby="message-title">
      <h2 id="message-title">Resultado de la jugada</h2>
      <div role="status" aria-live="polite" aria-atomic="true">
        {events.map((event, index) => {
          const playerName = 'playerId' in event ? players.find((player) => player.id === event.playerId)?.name : undefined
          switch (event.type) {
            case 'answer':
              return (
                <div key={index} className="message-detail">
                  <p><strong>{playerName}</strong> ha sacado {cardLabel(event.drawnCard)} en la posición {event.position}.</p>
                  <p>{event.outcome === 'tie' ? 'Mismo valor. Vuelve a sacar.' : event.outcome === 'correct' ? '¡Acierto!' : 'Fallo.'}</p>
                </div>
              )
            case 'penalty':
              return (
                <div key={index} className="penalty-message">
                  <p className="penalty-title">¡Bebes x{event.amount}!</p>
                  <p><strong>{playerName}</strong> debe beber.{event.reason === 'toll' ? ' Has cruzado el peaje.' : event.reason === 'wrong-answer-and-toll' ? ' Fallo y peaje incluidos.' : ''}</p>
                </div>
              )
            case 'deck-rebuilt':
              return <p key={index}>Mazo barajado de nuevo: {event.cardCount} cartas para robar.</p>
            case 'game-finished':
              return <p key={index}>{event.result === 'won' ? '¡Habéis ganado!' : 'Habéis perdido'}</p>
          }
        })}
        {error && <p>{errors[error]}</p>}
      </div>
      <button ref={continueButton} type="button" className="primary full-width" onClick={onContinue}>Continuar</button>
    </section>
  )
}
