<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Icon from './Icon.vue'
import { dark, toggleTheme } from '../lib/theme'
import { store } from '../lib/storage'
import { getExam, getCourse } from '../data'

const route = useRoute()
const exam = computed(() => getExam(route.params.examId))
const course = computed(() => getCourse(exam.value?.courseId ?? route.params.courseId))
const streak = computed(() => {
  const s = store.streak
  if (!s.last) return 0
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
  const t = new Date().toISOString().slice(0, 10)
  return s.last === t || s.last === y ? s.days : 0
})
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-stone-200/60 bg-stone-50/75 backdrop-blur-xl dark:border-white/5 dark:bg-[#0d0a0b]/75">
    <div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
      <RouterLink to="/" class="group flex items-center gap-2.5">
        <span class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-maroon-600 to-maroon-900 text-white shadow-md shadow-maroon-900/30 transition group-hover:scale-105">
          <Icon name="activity" :size="18" :stroke="2.5" />
        </span>
        <span class="leading-tight">
          <span class="block font-display text-lg font-bold tracking-tight">Pulse</span>
          <span class="block text-[10px] font-semibold tracking-[0.16em] whitespace-nowrap text-stone-500 uppercase">MSU Nursing</span>
        </span>
      </RouterLink>
      <nav v-if="course" class="hidden min-w-0 items-center gap-2 text-sm font-semibold text-stone-600 sm:flex dark:text-stone-300">
        <Icon name="chevron-right" :size="16" class="shrink-0 text-stone-400" />
        <RouterLink :to="`/${course.id}`" class="shrink-0 hover:text-maroon-700 dark:hover:text-maroon-300">{{ course.course }}</RouterLink>
        <template v-if="exam">
          <Icon name="chevron-right" :size="16" class="shrink-0 text-stone-400" />
          <RouterLink :to="`/${exam.id}`" class="truncate hover:text-maroon-700 dark:hover:text-maroon-300">Unit {{ exam.unit }} · {{ exam.title }}</RouterLink>
        </template>
      </nav>
      <div class="ml-auto flex items-center gap-2">
        <span v-if="streak > 0" class="chip whitespace-nowrap bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300" :title="`${streak}-day study streak`">
          <Icon name="flame" :size="13" /> {{ streak }} day{{ streak === 1 ? '' : 's' }}
        </span>
        <button class="grid h-10 w-10 place-items-center rounded-xl text-stone-500 transition hover:bg-stone-200/60 hover:text-stone-900 dark:hover:bg-white/10 dark:hover:text-white" :aria-label="dark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
          <Icon :name="dark ? 'sun' : 'moon'" :size="18" />
        </button>
      </div>
    </div>
  </header>
</template>
