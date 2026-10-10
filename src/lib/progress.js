import { store, topicMastery } from './storage'
import { getExam } from '../data'

// Course-style progress, computed from the saved store. Nothing here writes, so this file
// stays the same when progress moves from localStorage to accounts.

export function quizLength(exam, topic) {
  return Math.min(exam.quizLength, topic.questions.length)
}

export function sectionNumber(exam, topic) {
  return `${exam.unit}.${exam.topics.findIndex((t) => t.slug === topic.slug) + 1}`
}

// A section is complete once a full-length quiz on it has been finished (any score).
export function topicStatus(exam, topic) {
  const rec = store.quizzes[exam.id]?.[topic.slug]
  const need = quizLength(exam, topic)
  const full = (rec?.attempts ?? []).filter((a) => a.total >= need)
  const mastery = topicMastery(exam.id, topic)
  const inProgress = rec?.inProgress?.ids?.length ? rec.inProgress : null
  const complete = full.length > 0
  return {
    complete,
    started: complete || !!inProgress || mastery.answered > 0,
    inProgress,
    best: full.length ? Math.max(...full.map((a) => a.correct / a.total)) : null,
    mastery,
  }
}

export function practiceStatus(exam, n) {
  const rec = store.exams[exam.id]?.[n]
  const attempts = rec?.attempts ?? []
  return {
    n,
    inProgress: rec?.inProgress ?? null,
    attempts: attempts.length,
    best: attempts.length ? Math.max(...attempts.map((a) => a.correct / a.total)) : null,
    last: attempts.at(-1),
  }
}

// Where "Continue" goes: the most recent unfinished quiz or practice exam in the unit,
// otherwise the first section not yet complete, otherwise the practice exams.
export function continueTarget(exam) {
  const sections = exam.topics.map((t) => ({ t, s: topicStatus(exam, t) }))
  const practice = Array.from({ length: exam.practiceExams.count }, (_, i) => practiceStatus(exam, i + 1))

  const open = [
    ...sections.filter((x) => x.s.inProgress).map((x) => ({ at: x.s.inProgress.at ?? 0, x })),
    ...practice.filter((p) => p.inProgress).map((p) => ({ at: p.inProgress.startedAt ?? 0, p })),
  ].sort((a, b) => b.at - a.at)[0]

  if (open?.x) {
    const { t, s } = open.x
    return {
      kind: 'quiz',
      topic: t,
      to: `/${exam.id}/topic/${t.slug}/quiz?resume=1`,
      title: `${sectionNumber(exam, t)} ${t.short}`,
      detail: `Question ${s.inProgress.idx + 1} of ${s.inProgress.ids.length}`,
    }
  }
  if (open?.p) {
    return { kind: 'practice', to: `/${exam.id}/practice/${open.p.n}`, title: `Practice Exam ${open.p.n}`, detail: 'Exam in progress' }
  }
  const next = sections.find((x) => !x.s.complete)
  if (next) {
    const fresh = !sections.some((x) => x.s.started)
    return {
      kind: 'topic',
      fresh,
      topic: next.t,
      to: `/${exam.id}/topic/${next.t.slug}`,
      title: `${sectionNumber(exam, next.t)} ${next.t.short}`,
      detail: fresh ? 'Start with the first section' : 'Next section',
    }
  }
  const p = practice.find((p) => !p.attempts) ?? practice[0]
  return { kind: 'practice', to: `/${exam.id}/practice/${p.n}`, title: `Practice Exam ${p.n}`, detail: p.attempts ? 'All sections done. Retake an exam' : 'All sections done' }
}

export function unitProgress(exam) {
  const sections = exam.topics.map((t) => topicStatus(exam, t))
  const done = sections.filter((s) => s.complete).length
  const practice = Array.from({ length: exam.practiceExams.count }, (_, i) => practiceStatus(exam, i + 1))
  return {
    done,
    total: sections.length,
    pct: sections.length ? done / sections.length : 0,
    started: sections.some((s) => s.started) || practice.some((p) => p.attempts || p.inProgress),
    unlocked: done === sections.length,
    practiceTaken: practice.filter((p) => p.attempts).length,
    practiceCount: practice.length,
  }
}

export function courseProgress(course) {
  const units = course.units.map(unitProgress)
  const done = units.reduce((s, u) => s + u.done, 0)
  const total = units.reduce((s, u) => s + u.total, 0)
  return { done, total, pct: total ? done / total : 0, started: units.some((u) => u.started) }
}

// The unit studied most recently, with its continue target, for the home page.
export function lastStudied() {
  let last = store.last
  if (!last) {
    // Progress saved before this was tracked: fall back to the newest finished quiz or exam.
    const recent = (byExam) =>
      Object.entries(byExam ?? {}).flatMap(([examId, recs]) => Object.values(recs).flatMap((r) => (r.attempts ?? []).map((a) => ({ examId, at: a.at }))))
    last = [...recent(store.quizzes), ...recent(store.exams)].sort((a, b) => b.at - a.at)[0]
  }
  const exam = last && getExam(last.examId)
  return exam ? { exam, target: continueTarget(exam), at: last.at } : null
}
