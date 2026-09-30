import { useRef, useState } from 'react'
import { initialSession, updateSession } from './gameSession'
import type { SessionAction } from './gameSession'

export function useGame() {
  const [session, setSession] = useState(initialSession)
  const current = useRef(initialSession)

  function send(action: SessionAction) {
    // Run randomness in the event handler, outside React's replayable updaters.
    const next = updateSession(current.current, action, Math.random)
    current.current = next
    setSession(next)
  }

  return { session, send }
}
