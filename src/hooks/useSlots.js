import { useCallback, useEffect, useState } from 'react'
import { backend, configurationError } from '../lib/backend'
import { isClaimed } from '../lib/slots'

export function useSlots() {
  const [userId, setUserId] = useState(null)
  const [slots, setSlots] = useState(() => new Map())
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState('connecting')
  const [error, setError] = useState(null)
  const [profiles, setProfiles] = useState(() => new Map())
  const [profilesAvailable, setProfilesAvailable] = useState(true)

  const upsertProfile = useCallback((profile) => {
    if (profile?.id) setProfiles((prev) => new Map(prev).set(profile.id, profile))
  }, [])

  const loadProfiles = useCallback(async () => {
    try {
      const rows = (await backend.listProfiles()) ?? []
      setProfiles(new Map(rows.filter((p) => p?.id).map((p) => [p.id, p])))
      setProfilesAvailable(true)
    } catch {
      setProfilesAvailable(false)
    }
  }, [])

  const removeLocal = useCallback((index) => {
    setSlots((prev) => {
      if (!prev.has(index)) return prev
      const next = new Map(prev)
      next.delete(index)
      return next
    })
  }, [])

  const upsertLocal = useCallback(
    (row) => {
      if (!isClaimed(row)) {
        if (row?.slot_index != null) removeLocal(row.slot_index)
        return
      }
      setSlots((prev) => new Map(prev).set(row.slot_index, row))
    },
    [removeLocal],
  )

  const load = useCallback(async () => {
    const rows = (await backend.list()) ?? []
    setSlots(new Map(rows.filter(isClaimed).map((row) => [row.slot_index, row])))
  }, [])

  useEffect(() => {
    let active = true
    let unsubscribe = null

    if (configurationError) {
      console.error('[supabase] yapılandırma hatası', configurationError)
      setError(configurationError)
      setStatus('error')
      return () => {
        active = false
      }
    }

    backend
      .ensureSession()
      .then(async (user) => {
        if (!active) return
        setUserId(user.id)
        await Promise.all([load(), loadProfiles()])
        if (!active) return
        setReady(true)

        unsubscribe = backend.subscribe({
          onUpsert: (row) => active && upsertLocal(row),
          onDelete: (index) => active && removeLocal(index),
          onResync: () => active && load().catch(() => {}),
          onStatus: (s) => active && setStatus(s),
          onProfile: (profile) => active && upsertProfile(profile),
          onProfilesResync: () => active && loadProfiles(),
        })
      })
      .catch((err) => {
        if (!active) return
        console.error('[supabase] veritabanı bağlantısı kurulamadı', err)
        setError(err)
        setStatus('error')
      })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [load, loadProfiles, upsertLocal, removeLocal, upsertProfile])

  const claim = useCallback(
    async (index, ownerName) => {
      const result = await backend.claim(index, ownerName)
      if (result.ok && result.row) upsertLocal(result.row)
      else if (result.reason === 'taken') await load().catch(() => {})
      return result
    },
    [load, upsertLocal],
  )

  const release = useCallback(
    async (index) => {
      const result = await backend.release(index)
      if (result.ok) removeLocal(index)
      else if (result.reason === 'forbidden') await load().catch(() => {})
      return result
    },
    [load, removeLocal],
  )

  const saveProfile = useCallback(
    async (fields) => {
      const result = await backend.saveProfile(fields)
      if (result.ok) {
        upsertProfile(result.profile)
        setProfilesAvailable(true)
      } else if (result.missingTable) {
        setProfilesAvailable(false)
      }
      return result
    },
    [upsertProfile],
  )

  const releaseAll = useCallback(async () => {
    const result = await backend.releaseAll()
    await load().catch(() => {})
    return result
  }, [load])

  return {
    userId,
    ready,
    slots,
    profiles,
    profilesAvailable,
    status,
    error,
    claim,
    release,
    releaseAll,
    saveProfile,
  }
}
