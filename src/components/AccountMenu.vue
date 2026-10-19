<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'
import { auth, authEnabled, sendEmailLink, signInWithGoogle, signOut } from '../lib/auth'

const open = ref(false)
const email = ref('')
const sent = ref(false)
const busy = ref(false)
const error = ref('')
const unsaved = ref(false)
const root = ref(null)

const name = computed(() => auth.user?.user_metadata?.full_name || auth.user?.email || '')
const initial = computed(() => (name.value[0] ?? '?').toUpperCase())
const avatar = computed(() => auth.user?.user_metadata?.avatar_url)
const syncText = computed(
  () => ({ syncing: 'Saving…', saved: 'Progress saved to your account', offline: "Couldn't reach your account. Progress is safe in this browser and will save when you're back online." })[auth.sync] ?? 'Progress syncs to your account'
)

function toggle() {
  open.value = !open.value
  error.value = ''
  unsaved.value = false
}

async function google() {
  busy.value = true
  error.value = ''
  try {
    await signInWithGoogle()
  } catch (e) {
    error.value = e.message || 'Google sign-in is not available right now.'
    busy.value = false
  }
}

async function emailLink() {
  busy.value = true
  error.value = ''
  try {
    await sendEmailLink(email.value.trim())
    sent.value = true
  } catch (e) {
    error.value = /rate limit/i.test(e.message ?? '') ? 'Too many sign-in emails were sent. Please try again in a little while.' : e.message || 'Could not send the email.'
  }
  busy.value = false
}

async function leave(force = false) {
  busy.value = true
  const ok = await signOut({ force })
  busy.value = false
  if (ok) open.value = false
  else unsaved.value = true
}

function onDoc(e) {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false
}
function onKey(e) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', onDoc)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDoc)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div v-if="authEnabled && auth.ready" ref="root" class="relative">
    <button
      v-if="auth.user"
      class="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-maroon-600 to-maroon-900 text-sm font-bold text-white ring-2 ring-white/70 transition hover:scale-105 dark:ring-white/10"
      :aria-label="`Account: ${name}`"
      :aria-expanded="open"
      @click="toggle"
    >
      <img v-if="avatar" :src="avatar" alt="" class="h-full w-full object-cover" referrerpolicy="no-referrer" />
      <span v-else>{{ initial }}</span>
    </button>
    <button v-else class="btn-ghost !rounded-xl !px-3.5 !py-2" :aria-expanded="open" @click="toggle">
      <Icon name="user" :size="16" /> <span class="hidden sm:inline">Sign in</span>
    </button>

    <Transition name="fade">
      <div v-if="open" class="card absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] !bg-white p-5 dark:!bg-[#1a1416]" role="dialog" aria-label="Account">
        <template v-if="auth.user">
          <p class="text-xs font-semibold text-stone-500">Signed in as</p>
          <p class="mt-0.5 truncate font-semibold">{{ auth.user.email }}</p>
          <p class="mt-3 flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
            <Icon :name="auth.sync === 'offline' ? 'alert' : 'cloud'" :size="16" class="mt-0.5 shrink-0" :class="auth.sync === 'offline' ? 'text-amber-600' : 'text-maroon-600 dark:text-maroon-300'" />
            {{ syncText }}
          </p>
          <template v-if="unsaved">
            <p class="mt-4 text-sm text-amber-700 dark:text-amber-300">Your latest progress hasn't reached your account yet. Signing out now clears it from this browser.</p>
            <div class="mt-3 flex gap-2">
              <button class="btn-ghost flex-1 !py-2" :disabled="busy" @click="unsaved = false">Stay signed in</button>
              <button class="btn-primary flex-1 !py-2" :disabled="busy" @click="leave(true)">Sign out</button>
            </div>
          </template>
          <button v-else class="btn-ghost mt-4 w-full !py-2.5" :disabled="busy" @click="leave()"><Icon name="log-out" :size="16" /> Sign out</button>
          <p class="mt-3 text-xs text-stone-500">Signing out clears progress from this browser. It stays in your account.</p>
        </template>

        <template v-else-if="sent">
          <div class="grid h-11 w-11 place-items-center rounded-2xl bg-maroon-100 text-maroon-700 dark:bg-maroon-400/10 dark:text-maroon-300"><Icon name="mail" :size="20" /></div>
          <p class="mt-3 font-display text-lg font-bold">Check your email</p>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-300">We sent a sign-in link to <strong>{{ email }}</strong>. Open it in this browser to finish signing in.</p>
          <button class="mt-4 text-sm font-semibold text-maroon-700 hover:underline dark:text-maroon-300" @click="sent = false">Use a different email</button>
        </template>

        <template v-else>
          <p class="font-display text-lg font-bold">Save your progress</p>
          <p class="mt-1 text-sm text-stone-600 dark:text-stone-300">Sign in to pick up where you left off on any device. Progress from this browser comes with you.</p>
          <button class="btn-ghost mt-4 w-full !py-2.5" :disabled="busy" @click="google">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Continue with Google
          </button>
          <div class="my-4 flex items-center gap-3 text-xs font-semibold text-stone-400"><span class="h-px flex-1 bg-stone-200 dark:bg-white/10"></span>or<span class="h-px flex-1 bg-stone-200 dark:bg-white/10"></span></div>
          <form @submit.prevent="emailLink">
            <label for="signin-email" class="text-xs font-semibold text-stone-500">Email</label>
            <input
              id="signin-email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="you@example.com"
              class="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-maroon-400 focus:ring-2 focus:ring-maroon-500/20 dark:border-white/10 dark:bg-white/5"
            />
            <button type="submit" class="btn-primary mt-3 w-full !py-2.5" :disabled="busy || !email.trim()"><Icon name="mail" :size="16" /> Email me a sign-in link</button>
          </form>
          <p class="mt-3 text-xs text-stone-500">No password needed. Pulse only stores your email and study progress.</p>
        </template>

        <p v-if="error" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
      </div>
    </Transition>
  </div>
</template>
