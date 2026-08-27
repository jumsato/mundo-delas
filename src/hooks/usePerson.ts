import { useCallback, useState } from 'react'
import type { Person } from '../types'

const STORAGE_KEY = 'mundo-delas:person:v1'

export function usePerson() {
  const [person, setPersonState] = useState<Person | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'juliana' || stored === 'isa' ? stored : null
  })

  const setPerson = useCallback((next: Person) => {
    localStorage.setItem(STORAGE_KEY, next)
    setPersonState(next)
  }, [])

  const clearPerson = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setPersonState(null)
  }, [])

  return { person, setPerson, clearPerson }
}
