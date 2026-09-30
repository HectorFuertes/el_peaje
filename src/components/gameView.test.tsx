import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createGame } from '../game/setup'
import { act, card, finalFixture, fixture, keepOrder } from '../game/test-helpers'
import { getAvailableChoices } from '../game/selectors'
import { Card } from './Card'
import { FinalGuess } from './FinalGuess'
import { GameBoard } from './GameBoard'
import { GameMessage } from './GameMessage'
import { GameOver } from './GameOver'
import { PlayerSetup } from './PlayerSetup'
import { QuestionPanel } from './QuestionPanel'
import { cardLabel, suitLabels, valueLabel } from './labels'

function noop() {}

describe('representación de los estados y eventos del motor', () => {
  it('la carta oculta solo representa el reverso', () => {
    const html = renderToStaticMarkup(<Card card={null} />)
    expect(html).toContain('Carta central boca abajo')
    expect(html).not.toMatch(/Oros|Copas|Espadas|Bastos/)
  })

  it('la mesa muestra cinco posiciones en orden y nunca incluye la central antes del final', () => {
    const state = createGame([], keepOrder)
    const html = renderToStaticMarkup(<GameBoard state={state} />)
    expect(html.match(/role="img"/g)).toHaveLength(5)
    expect(html.match(/aria-current="step"/g)).toHaveLength(1)
    expect(html).not.toContain(cardLabel(state.table[3]))
    const positions = [...html.matchAll(/aria-label="Posición (\d)"/g)].map((match) => match[1])
    expect(positions).toEqual(['1', '2', '3', '4', '5'])
  })

  it('al sacar una carta la mesa muestra solo la superior del montón', () => {
    const initial = fixture(1, card(5), card(6, 'copas'))
    const ready = act(initial, { type: 'choose', choice: { kind: 'comparison', prediction: 'higher' } }).state
    const result = act(ready, { type: 'draw' })
    const html = renderToStaticMarkup(<GameBoard state={result.state} />)
    expect(html).toContain('6 de Copas')
    expect(html).not.toContain('5 de Oros')
  })

  it('el panel del peaje nombra a quien respondió, aunque ya haya pasado el turno', () => {
    const initial = fixture(2, card(5), card(6, 'copas'))
    const ready = act(initial, { type: 'choose', choice: { kind: 'comparison', prediction: 'higher' } }).state
    const result = act(ready, { type: 'draw' })
    const html = renderToStaticMarkup(<GameMessage events={result.events} players={result.state.players} error={null} onContinue={noop} />)
    expect(html).toContain('¡Bebes x1!')
    expect(html).toContain('<strong>Ana</strong> debe beber.')
    expect(html).not.toContain('<strong>Luis</strong> debe beber.')
    expect(html).toContain('Continuar')
  })

  it('el panel presenta un único x2 para fallo y peaje en posición 4', () => {
    const initial = fixture(4, card(5), card(6, 'copas'))
    const ready = act(initial, { type: 'choose', choice: { kind: 'parity', prediction: 'odd' } }).state
    const result = act(ready, { type: 'draw' })
    const html = renderToStaticMarkup(<GameMessage events={result.events} players={result.state.players} error={null} onContinue={noop} />)
    expect(html.match(/¡Bebes x2!/g)).toHaveLength(1)
    expect(html).not.toContain('¡Bebes x1!')
  })

  it('deshabilita el robo sin respuesta y conserva la selección visual tras un empate', () => {
    const initial = fixture(1, card(7), card(7, 'copas'))
    const waiting = renderToStaticMarkup(<QuestionPanel state={initial} disabled={false} onChoice={noop} onDraw={noop} />)
    expect(waiting).toMatch(/disabled="">Sacar carta/)
    const ready = act(initial, { type: 'choose', choice: { kind: 'comparison', prediction: 'higher' } }).state
    const tied = act(ready, { type: 'draw' }).state
    if (tied.position === 'final') throw new Error('Se esperaba una pregunta normal.')
    const chosen = renderToStaticMarkup(<QuestionPanel state={tied} disabled={false} onChoice={noop} onDraw={noop} />)
    expect(chosen).toMatch(/aria-pressed="true">Mayor/)
    expect(chosen).not.toMatch(/disabled="">Sacar carta/)
    const message = renderToStaticMarkup(<GameMessage events={act(ready, { type: 'draw' }).events} players={tied.players} error={null} onContinue={noop} />)
    expect(message).toContain('Mismo valor. Vuelve a sacar.')
  })

  it('ofrece todos los valores y palos de las 40 respuestas finales sin revelar la carta', () => {
    const state = finalFixture()
    if (state.position !== 'final' || state.phase === 'finished') throw new Error('Se esperaba la pregunta final.')
    const html = renderToStaticMarkup(<FinalGuess state={state} disabled={false} onChoice={noop} onReveal={noop} />)
    for (const choice of getAvailableChoices(state)) {
      if (choice.kind !== 'exact-card') throw new Error('Se esperaba una respuesta exacta.')
      expect(html).toContain(`>${valueLabel(choice.card.value)}</button>`)
      expect(html).toContain(`>${suitLabels[choice.card.suit]}</button>`)
    }
    expect(html.match(/<button/g)).toHaveLength(15)
    expect(html).toMatch(/disabled="">Revelar carta/)
    expect(html).not.toContain(cardLabel(state.table[3]))
  })

  it.each(['won', 'lost'] as const)('muestra el resultado %s y la carta central revelada', (result) => {
    const initial = finalFixture()
    const guess = result === 'won' ? initial.table[3] : card(1)
    const ready = act(initial, { type: 'choose', choice: { kind: 'exact-card', card: guess } }).state
    const state = act(ready, { type: 'reveal' }).state
    if (state.phase !== 'finished') throw new Error('Se esperaba una partida terminada.')
    const html = renderToStaticMarkup(<GameOver state={state} onRestart={noop} onNewPlayers={noop} />)
    expect(html).toContain(result === 'won' ? '¡Habéis ganado!' : 'Habéis perdido')
    expect(html).toContain(cardLabel(state.table[3]))
    expect(html).toContain('Volver a jugar')
    expect(html).toContain('Nueva partida con otros jugadores')
    expect(renderToStaticMarkup(<GameBoard state={state} />)).not.toContain('Carta central boca abajo')
  })

  it('mantiene los nombres repetidos como jugadores distintos con controles para eliminarlos', () => {
    const html = renderToStaticMarkup(<PlayerSetup players={['Ana', 'Ana']} onPlayersChange={noop} onStart={noop} />)
    expect(html).toContain('Eliminar a Ana, jugador 1')
    expect(html).toContain('Eliminar a Ana, jugador 2')
    expect(html).toContain('Empezar partida')
  })
})
