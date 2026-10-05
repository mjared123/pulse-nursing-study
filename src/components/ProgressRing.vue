<script setup>
import { computed } from 'vue'
const props = defineProps({
  value: { type: Number, default: 0 },
  size: { type: Number, default: 56 },
  stroke: { type: Number, default: 6 },
  label: { type: Boolean, default: true },
})
const r = computed(() => (props.size - props.stroke) / 2)
const c = computed(() => 2 * Math.PI * r.value)
const color = computed(() => (props.value >= 0.9 ? '#10b981' : props.value >= 0.7 ? '#0ea5e9' : props.value > 0 ? '#c93246' : 'transparent'))
</script>

<template>
  <div class="relative inline-grid place-items-center" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" class="-rotate-90">
      <circle :cx="size / 2" :cy="size / 2" :r="r" fill="none" :stroke-width="stroke" class="stroke-stone-200 dark:stroke-white/10" />
      <circle :cx="size / 2" :cy="size / 2" :r="r" fill="none" :stroke="color" :stroke-width="stroke" stroke-linecap="round" :stroke-dasharray="c" :stroke-dashoffset="c * (1 - Math.min(1, value))" style="transition: stroke-dashoffset 1s cubic-bezier(0.2, 0.8, 0.2, 1)" />
    </svg>
    <span v-if="label" class="absolute font-mono font-bold" :style="{ fontSize: size * 0.24 + 'px' }">{{ Math.round(value * 100) }}<span class="text-[0.6em] opacity-60">%</span></span>
    <slot />
  </div>
</template>
