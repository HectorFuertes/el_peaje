import { getAvailableActions, getAvailableChoices } from '../game/selectors'
import type { Choice, QuestionGameState } from '../game/types'
import { choiceLabel } from './labels'

interface QuestionPanelProps {
  readonly state: QuestionGameState
  readonly disabled: boolean
  readonly onChoice: (choice: Choice) => void
  readonly onDraw: () => void
}

const questions = { 1: '¿Mayor o menor?', 2: '¿Mayor o menor?', 4: '¿Par o impar?', 5: '¿De qué palo es?' }

export function QuestionPanel({ state, disabled, onChoice, onDraw }: QuestionPanelProps) {
  const choices = getAvailableChoices(state)
  const actions = getAvailableActions(state)

  return (
    <section className="panel question-panel" aria-labelledby="question-title">
      <h2 id="question-title">{questions[state.position]}</h2>
      <p>Elige tu respuesta para la siguiente carta.</p>
      <div className="choice-grid" role="group" aria-label={questions[state.position]}>
        {choices.map((choice) => {
          const label = choiceLabel(choice)
          const selected = state.choice !== null && choiceLabel(state.choice) === label
          return (
            <button key={label} type="button" className="choice-button" aria-pressed={selected} disabled={disabled || !actions.includes('choose')} onClick={() => onChoice(choice)}>{label}</button>
          )
        })}
      </div>
      <button type="button" className="primary full-width" disabled={disabled || !actions.includes('draw')} onClick={onDraw}>Sacar carta</button>
    </section>
  )
}
