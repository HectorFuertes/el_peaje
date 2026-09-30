import { getVisibleTable } from '../game/selectors'
import type { GameState, Position } from '../game/types'
import { Card } from './Card'

interface GameBoardProps {
  readonly state: GameState
}

const positions: readonly Position[] = [1, 2, 3, 4, 5]

export function GameBoard({ state }: GameBoardProps) {
  const visibleTable = getVisibleTable(state)

  return (
    <section className="board-panel" aria-label="Mesa de juego">
      <ol className="game-board">
        {positions.map((position) => {
          const current = state.position === position || (state.position === 'final' && position === 3)
          return (
            <li key={position} className={current ? 'board-position current' : 'board-position'} aria-current={current ? 'step' : undefined}>
              <span className="position-number" aria-label={`Posición ${position}`}>{position}</span>
              <Card card={visibleTable[position]} />
              <span className="position-caption">{position === 3 ? 'Peaje' : current ? 'Actual' : '\u00a0'}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
