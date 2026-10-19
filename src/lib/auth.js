import { nextTick, reactive, watch } from 'vue'
import { store, snapshot, replaceAll, resetAll } from './storage'
import { mergeProgress } from './merge'

// Optional accounts through Supabase. Without the two VITE_SUPABASE_* settings (and in the
// sandboxed preview build) the site stays exactly as before: progress in this browser only.
const URL_ = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const authEnabled = !!(URL_ && KEY) && !import.meta.env.VITE_MEMORY_ROUTER

// sync: 'idle' | 'syncing' | 'saved' | 'offline'
export const auth = reactive({ ready: !authEnabled, user: null, sync: 'idle' })

let client = null
let applying = false
let pushTimer = null
let lastPull = 0

async function getClient() {
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js')
    client = createClient(URL_, KEY, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } })
  }
  return client
}

// Downloads the account's copy, merges it with this browser's, and saves the result to both.
async function pull() {
  if (!auth.user) return
  lastPull = Date.now()
  auth.sync = 'syncing'
  const { data, error } = await client.from('progress').select('data').eq('user_id', auth.user.id).maybeSingle()
  if (error) {
    auth.sync = 'offline'
    return
  }
  applying = true
  replaceAll(mergeProgress(snapshot(), data?.data ?? {}))
  await nextTick()
  applying = false
  await push()
}

async function push() {
  clearTimeout(pushTimer)
  pushTimer = null
  if (!auth.user) return false
  auth.sync = 'syncing'
  const { error } = await client.from('progress').upsert({ user_id: auth.user.id, data: snapshot(), updated_at: new Date().toISOString() })
  auth.sync = error ? 'offline' : 'saved'
  return !error
}

export async function initAuth() {
  if (!authEnabled) return
  const sb = await getClient()
  sb.auth.onAuthStateChange((event, session) => {
    const was = auth.user?.id
    auth.user = session?.user ?? null
    auth.ready = true
    // Supabase calls back while holding its auth lock, so the database work runs afterwards.
    if (auth.user && auth.user.id !== was) setTimeout(pull)
  })

  // Every change saves to the account a moment later.
  watch(
    store,
    () => {
      if (!auth.user || applying) return
      clearTimeout(pushTimer)
      pushTimer = setTimeout(push, 1500)
    },
    { deep: true }
  )

  // Coming back to the tab picks up progress made on another device; leaving it saves now.
  document.addEventListener('visibilitychange', () => {
    if (!auth.user) return
    if (document.visibilityState === 'hidden' && pushTimer) push()
    else if (document.visibilityState === 'visible' && Date.now() - lastPull > 30_000) pull()
  })
}

export async function signInWithGoogle() {
  const sb = await getClient()
  const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href } })
  if (error) throw error
}

export async function sendEmailLink(email) {
  const sb = await getClient()
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href } })
  if (error) throw error
}

// Saves first, then clears this browser so the next person on a shared computer starts fresh.
// Returns false (and stays signed in) if the latest progress could not be saved.
export async function signOut({ force = false } = {}) {
  if (!(await push()) && !force) return false
  await client.auth.signOut()
  auth.user = null
  auth.sync = 'idle'
  applying = true
  resetAll()
  await nextTick()
  applying = false
  return true
}
