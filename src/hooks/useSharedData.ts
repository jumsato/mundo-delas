import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore'
import { db, ready } from '../firebase'
import type { Level, Person, VisitRecord, WishlistOwner, WishlistRecord, WishlistsByOwner } from '../types'

const EMPTY_WISHLISTS: WishlistsByOwner = { juliana: {}, isa: {}, shared: {} }

function wishlistCollectionName(owner: WishlistOwner) {
  return `wishlist_${owner}`
}

function key(level: Level, id: string) {
  return `${level}:${id}`
}

export function useSharedData() {
  const [visits, setVisits] = useState<VisitRecord>({})
  const [wishlists, setWishlists] = useState<WishlistsByOwner>(EMPTY_WISHLISTS)

  useEffect(() => {
    let unsubs: Array<() => void> = []

    ready.then(() => {
      unsubs.push(
        onSnapshot(collection(db, 'visits'), (snap) => {
          const next: VisitRecord = {}
          snap.forEach((d) => {
            next[d.id] = d.data() as VisitRecord[string]
          })
          setVisits(next)
        }),
      )

      ;(['juliana', 'isa', 'shared'] as WishlistOwner[]).forEach((owner) => {
        unsubs.push(
          onSnapshot(collection(db, wishlistCollectionName(owner)), (snap) => {
            const next: WishlistRecord = {}
            snap.forEach((d) => {
              next[d.id] = d.data() as WishlistRecord[string]
            })
            setWishlists((prev) => ({ ...prev, [owner]: next }))
          }),
        )
      })
    })

    return () => unsubs.forEach((u) => u())
  }, [])

  async function setVisited(
    level: Level,
    id: string,
    name: string,
    person: Person,
    visited: boolean,
    parent?: { countryId?: string; stateId?: string },
  ) {
    await ready
    await setDoc(
      doc(db, 'visits', key(level, id)),
      { level, id, name, [person]: visited, ...(parent?.countryId ? { countryId: parent.countryId } : {}), ...(parent?.stateId ? { stateId: parent.stateId } : {}) },
      { merge: true },
    )
  }

  async function addToWishlist(owner: WishlistOwner, level: Level, id: string, name: string) {
    await ready
    const current = wishlists[owner]
    if (current[key(level, id)]) return
    const nextRank =
      1 +
      Object.values(current)
        .filter((e) => e.level === level)
        .reduce((max, e) => Math.max(max, e.rank), 0)
    await setDoc(doc(db, wishlistCollectionName(owner), key(level, id)), {
      level,
      id,
      name,
      rank: nextRank,
    })
  }

  async function removeFromWishlist(owner: WishlistOwner, level: Level, id: string) {
    await ready
    await deleteDoc(doc(db, wishlistCollectionName(owner), key(level, id)))
  }

  async function reorderWishlist(owner: WishlistOwner, level: Level, orderedIds: string[]) {
    await ready
    const batch = writeBatch(db)
    const current = wishlists[owner]
    orderedIds.forEach((id, index) => {
      const entry = current[key(level, id)]
      if (entry) batch.set(doc(db, wishlistCollectionName(owner), key(level, id)), { ...entry, rank: index + 1 })
    })
    await batch.commit()
  }

  return { visits, wishlists, setVisited, addToWishlist, removeFromWishlist, reorderWishlist }
}
