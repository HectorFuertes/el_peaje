export type Suit = 'oros' | 'copas' | 'espadas' | 'bastos'
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12

export interface Card {
  readonly suit: Suit
  readonly value: CardValue
}

export interface Player {
  readonly id: string
  readonly name: string
}

export type PlayerList = readonly [Player, ...Player[]]
export type Position = 1 | 2 | 3 | 4 | 5
export type QuestionPosition = Exclude<Position, 3>
export type CurrentPosition = QuestionPosition | 'final'
export type CardPile = readonly [Card, ...Card[]]

export interface Table {
  readonly 1: CardPile
  readonly 2: CardPile
  readonly 3: Card
  readonly 4: CardPile
  readonly 5: CardPile
}

export interface ComparisonChoice {
  readonly kind: 'comparison'
  readonly prediction: 'higher' | 'lower'
}

export interface ParityChoice {
  readonly kind: 'parity'
  readonly prediction: 'even' | 'odd'
}

export interface SuitChoice {
  readonly kind: 'suit'
  readonly suit: Suit
}

export interface ExactCardChoice {
  readonly kind: 'exact-card'
  readonly card: Card
}

export type DrawChoice = ComparisonChoice | ParityChoice | SuitChoice
export type Choice = DrawChoice | ExactCardChoice

export interface BaseGameState {
  readonly players: PlayerList
  readonly currentPlayerIndex: number
  readonly deck: readonly Card[]
  readonly table: Table
}

type QuestionStage<P extends QuestionPosition, C extends DrawChoice> = {
  readonly position: P
} & (
  | { readonly phase: 'awaiting-choice'; readonly choice: null }
  | { readonly phase: 'ready-to-draw'; readonly choice: C }
)

export type QuestionGameState = BaseGameState & (
  | QuestionStage<1 | 2, ComparisonChoice>
  | QuestionStage<4, ParityChoice>
  | QuestionStage<5, SuitChoice>
)

export type FinalGameState = BaseGameState & {
  readonly position: 'final'
} & (
  | { readonly phase: 'awaiting-final-choice'; readonly choice: null }
  | { readonly phase: 'ready-to-reveal'; readonly choice: ExactCardChoice }
)

export type GameResult = 'won' | 'lost'

export type FinishedGameState = BaseGameState & {
  readonly position: 'final'
  readonly phase: 'finished'
  readonly choice: ExactCardChoice
  readonly result: GameResult
}

export type GameState = QuestionGameState | FinalGameState | FinishedGameState
export type ReadyToDrawState = Extract<GameState, { phase: 'ready-to-draw' }>
export type AnswerOutcome = 'correct' | 'incorrect' | 'tie'
export type PenaltyReason = 'wrong-answer' | 'toll' | 'wrong-answer-and-toll'

export type GameAction =
  | { readonly type: 'choose'; readonly choice: Choice }
  | { readonly type: 'draw' }
  | { readonly type: 'reveal' }
  | { readonly type: 'restart' }

export type GameEvent =
  | {
      readonly type: 'answer'
      readonly position: QuestionPosition
      readonly playerId: string
      readonly outcome: AnswerOutcome
      readonly referenceCard: Card
      readonly drawnCard: Card
    }
  | {
      readonly type: 'penalty'
      readonly playerId: string
      readonly amount: 1 | 2
      readonly reason: PenaltyReason
    }
  | { readonly type: 'deck-rebuilt'; readonly cardCount: number }
  | {
      readonly type: 'game-finished'
      readonly playerId: string
      readonly result: GameResult
      readonly guess: Card
      readonly centralCard: Card
    }

export type ActionError = 'invalid-action' | 'invalid-choice' | 'missing-choice' | 'game-finished'

export type TransitionResult =
  | { readonly ok: true; readonly state: GameState; readonly events: readonly GameEvent[] }
  | {
      readonly ok: false
      readonly state: GameState
      readonly events: readonly []
      readonly error: ActionError
    }

/** Returns a number in [0, 1). Supplied by the caller, including in tests. */
export type RandomSource = () => number
