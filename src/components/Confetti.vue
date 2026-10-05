<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'

const canvas = ref(null)
let raf
onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const cv = canvas.value
  const ctx = cv.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  cv.width = innerWidth * dpr
  cv.height = innerHeight * dpr
  ctx.scale(dpr, dpr)
  const colors = ['#a61c31', '#f59e0b', '#10b981', '#0ea5e9', '#f5c6cb', '#ffffff']
  const parts = Array.from({ length: 160 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 200,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 16 - 4,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    w: 6 + Math.random() * 6,
    h: 3 + Math.random() * 4,
    c: colors[Math.floor(Math.random() * colors.length)],
  }))
  const start = performance.now()
  const tick = (t) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    const life = (t - start) / 1000
    for (const p of parts) {
      p.vy += 0.35
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.r += p.vr
      ctx.save()
      ctx.globalAlpha = Math.max(0, 1 - life / 3.5)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.r)
      ctx.fillStyle = p.c
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }
    if (life < 3.5) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <canvas ref="canvas" class="pointer-events-none fixed inset-0 z-50 h-full w-full"></canvas>
</template>
