import { getVisibleTable } from '../game/selectors'
import type { FinishedGameState } from '../game/types'
import { Card } from './Card'
import { cardLabel } from './labels'

interface GameOverProps {
  readonly state: FinishedGameState
  readonly onRestart: () => void
  readonly onNewPlayers: () => void
}

export function GameOver({ state, onRestart, onNewPlayers }: GameOverProps) {
  const central = getVisibleTable(state)[3]

  return (
    <section className="panel game-over" aria-labelledby="result-title">
      <h2 id="result-title" role="status">{state.result === 'won' ? '¡Habéis ganado!' : 'Habéis perdido'}</h2>
      <p>La carta central era:</p>
      <div className="revealed-card"><Card card={central} /></div>
      <p>{central && cardLabel(central)}</p>
      <p>Vuestra respuesta: {cardLabel(state.choice.card)}</p>
      <button type="button" className="primary full-width" onClick={onRestart}>Volver a jugar</button>
      <button type="button" className="secondary full-width" onClick={onNewPlayers}>Nueva partida con otros jugadores</button>
    </section>
  )
}
