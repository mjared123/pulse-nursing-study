// Checks every exam's question bank before a build. Fails loudly on schema mistakes.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildPracticeExams } from '../src/lib/examBuilder.js'
import { ALT_TYPES } from '../src/lib/grading.js'

const root = fileURLToPath(new URL('../src/data/exams/', import.meta.url))
const ECG = ['nsr', 'sinus_tach', 'sinus_brady', 'svt', 'afib', 'aflutter', 'vtach', 'vfib', 'asystole']
const BLOOM = ['remember', 'understand', 'apply', 'analyze', 'evaluate']
const errors = []
const err = (m) => errors.push(m)

for (const folder of readdirSync(root)) {
  const metaPath = join(root, folder, 'exam.json')
  if (!existsSync(metaPath)) continue
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'))
  const ids = new Set()
  const topics = []
  for (const t of meta.topics) {
    const p = join(root, folder, 'topics', t.slug + '.json')
    if (!existsSync(p)) {
      err(`${folder}: missing topic file ${t.slug}.json`)
      continue
    }
    const data = JSON.parse(readFileSync(p, 'utf8'))
    if (data.slug !== t.slug) err(`${p}: slug mismatch`)
    for (const k of ['title', 'short', 'description']) if (!data[k]) err(`${t.slug}: missing ${k}`)
    for (const q of data.questions) {
      const where = `${t.slug}/${q.id}`
      if (ids.has(q.id)) err(`${where}: duplicate id`)
      ids.add(q.id)
      if (!q.stem || !q.explanation) err(`${where}: missing stem or explanation`)
      if (q.bloom && !BLOOM.includes(q.bloom)) err(`${where}: bad bloom ${q.bloom}`)
      if (q.ecg && !ECG.includes(q.ecg)) err(`${where}: bad ecg ${q.ecg}`)
      if (q.type === 'single' || q.type === 'sata') {
        const right = q.options?.filter((o) => o.correct).length ?? 0
        if (q.type === 'single' && right !== 1) err(`${where}: single needs exactly 1 correct, has ${right}`)
        if (q.type === 'sata' && right < 2) err(`${where}: sata needs 2+ correct, has ${right}`)
        for (const o of q.options ?? []) if (!o.id || !o.text || !o.rationale) err(`${where}: option ${o.id} incomplete`)
        if (new Set(q.options.map((o) => o.id)).size !== q.options.length) err(`${where}: duplicate option ids`)
      } else if (q.type === 'order') {
        if (!(q.items?.length >= 3)) err(`${where}: order needs 3+ items`)
      } else if (q.type === 'numeric') {
        if (typeof q.answer !== 'number' || !q.unit || !q.steps?.length) err(`${where}: numeric incomplete`)
      } else err(`${where}: unknown type ${q.type}`)
    }
    topics.push({ ...data, ...t, questions: data.questions.map((q) => ({ ...q, topic: t.slug })) })
  }
  const exam = { ...meta, topics }
  const dist = meta.practiceExams.distribution
  const sum = Object.values(dist).reduce((a, b) => a + b, 0)
  if (sum !== meta.format.totalQuestions) err(`${folder}: distribution sums to ${sum}, expected ${meta.format.totalQuestions}`)
  for (const [slug, n] of Object.entries(dist)) {
    const t = topics.find((x) => x.slug === slug)
    if (t && t.questions.length < n * meta.practiceExams.count)
      err(`${folder}/${slug}: needs ${n * meta.practiceExams.count} questions for distinct practice exams, has ${t.questions.length}`)
  }
  if (!errors.length) {
    const built = buildPracticeExams(exam)
    const index = Object.fromEntries(topics.flatMap((t) => t.questions.map((q) => [q.id, q])))
    const all = built.flat()
    if (new Set(all).size !== all.length) err(`${folder}: practice exams share questions`)
    built.forEach((list, i) => {
      const alt = list.filter((id) => ALT_TYPES.includes(index[id].type)).length
      const calc = list.filter((id) => index[id].type === 'numeric').length
      console.log(`  ${folder} practice ${i + 1}: ${list.length} questions, ${alt} alternate format, ${calc} dosage calc`)
      if (list.length !== meta.format.totalQuestions) err(`${folder} practice ${i + 1}: has ${list.length} questions`)
      if (alt < meta.format.alternateFormat) err(`${folder} practice ${i + 1}: only ${alt} alternate format`)
    })
  }
  console.log(`✓ ${folder}: ${topics.length} topics, ${ids.size} questions`)
}

if (errors.length) {
  console.error(errors.map((e) => '✗ ' + e).join('\n'))
  process.exit(1)
}
