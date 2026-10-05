export function pct(x) {
  return Math.round(x * 100)
}

export function clock(sec) {
  sec = Math.max(0, Math.round(sec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  return (h ? h + ':' : '') + mm + ':' + String(s).padStart(2, '0')
}

export function ago(ts) {
  const d = (Date.now() - ts) / 1000
  if (d < 60) return 'just now'
  if (d < 3600) return Math.floor(d / 60) + 'm ago'
  if (d < 86400) return Math.floor(d / 3600) + 'h ago'
  return Math.floor(d / 86400) + 'd ago'
}

export function grade(p) {
  if (p >= 0.9) return { label: 'Excellent', tone: 'emerald' }
  if (p >= 0.8) return { label: 'Strong', tone: 'sky' }
  if (p >= 0.7) return { label: 'Getting there', tone: 'amber' }
  return { label: 'Keep practicing', tone: 'rose' }
}
