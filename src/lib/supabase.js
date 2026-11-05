import { createClient } from '@supabase/supabase-js'

const rawUrl = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

function resolveSupabaseUrl(value) {
  if (!value) return { url: '', error: null }
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    return {
      url: '',
      error: new Error(
        'VITE_SUPABASE_URL geçersiz. https://<proje>.supabase.co biçiminde mutlak bir adres olmalı; göreli bir yol GitHub Pages adresine gider.',
      ),
    }
  }
  const onPages = parsed.hostname === 'github.io' || parsed.hostname.endsWith('.github.io')
  if (parsed.protocol !== 'https:' || onPages) {
    return {
      url: '',
      error: new Error(
        `VITE_SUPABASE_URL (${parsed.origin}) Supabase adresi değil. İstekler /Wc-takip/ altına değil, https://<proje>.supabase.co adresine gitmeli.`,
      ),
    }
  }
  return { url: parsed.origin, error: null }
}

const resolved = resolveSupabaseUrl(rawUrl)
export const supabaseUrlError = resolved.error
export const supabaseUrl = resolved.url
export const supabaseHost = resolved.url ? new URL(resolved.url).host : ''
export const isSupabaseConfigured = Boolean(resolved.url && key && !resolved.error)

export const supabase = isSupabaseConfigured ? createClient(resolved.url, key) : null

let sessionPromise = null

/** Tarayıcı başına tek bir anonim Supabase kullanıcısı; slot sahipliği bu kimliğe bağlıdır. */
export function ensureSession() {
  sessionPromise ??= (async () => {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.user) return data.session.user

    const { data: signIn, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    if (!signIn?.user) throw new Error('Anonim oturum açılamadı. Supabase ayarlarında anonymous sign-ins açık mı?')
    return signIn.user
  })().catch((err) => {
    sessionPromise = null
    throw err
  })
  return sessionPromise
}
