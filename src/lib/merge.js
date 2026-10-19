// Combines two saved progress objects (this browser's and the account's) so nothing is lost
// when a student signs in on a device that already has progress. Pure: neither input is changed.

const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)))

// Union of two attempt lists, matched by finish time, oldest first.
function mergeAttempts(a = [], b = [], cap = Infinity) {
  const byAt = new Map()
  for (const x of [...a, ...b]) {
    const prev = byAt.get(x.at)
    // The same attempt may exist on both sides; keep the copy that still has its answer sheet.
    if (!prev || (!prev.answers && x.answers)) byAt.set(x.at, x)
  }
  const out = [...byAt.values()].sort((x, y) => x.at - y.at)
  return out.slice(Math.max(0, out.length - cap))
}

// The unfinished quiz or exam touched most recently wins.
function newer(a, b, key) {
  if (!a) return b ?? null
  if (!b) return a
  return (b[key] ?? 0) > (a[key] ?? 0) ? b : a
}

function mergeQuiz(a = {}, b = {}) {
  const seen = { ...a.seen }
  for (const [id, s] of Object.entries(b.seen ?? {})) {
    // The side that has answered the question more times has the more recent answer.
    if (!seen[id] || s.n > seen[id].n) seen[id] = s
  }
  return {
    ...a,
    ...b,
    seen,
    attempts: mergeAttempts(a.attempts, b.attempts, 30),
    inProgress: newer(a.inProgress, b.inProgress, 'at'),
  }
}

function mergeExam(a = {}, b = {}) {
  const attempts = mergeAttempts(a.attempts, b.attempts)
  // Same rule as finishing an exam: only the 5 most recent attempts keep full answer sheets.
  attempts.forEach((x, i) => {
    if (i < attempts.length - 5 && x.answers) {
      x = attempts[i] = { ...x }
      delete x.answers
    }
  })
  return { ...a, ...b, attempts, inProgress: newer(a.inProgress, b.inProgress, 'startedAt') }
}

// Merges { examId: { key: record } } maps record by record.
function mergeNested(a = {}, b = {}, fn) {
  const out = {}
  for (const examId of new Set([...Object.keys(a), ...Object.keys(b)])) {
    out[examId] = {}
    const x = a[examId] ?? {}
    const y = b[examId] ?? {}
    for (const key of new Set([...Object.keys(x), ...Object.keys(y)])) out[examId][key] = fn(x[key], y[key])
  }
  return out
}

function mergeStreak(a, b) {
  if (!a?.last) return b ?? { last: null, days: 0 }
  if (!b?.last) return a
  if (a.last !== b.last) return a.last > b.last ? a : b
  return a.days >= b.days ? a : b
}

export function mergeProgress(local = {}, remote = {}) {
  local = clone(local) ?? {}
  remote = clone(remote) ?? {}
  return {
    ...local,
    ...remote,
    quizzes: mergeNested(local.quizzes, remote.quizzes, mergeQuiz),
    exams: mergeNested(local.exams, remote.exams, mergeExam),
    reviews: mergeNested(local.reviews, remote.reviews, (x, y) => (x && y ? (x.at <= y.at ? x : y) : x ?? y)),
    streak: mergeStreak(local.streak, remote.streak),
    last: newer(local.last, remote.last, 'at'),
  }
}
