import { mulberry32, shuffle } from './rng.js'
import { ALT_TYPES } from './grading.js'

const cache = new Map()

// Builds all practice exams for an exam at once so they never share a question.
// Deterministic: Practice Exam 2 is always the same 75 questions, in the same order.
export function buildPracticeExams(exam) {
  if (cache.has(exam.id)) return cache.get(exam.id)
  const { count, distribution } = exam.practiceExams
  const altTarget = exam.format.alternateFormat
  const pools = {}
  for (const t of exam.topics) {
    const rand = mulberry32(`${exam.id}:${t.slug}`)
    const qs = shuffle(t.questions, rand)
    pools[t.slug] = {
      alt: qs.filter((q) => ALT_TYPES.includes(q.type)),
      std: qs.filter((q) => !ALT_TYPES.includes(q.type)),
    }
  }

  // Plan how many alternate-format items each exam takes from each topic.
  // Topics short on standard items must spend alternates; spread those evenly,
  // then top every exam up to the blueprint's alternate-format count.
  const slugs = Object.keys(distribution).filter((s) => pools[s])
  const plan = Array.from({ length: count }, () => ({}))
  const spare = {}
  slugs.forEach((slug, ti) => {
    const per = distribution[slug]
    const forced = Math.max(0, per * count - pools[slug].std.length)
    for (let n = 0; n < count; n++) plan[n][slug] = Math.floor(forced / count) + ((n + ti) % count < forced % count ? 1 : 0)
    spare[slug] = pools[slug].alt.length - forced
  })
  for (let n = 0; n < count; n++) {
    const rand = mulberry32(`${exam.id}:alt:${n}`)
    const order = shuffle(slugs, rand)
    let alt = slugs.reduce((s, slug) => s + plan[n][slug], 0)
    let progress = true
    while (alt < altTarget && progress) {
      progress = false
      for (const slug of order) {
        if (alt >= altTarget) break
        if (spare[slug] > 0 && plan[n][slug] < distribution[slug]) {
          plan[n][slug]++
          spare[slug]--
          alt++
          progress = true
        }
      }
    }
  }

  const result = []
  for (let n = 0; n < count; n++) {
    const picked = []
    for (const slug of slugs) {
      const pool = pools[slug]
      for (let i = 0; i < plan[n][slug]; i++) picked.push(pool.alt.shift())
      for (let i = plan[n][slug]; i < distribution[slug]; i++) picked.push(pool.std.length ? pool.std.shift() : pool.alt.shift())
    }
    result.push(shuffle(picked.filter(Boolean), mulberry32(`${exam.id}:practice:${n}`)).map((q) => q.id))
  }
  cache.set(exam.id, result)
  return result
}

export function quizQuestions(topic, { length, mode = 'random', missedIds = [] } = {}) {
  let pool = topic.questions
  if (mode === 'missed') pool = pool.filter((q) => missedIds.includes(q.id))
  const qs = shuffle(pool)
  return mode === 'all' || mode === 'missed' ? qs : qs.slice(0, length)
}
