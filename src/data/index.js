// Every exam lives in ./exams/<exam-id>/ with an exam.json and a topics/ folder.
// Adding a new exam = adding a new folder; nothing else needs to change.
const metas = import.meta.glob('./exams/*/exam.json', { eager: true, import: 'default' })
const topicFiles = import.meta.glob('./exams/*/topics/*.json', { eager: true, import: 'default' })

function folderOf(path) {
  return path.split('/')[2]
}

export const exams = Object.entries(metas)
  .map(([path, meta]) => {
    const folder = folderOf(path)
    const bySlug = {}
    for (const [tPath, t] of Object.entries(topicFiles)) {
      if (folderOf(tPath) === folder) bySlug[t.slug] = t
    }
    const topics = meta.topics
      .filter((t) => bySlug[t.slug])
      .map((t) => ({ ...bySlug[t.slug], ...t, questions: bySlug[t.slug].questions.map((q) => ({ ...q, topic: t.slug })) }))
    const questionIndex = {}
    for (const t of topics) for (const q of t.questions) questionIndex[q.id] = q
    return { ...meta, topics, questionIndex, questionCount: Object.keys(questionIndex).length }
  })
  .sort((a, b) => a.course.localeCompare(b.course) || (a.order ?? 0) - (b.order ?? 0))

export function getExam(id) {
  return exams.find((e) => e.id === id)
}

export function getTopic(exam, slug) {
  return exam?.topics.find((t) => t.slug === slug)
}
