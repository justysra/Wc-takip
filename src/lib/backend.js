import { demoBackend } from './demoBackend'
import { ensureSession, isSupabaseConfigured, supabase, supabaseHost, supabaseUrlError } from './supabase'

const COLUMNS = 'slot_index, owner_name, owner_id, claimed_at'
const PROFILE_COLUMNS = 'id, display_name, hue, updated_at'

const supabaseBackend = {
  ensureSession,

  async list() {
    const { data, error } = await supabase.from('slots').select(COLUMNS)
    if (error) throw error
    return data ?? []
  },

  async listProfiles() {
    const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS)
    if (error) throw error
    return data ?? []
  },

  async saveProfile({ displayName, hue }) {
    const user = await ensureSession()
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, display_name: displayName, hue, updated_at: new Date().toISOString() })
      .select(PROFILE_COLUMNS)
      .single()
    if (error) {
      const missingTable = error.code === '42P01' || error.code === 'PGRST205'
      return { ok: false, missingTable, message: error.message }
    }
    return { ok: true, profile: data }
  },

  subscribe({ onUpsert, onDelete, onResync, onStatus, onProfile, onProfilesResync }) {
    // Profiller ayrı kanalda: profiles tablosu henüz kurulmamışsa slot canlılığı etkilenmesin.
    const profileChannel = supabase
      .channel('profiles-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.new?.id) onProfile(payload.new)
      })
      .subscribe((state) => {
        if (state === 'SUBSCRIBED') onProfilesResync()
      })

    const channel = supabase
      .channel('slots-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          if (payload.old?.slot_index != null) onDelete(payload.old.slot_index)
        } else if (payload.new?.slot_index != null) {
          onUpsert(payload.new)
        }
      })
      .subscribe((state) => {
        if (state === 'SUBSCRIBED') {
          onStatus('live')
          // Bağlantı koptuysa aradaki değişiklikleri kaçırmamak için yeniden senkronize ol.
          onResync()
        } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
          onStatus('offline')
        }
      })
    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(profileChannel)
    }
  },

  async claim(index, ownerName) {
    const { data, error } = await supabase
      .from('slots')
      .insert({ slot_index: index, owner_name: ownerName })
      .select(COLUMNS)
      .single()
    if (error) {
      if (error.code !== '23505') return { ok: false, reason: 'error', message: error.message }
      // Satır zaten var: sahipsiz (önceden tohumlanmış) ise sahiplen, değilse başkası almış demektir.
      const { data: updated, error: updateError } = await supabase
        .from('slots')
        .update({ owner_name: ownerName, owner_id: (await ensureSession()).id, claimed_at: new Date().toISOString() })
        .eq('slot_index', index)
        .is('owner_id', null)
        .select(COLUMNS)
      if (updateError) return { ok: false, reason: 'error', message: updateError.message }
      if (!updated?.length) return { ok: false, reason: 'taken' }
      return { ok: true, row: updated[0] }
    }
    if (!data) return { ok: false, reason: 'error', message: 'Sunucu kaydı döndürmedi.' }
    return { ok: true, row: data }
  },

  async release(index) {
    const { data, error } = await supabase.from('slots').delete().eq('slot_index', index).select('slot_index')
    if (error) return { ok: false, reason: 'error', message: error.message }
    // RLS sahibi olmayanın silmesini sessizce engeller (0 satır döner).
    if (!data?.length) return { ok: false, reason: 'forbidden' }
    return { ok: true }
  },

  async releaseAll() {
    const user = await ensureSession()
    const { data, error } = await supabase.from('slots').delete().eq('owner_id', user.id).select('slot_index')
    if (error) return { ok: false, message: error.message }
    return { ok: true, count: data?.length ?? 0 }
  },
}

const demoRequested = import.meta.env.VITE_DEMO === 'true'

export const configurationError = (() => {
  if (demoRequested) return null
  if (supabaseUrlError) return supabaseUrlError
  if (!isSupabaseConfigured) {
    return new Error(
      'VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY derleme sırasında yok. GitHub Pages yerel .env dosyasını okumaz; bu değerler Actions secret olarak verilmelidir.',
    )
  }
  return null
})()

if (demoRequested) {
  console.warn('[supabase] VITE_DEMO=true. Gerçek veritabanı kullanılmıyor.')
} else if (configurationError) {
  console.error('[supabase]', configurationError.message)
} else {
  console.info('[supabase] bağlanılıyor:', supabaseHost)
}

function unavailableBackend(error) {
  const fail = (method) => async () => {
    console.error(`[supabase] ${method} atlandı:`, error.message)
    throw error
  }
  return {
    ensureSession: fail('ensureSession'),
    list: fail('list'),
    listProfiles: fail('listProfiles'),
    saveProfile: fail('saveProfile'),
    claim: fail('claim'),
    release: fail('release'),
    releaseAll: fail('releaseAll'),
    subscribe() {
      console.error('[supabase] subscribe atlandı:', error.message)
      throw error
    },
  }
}

export const isDemo = demoRequested

export const backend = configurationError ? unavailableBackend(configurationError) : isDemo ? demoBackend : supabaseBackend
