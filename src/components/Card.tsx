import type { Card as PlayingCard } from '../game/types'
import { cardLabel, suitLabels, valueLabel } from './labels'

interface CardProps {
  readonly card: PlayingCard | null
}

export function Card({ card }: CardProps) {
  if (card === null) {
    return (
      <div className="card card-back" role="img" aria-label="Carta central boca abajo">
        <span aria-hidden="true">?</span>
      </div>
    )
  }

  const label = valueLabel(card.value)

  return (
    <div className={`card card-${card.suit}`} role="img" aria-label={cardLabel(card)}>
      <span className={label.length > 2 ? 'card-value card-value-word' : 'card-value'} aria-hidden="true">{label}</span>
      <span className="card-suit" aria-hidden="true">{suitLabels[card.suit]}</span>
    </div>
  )
}
