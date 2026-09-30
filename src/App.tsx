import { useState } from 'react'
import { FinalGuess } from './components/FinalGuess'
import { GameBoard } from './components/GameBoard'
import { GameMessage } from './components/GameMessage'
import { GameOver } from './components/GameOver'
import { PlayerSetup } from './components/PlayerSetup'
import { QuestionPanel } from './components/QuestionPanel'
import { getCurrentPlayer } from './game/selectors'
import { useGame } from './ui/useGame'
import './App.css'

function App() {
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const { session, send } = useGame()
  const { game, events, error } = session
  const blocked = events.length > 0 || error !== null

  return (
    <main className="app">
      <header className="app-header">
        <h1>El Peaje</h1>
        <p>Cinco cartas. Un último intento.</p>
      </header>
      {game === null ? (
        <PlayerSetup
          players={playerNames}
          onPlayersChange={setPlayerNames}
          onStart={() => send({ type: 'start', names: playerNames })}
        />
      ) : (
        <>
          <section className="turn-panel" aria-label="Turno actual" aria-live="polite">
            <div>
              <span className="eyebrow">Jugador actual</span>
              <strong>{getCurrentPlayer(game).name}</strong>
            </div>
            <div>
              <span className="eyebrow">Posición actual</span>
              <strong>{game.position === 'final' ? 'Carta central' : `${game.position} de 5`}</strong>
            </div>
          </section>
          <GameBoard state={game} />
          {game.phase === 'finished' ? (
            <GameOver
              state={game}
              onRestart={() => send({ type: 'play', action: { type: 'restart' } })}
              onNewPlayers={() => {
                setPlayerNames([])
                send({ type: 'setup' })
              }}
            />
          ) : game.position === 'final' ? (
            <FinalGuess
              state={game}
              disabled={blocked}
              onChoice={(choice) => send({ type: 'play', action: { type: 'choose', choice } })}
              onReveal={() => send({ type: 'play', action: { type: 'reveal' } })}
            />
          ) : (
            <QuestionPanel
              state={game}
              disabled={blocked}
              onChoice={(choice) => send({ type: 'play', action: { type: 'choose', choice } })}
              onDraw={() => send({ type: 'play', action: { type: 'draw' } })}
            />
          )}
          {blocked && (
            <GameMessage events={events} players={game.players} error={error} onContinue={() => send({ type: 'dismiss' })} />
          )}
        </>
      )}
    </main>
  )
}

export default App
