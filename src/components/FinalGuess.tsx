import { useState } from 'react'
import { getAvailableActions, getAvailableChoices } from '../game/selectors'
import type { CardValue, ExactCardChoice, FinalGameState, Suit } from '../game/types'
import { cardLabel, suitLabels, valueLabel } from './labels'

interface FinalGuessProps {
  readonly state: FinalGameState
  readonly disabled: boolean
  readonly onChoice: (choice: ExactCardChoice) => void
  readonly onReveal: () => void
}

export function FinalGuess({ state, disabled, onChoice, onReveal }: FinalGuessProps) {
  const [value, setValue] = useState<CardValue | null>(state.choice?.card.value ?? null)
  const [suit, setSuit] = useState<Suit | null>(state.choice?.card.suit ?? null)
  const choices = getAvailableChoices(state).filter((choice) => choice.kind === 'exact-card')
  const values = [...new Set(choices.map((choice) => choice.card.value))]
  const suits = [...new Set(choices.map((choice) => choice.card.suit))]
  const actions = getAvailableActions(state)

  function select(nextValue: CardValue | null, nextSuit: Suit | null) {
    setValue(nextValue)
    setSuit(nextSuit)
    const choice = choices.find((item) => item.card.value === nextValue && item.card.suit === nextSuit)
    if (choice) onChoice(choice)
  }

  return (
    <section className="panel question-panel" aria-labelledby="final-title">
      <h2 id="final-title">¿Cuál es la carta central?</h2>
      <p>Elige valor y palo. Las 40 combinaciones están disponibles.</p>
      <fieldset disabled={disabled || !actions.includes('choose')}>
        <legend>Valor</legend>
        <div className="value-grid">
          {values.map((option) => (
            <button key={option} type="button" className="choice-button" aria-pressed={value === option} onClick={() => select(option, suit)}>{valueLabel(option)}</button>
          ))}
        </div>
      </fieldset>
      <fieldset disabled={disabled || !actions.includes('choose')}>
        <legend>Palo</legend>
        <div className="choice-grid">
          {suits.map((option) => (
            <button key={option} type="button" className="choice-button" aria-pressed={suit === option} onClick={() => select(value, option)}>{suitLabels[option]}</button>
          ))}
        </div>
      </fieldset>
      <p className="selection-summary" aria-live="polite">{state.choice ? `Tu respuesta: ${cardLabel(state.choice.card)}` : 'Selecciona un valor y un palo.'}</p>
      <button type="button" className="primary full-width" disabled={disabled || !actions.includes('reveal')} onClick={onReveal}>Revelar carta</button>
    </section>
  )
}
