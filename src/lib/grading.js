export const ALT_TYPES = ['sata', 'order']

export function isAnswered(q, r) {
  if (r == null) return false
  if (q.type === 'single') return typeof r === 'string'
  if (q.type === 'sata') return Array.isArray(r) && r.length > 0
  if (q.type === 'order') return Array.isArray(r) && r.length === q.items.length
  if (q.type === 'numeric') return r !== '' && !Number.isNaN(Number(r))
  return false
}

// SATA and ordering are scored all-or-nothing, like the NCLEX-style exams in the program.
export function isCorrect(q, r) {
  if (!isAnswered(q, r)) return false
  if (q.type === 'single') return q.options.find((o) => o.id === r)?.correct === true
  if (q.type === 'sata') {
    const right = q.options.filter((o) => o.correct).map((o) => o.id).sort()
    const picked = [...r].sort()
    return right.length === picked.length && right.every((id, i) => id === picked[i])
  }
  if (q.type === 'order') return q.items.every((it, i) => it.id === r[i])
  if (q.type === 'numeric') return Math.abs(Number(r) - q.answer) <= (q.tolerance ?? 0.001) + 1e-9
  return false
}

export function sataBreakdown(q, r = []) {
  const right = q.options.filter((o) => o.correct)
  const hits = right.filter((o) => r.includes(o.id)).length
  const wrongPicks = r.filter((id) => !q.options.find((o) => o.id === id)?.correct).length
  return { total: right.length, hits, wrongPicks }
}

export function typeLabel(type) {
  return { single: 'Multiple choice', sata: 'Select all that apply', order: 'Ordered response', numeric: 'Fill in the blank' }[type]
}
