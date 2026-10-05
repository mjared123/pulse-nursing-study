<script setup>
import { computed } from 'vue'
import Icon from '../components/Icon.vue'
import ProgressRing from '../components/ProgressRing.vue'
import { exams } from '../data'
import { topicMastery } from '../lib/storage'

const totalQuestions = computed(() => exams.reduce((s, e) => s + e.questionCount, 0))
function examMastery(e) {
  const m = e.topics.map((t) => topicMastery(e.id, t))
  const total = m.reduce((s, x) => s + x.total, 0)
  return total ? m.reduce((s, x) => s + x.right, 0) / total : 0
}

const steps = [
  { icon: 'target', title: 'Drill each topic', body: 'Short section quizzes with an instant breakdown of why every answer choice is right or wrong.' },
  { icon: 'clock', title: 'Sit a real-format exam', body: 'Timed, full-length practice exams that match the blueprint: same length, time limit, and question mix.' },
  { icon: 'trophy', title: 'Review and close gaps', body: 'See your score by topic and thinking level, then re-drill only the questions you missed.' },
]
</script>

<template>
  <div>
    <!-- hero -->
    <section class="relative pt-10 pb-16 text-center sm:pt-16">
      <div class="animate-rise">
        <span class="chip mx-auto bg-white/80 text-maroon-800 shadow-sm ring-1 ring-maroon-200 dark:bg-white/5 dark:text-maroon-200 dark:ring-maroon-400/20">
          <span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span></span>
          Missouri State School of Nursing
        </span>
        <h1 class="mx-auto mt-6 max-w-3xl font-display text-5xl leading-[1.05] font-bold tracking-tight text-balance sm:text-7xl">
          Walk into every exam
          <span class="bg-gradient-to-r from-maroon-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">already ready.</span>
        </h1>
        <p class="mx-auto mt-6 max-w-xl text-lg text-pretty text-stone-600 dark:text-stone-400">
          Practice questions built straight from your course blueprint, with a rationale for every answer choice and full-length exams that feel like the real thing.
        </p>
      </div>

      <svg viewBox="0 0 1000 120" class="mx-auto mt-10 w-full max-w-4xl" aria-hidden="true">
        <path d="M0 70 H260 l14 -6 l14 6 h20 l8 10 l14 -70 l14 84 l10 -24 h30 q20 -22 40 0 H560 l14 -6 l14 6 h20 l8 10 l14 -70 l14 84 l10 -24 h30 q20 -22 40 0 H1000" fill="none" class="stroke-stone-200 dark:stroke-white/5" stroke-width="3" />
        <path d="M0 70 H260 l14 -6 l14 6 h20 l8 10 l14 -70 l14 84 l10 -24 h30 q20 -22 40 0 H560 l14 -6 l14 6 h20 l8 10 l14 -70 l14 84 l10 -24 h30 q20 -22 40 0 H1000" fill="none" stroke="url(#heroGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="hero-trace" />
        <defs>
          <linearGradient id="heroGrad" x1="0" x2="1">
            <stop offset="0" stop-color="#a61c31" stop-opacity="0" />
            <stop offset="0.3" stop-color="#c93246" />
            <stop offset="1" stop-color="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>

      <div class="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3">
        <div v-for="s in [
          { n: totalQuestions, l: 'practice questions' },
          { n: exams.reduce((a, e) => a + e.topics.length, 0), l: 'topic sections' },
          { n: exams.reduce((a, e) => a + e.practiceExams.count, 0), l: 'full practice exams' },
        ]" :key="s.l" class="card px-3 py-4">
          <p class="font-mono text-3xl font-bold text-maroon-700 dark:text-maroon-300">{{ s.n }}</p>
          <p class="mt-1 text-xs font-medium text-stone-500">{{ s.l }}</p>
        </div>
      </div>
    </section>

    <!-- exams -->
    <section>
      <div class="mb-5 flex items-end justify-between">
        <div>
          <p class="eyebrow">Choose your exam</p>
          <h2 class="mt-1 font-display text-3xl font-bold">Available now</h2>
        </div>
      </div>
      <div class="grid gap-5 md:grid-cols-2">
        <RouterLink v-for="(e, i) in exams" :key="e.id" :to="`/${e.id}`" class="card card-hover group relative overflow-hidden p-7 animate-rise" :style="{ animationDelay: i * 80 + 'ms' }">
          <div class="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-maroon-500/20 to-amber-400/10 blur-2xl transition group-hover:scale-125"></div>
          <div class="relative flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow">{{ e.course }} · {{ e.term }}</p>
              <h3 class="mt-2 font-display text-3xl font-bold">{{ e.title }}</h3>
              <p class="mt-1 text-stone-600 dark:text-stone-400">{{ e.subtitle }}</p>
            </div>
            <ProgressRing :value="examMastery(e)" :size="64" />
          </div>
          <div class="relative mt-6 flex flex-wrap gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
            <span class="chip bg-stone-100 dark:bg-white/5"><Icon name="layers" :size="13" />{{ e.topics.length }} sections</span>
            <span class="chip bg-stone-100 dark:bg-white/5"><Icon name="list" :size="13" />{{ e.format.totalQuestions }}-question exam</span>
            <span class="chip bg-stone-100 dark:bg-white/5"><Icon name="clock" :size="13" />{{ e.format.minutes }} min</span>
          </div>
          <div class="relative mt-6 flex items-center gap-2 font-semibold text-maroon-700 dark:text-maroon-300">
            Start studying <Icon name="arrow-right" :size="18" class="transition group-hover:translate-x-1" />
          </div>
        </RouterLink>
        <div class="card flex flex-col items-center justify-center border-dashed p-7 text-center text-stone-500 dark:text-stone-500">
          <Icon name="sparkles" :size="28" class="text-amber-500" />
          <p class="mt-3 font-semibold text-stone-700 dark:text-stone-300">More exams on the way</p>
          <p class="mt-1 text-sm">New courses and exams get added as study guides come out.</p>
        </div>
      </div>
    </section>

    <!-- how it works -->
    <section class="mt-20">
      <p class="eyebrow text-center">How it works</p>
      <h2 class="mt-1 text-center font-display text-3xl font-bold">Three steps to exam day</h2>
      <div class="mt-8 grid gap-5 md:grid-cols-3">
        <div v-for="(s, i) in steps" :key="s.title" class="card p-6">
          <div class="flex items-center gap-3">
            <span class="grid h-11 w-11 place-items-center rounded-2xl bg-maroon-100 text-maroon-700 dark:bg-maroon-500/15 dark:text-maroon-300"><Icon :name="s.icon" :size="22" /></span>
            <span class="font-mono text-sm font-bold text-stone-400">0{{ i + 1 }}</span>
          </div>
          <h3 class="mt-4 text-lg font-bold">{{ s.title }}</h3>
          <p class="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{{ s.body }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
