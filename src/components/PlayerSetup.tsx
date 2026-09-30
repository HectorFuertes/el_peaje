import { useState } from 'react'
import type { FormEvent } from 'react'

interface PlayerSetupProps {
  readonly players: readonly string[]
  readonly onPlayersChange: (players: string[]) => void
  readonly onStart: () => void
}

export function PlayerSetup({ players, onPlayersChange, onStart }: PlayerSetupProps) {
  const [name, setName] = useState('')

  function addPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onPlayersChange([...players, trimmed])
    setName('')
  }

  return (
    <section className="panel setup-panel" aria-labelledby="setup-title">
      <h2 id="setup-title">¿Quién juega?</h2>
      <p>Añade a los jugadores en orden de turno.</p>
      <form onSubmit={addPlayer} className="player-form">
        <label htmlFor="player-name">Nombre del jugador</label>
        <div className="add-player-row">
          <input id="player-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre" autoComplete="off" />
          <button type="submit" disabled={!name.trim()}>Añadir jugador</button>
        </div>
      </form>
      {players.length > 0 ? (
        <ol className="player-list" aria-label="Jugadores añadidos" aria-live="polite">
          {players.map((player, index) => (
            <li key={index}>
              <span><span className="player-order">{index + 1}.</span> {player}</span>
              <button type="button" className="secondary" aria-label={`Eliminar a ${player}, jugador ${index + 1}`} onClick={() => onPlayersChange(players.filter((_, item) => item !== index))}>Eliminar</button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="setup-hint">Puedes empezar sin añadir nombres. Jugarás como «Jugador 1».</p>
      )}
      <button type="button" className="primary full-width" onClick={onStart}>Empezar partida</button>
    </section>
  )
}
