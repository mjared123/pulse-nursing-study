<script setup>
import { computed } from 'vue'
import Icon from '../components/Icon.vue'
import ProgressRing from '../components/ProgressRing.vue'
import { exams, courses } from '../data'
import { courseProgress, unitProgress, lastStudied } from '../lib/progress'
import { ago } from '../lib/format'

const totalQuestions = computed(() => exams.reduce((s, e) => s + e.questionCount, 0))
const resume = computed(() => lastStudied())
const COURSE_TONE = ['from-maroon-600 to-rose-500', 'from-amber-500 to-orange-600', 'from-sky-500 to-indigo-600']
</script>

<template>
  <div>
    <!-- hero -->
    <section class="relative pt-6 pb-12 text-center sm:pt-10">
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

    <!-- pick up where you left off -->
    <RouterLink v-if="resume" :to="resume.target.to" class="card card-hover group mb-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6 animate-rise">
      <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-maroon-600 to-maroon-900 text-white shadow-md shadow-maroon-900/30">
        <Icon name="play" :size="20" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="eyebrow">Pick up where you left off · {{ ago(resume.at) }}</p>
        <p class="mt-1 truncate text-lg font-bold">{{ resume.target.title }}</p>
        <p class="text-sm text-stone-500">{{ resume.exam.course }} · Unit {{ resume.exam.unit }} · {{ resume.target.detail }}</p>
      </div>
      <span class="btn-primary shrink-0">Continue <Icon name="arrow-right" :size="16" class="transition group-hover:translate-x-1" /></span>
    </RouterLink>

    <!-- classes -->
    <section>
      <div class="mb-5">
        <p class="eyebrow">Choose your class</p>
        <h2 class="mt-1 font-display text-3xl font-bold">Your classes</h2>
      </div>
      <div class="grid gap-5 md:grid-cols-2">
        <RouterLink v-for="(c, i) in courses" :key="c.id" :to="`/${c.id}`" class="card card-hover group relative flex flex-col overflow-hidden p-7 animate-rise" :style="{ animationDelay: i * 80 + 'ms' }">
          <div class="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-maroon-500/20 to-amber-400/10 blur-2xl transition group-hover:scale-125"></div>
          <div class="relative flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <span class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg" :class="COURSE_TONE[i % COURSE_TONE.length]">
                <Icon name="book" :size="26" />
              </span>
              <div>
                <p class="eyebrow">{{ c.units[0].term }}</p>
                <h3 class="font-display text-4xl font-bold tracking-tight">{{ c.course }}</h3>
              </div>
            </div>
            <ProgressRing :value="courseProgress(c).pct" :size="64" />
          </div>
          <ol class="relative mt-6 flex-1 space-y-2.5">
            <li v-for="u in c.units" :key="u.id" class="flex items-start gap-3 text-sm">
              <span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold" :class="unitProgress(u).unlocked ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-600 dark:bg-white/5 dark:text-stone-300'">
                <Icon v-if="unitProgress(u).unlocked" name="check" :size="12" :stroke="3" /><template v-else>{{ u.unit }}</template>
              </span>
              <span class="min-w-0">
                <span class="font-semibold">Unit {{ u.unit }}</span>
                <span class="text-stone-500"> · {{ u.subtitle }}</span>
              </span>
            </li>
          </ol>
          <div class="relative mt-6 flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
              <span class="chip bg-stone-100 dark:bg-white/5"><Icon name="layers" :size="13" />{{ c.units.length }} units</span>
              <span class="chip bg-stone-100 dark:bg-white/5"><Icon name="check" :size="13" />{{ courseProgress(c).done }}/{{ courseProgress(c).total }} sections</span>
            </div>
            <span class="flex items-center gap-2 font-semibold text-maroon-700 dark:text-maroon-300">
              {{ courseProgress(c).started ? 'Open class' : 'Start class' }} <Icon name="arrow-right" :size="18" class="transition group-hover:translate-x-1" />
            </span>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
