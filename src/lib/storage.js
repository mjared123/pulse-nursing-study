import { reactive, watch } from 'vue'

// Progress is kept in this browser only (localStorage). Accounts can replace this later.
const KEY = 'pulse-progress-v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return {}
}

export const store = reactive({ quizzes: {}, exams: {}, streak: { last: null, days: 0 }, last: null, ...load() })

watch(
  store,
  (s) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s))
    } catch (e) {}
  },
  { deep: true }
)

function today() {
  return new Date().toISOString().slice(0, 10)
}

function bumpStreak() {
  const t = today()
  if (store.streak.last === t) return
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
  store.streak.days = store.streak.last === y ? store.streak.days + 1 : 1
  store.streak.last = t
}

export function topicRecord(examId, slug) {
  store.quizzes[examId] ??= {}
  store.quizzes[examId][slug] ??= { attempts: [], seen: {} }
  return store.quizzes[examId][slug]
}

export function recordAnswer(examId, slug, qid, correct) {
  const rec = topicRecord(examId, slug)
  const prev = rec.seen[qid] ?? { n: 0, c: 0 }
  rec.seen[qid] = { n: prev.n + 1, c: prev.c + (correct ? 1 : 0), last: correct }
  touch(examId)
  bumpStreak()
}

// Remembers the unit studied most recently, for "pick up where you left off".
export function touch(examId) {
  store.last = { examId, at: Date.now() }
}

// An unfinished section quiz: which questions, how far in, and what was answered.
export function saveQuizProgress(examId, slug, state) {
  topicRecord(examId, slug).inProgress = { ...state, at: Date.now() }
  touch(examId)
}

export function clearQuizProgress(examId, slug) {
  const rec = store.quizzes[examId]?.[slug]
  if (rec) rec.inProgress = null
}

export function recordQuiz(examId, slug, correct, total) {
  const rec = topicRecord(examId, slug)
  rec.attempts.push({ at: Date.now(), correct, total })
  if (rec.attempts.length > 30) rec.attempts.splice(0, rec.attempts.length - 30)
}

// Mastery = share of the topic's question bank whose most recent answer was correct.
export function topicMastery(examId, topic) {
  const seen = store.quizzes[examId]?.[topic.slug]?.seen ?? {}
  const ids = topic.questions.map((q) => q.id)
  const answered = ids.filter((id) => seen[id]).length
  const right = ids.filter((id) => seen[id]?.last).length
  return { answered, right, total: ids.length, pct: ids.length ? right / ids.length : 0 }
}

export function missedIds(examId, topic) {
  const seen = store.quizzes[examId]?.[topic.slug]?.seen ?? {}
  return topic.questions.filter((q) => seen[q.id] && !seen[q.id].last).map((q) => q.id)
}

export function examRecord(examId, n) {
  store.exams[examId] ??= {}
  store.exams[examId][n] ??= { inProgress: null, attempts: [] }
  return store.exams[examId][n]
}

export function resetAll() {
  store.quizzes = {}
  store.exams = {}
  store.streak = { last: null, days: 0 }
  store.last = null
}

export { bumpStreak }
