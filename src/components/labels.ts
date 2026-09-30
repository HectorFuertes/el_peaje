import type { Card, CardValue, Choice, Suit } from '../game/types'

export const suitLabels: Record<Suit, string> = {
  oros: 'Oros', copas: 'Copas', espadas: 'Espadas', bastos: 'Bastos',
}

export function valueLabel(value: CardValue): string {
  switch (value) {
    case 1: return 'As'
    case 10: return 'Sota'
    case 11: return 'Caballo'
    case 12: return 'Rey'
    default: return String(value)
  }
}

export function cardLabel(card: Card): string {
  return `${valueLabel(card.value)} de ${suitLabels[card.suit]}`
}

export function choiceLabel(choice: Choice): string {
  switch (choice.kind) {
    case 'comparison': return choice.prediction === 'higher' ? 'Mayor' : 'Menor'
    case 'parity': return choice.prediction === 'even' ? 'Par' : 'Impar'
    case 'suit': return suitLabels[choice.suit]
    case 'exact-card': return cardLabel(choice.card)
  }
}
