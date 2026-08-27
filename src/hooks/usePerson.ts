import { useCallback, useState } from 'react'
import type { Person } from '../types'

// Deliberately not persisted: every visit to the app should ask who is using it,
// since it's shared between two people on their own devices.
export function usePerson() {
  const [person, setPersonState] = useState<Person | null>(null)

  const setPerson = useCallback((next: Person) => {
    setPersonState(next)
  }, [])

  const clearPerson = useCallback(() => {
    setPersonState(null)
  }, [])

  return { person, setPerson, clearPerson }
}
