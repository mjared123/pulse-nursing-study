<script setup>
import { computed, onMounted, ref } from 'vue'
import { mulberry32 } from '../lib/rng'

// Draws a synthetic 6-second rhythm strip on standard ECG paper.
// 1 small box = 0.04 s = 5 units, so 1 s = 125 units and 6 s = 750 units.
const props = defineProps({ rhythm: { type: String, required: true }, seed: { type: String, default: 'ecg' } })

const W = 750
const H = 150
const SEC = 125
const BASE = 92
const AMP = 58

const g = (t, mu, s, a) => a * Math.exp(-((t - mu) ** 2) / (2 * s * s))

function beat(t, b, o = {}) {
  const { p = true, wide = false, tGap = 0.28, pr = 0.16 } = o
  let y = 0
  if (p) y += g(t, b - pr, 0.025, 0.13)
  if (wide) {
    y += g(t, b, 0.045, 1.0) + g(t, b + 0.1, 0.05, -0.55)
  } else {
    y += g(t, b - 0.022, 0.008, -0.1) + g(t, b, 0.011, 1.0) + g(t, b + 0.024, 0.01, -0.24)
  }
  y += g(t, b + tGap, wide ? 0.07 : 0.05, wide ? -0.3 : 0.26)
  return y
}

function build(rhythm, rand) {
  const beats = []
  let opts = {}
  let extra = () => 0
  const regular = (bpm, jitter = 0.01) => {
    const rr = 60 / bpm
    for (let t = 0.25 + rand() * 0.2; t < 6.2; t += rr * (1 + (rand() - 0.5) * jitter)) beats.push(t)
  }
  switch (rhythm) {
    case 'sinus_tach':
      regular(128)
      opts = { tGap: 0.22, pr: 0.13 }
      break
    case 'sinus_brady':
      regular(44)
      opts = { tGap: 0.32 }
      break
    case 'svt':
      regular(188, 0)
      opts = { p: false, tGap: 0.17 }
      break
    case 'afib': {
      for (let t = 0.2; t < 6.2; t += 0.38 + rand() * 0.55) beats.push(t)
      opts = { p: false }
      const f = [5.1 + rand(), 7.3 + rand(), 9.7 + rand()]
      const ph = [rand() * 6, rand() * 6, rand() * 6]
      extra = (t) => 0.035 * Math.sin(2 * Math.PI * f[0] * t + ph[0]) + 0.025 * Math.sin(2 * Math.PI * f[1] * t + ph[1]) + 0.02 * Math.sin(2 * Math.PI * f[2] * t + ph[2])
      break
    }
    case 'aflutter': {
      const fw = 0.2 // 300/min flutter waves
      const off = rand() * fw
      for (let t = off + fw * 3; t < 6.2; t += fw * 4) beats.push(t + 0.05)
      opts = { p: false, tGap: 0.3 }
      extra = (t) => {
        const x = ((t - off) / fw) % 1
        return x < 0.75 ? 0.14 - (x / 0.75) * 0.3 : -0.16 + ((x - 0.75) / 0.25) * 0.3
      }
      break
    }
    case 'vtach':
      regular(175, 0.02)
      opts = { p: false, wide: true, tGap: 0.2 }
      break
    case 'vfib': {
      const f = Array.from({ length: 5 }, () => 3 + rand() * 5)
      const ph = f.map(() => rand() * 6)
      return (t) => 0.38 * (0.6 + 0.4 * Math.sin(t * 1.3)) * f.reduce((s, fi, i) => s + Math.sin(2 * Math.PI * fi * t + ph[i]) / f.length, 0) * 2.2
    }
    case 'asystole':
      return (t) => 0.02 * Math.sin(t * 1.7) + 0.01 * Math.sin(t * 7.3)
    default:
      regular(76)
  }
  return (t) => {
    let y = extra(t)
    for (const b of beats) if (Math.abs(t - b) < 0.6) y += beat(t, b, opts)
    return y
  }
}

const path = computed(() => {
  const rand = mulberry32(props.seed + props.rhythm)
  const fn = build(props.rhythm, rand)
  let d = ''
  for (let x = 0; x <= W; x += 1) {
    const y = BASE - fn(x / SEC) * AMP
    d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1)
  }
  return d
})

const el = ref(null)
const len = ref(3000)
onMounted(() => {
  if (el.value?.getTotalLength) len.value = Math.ceil(el.value.getTotalLength())
})
</script>

<template>
  <figure class="overflow-hidden rounded-2xl border border-rose-200/70 bg-[#fff7f7] dark:border-rose-400/15 dark:bg-[#1a0f11]">
    <svg :viewBox="`0 0 ${W} ${H}`" class="block h-auto w-full" role="img" aria-label="ECG rhythm strip, 6 seconds">
      <defs>
        <pattern id="ecg-small" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M5 0H0V5" fill="none" class="stroke-rose-200 dark:stroke-rose-400/10" stroke-width="0.5" />
        </pattern>
        <pattern id="ecg-big" width="25" height="25" patternUnits="userSpaceOnUse">
          <rect width="25" height="25" fill="url(#ecg-small)" />
          <path d="M25 0H0V25" fill="none" class="stroke-rose-300 dark:stroke-rose-400/25" stroke-width="1" />
        </pattern>
      </defs>
      <rect :width="W" :height="H" fill="url(#ecg-big)" />
      <g class="fill-rose-400/80 dark:fill-rose-300/50" font-size="9" font-family="JetBrains Mono, monospace">
        <text v-for="s in 5" :key="s" :x="s * SEC + 3" y="11">{{ s }}s</text>
      </g>
      <path ref="el" :d="path" fill="none" class="ecg-draw stroke-stone-900 dark:stroke-emerald-300" stroke-width="1.6" stroke-linejoin="round" :style="{ '--len': len }" />
    </svg>
    <figcaption class="flex items-center justify-between px-3 py-1.5 font-mono text-[10px] tracking-wider text-rose-500/80 uppercase dark:text-rose-300/50">
      <span>Lead II · 25 mm/s</span><span>6-second strip</span>
    </figcaption>
  </figure>
</template>
