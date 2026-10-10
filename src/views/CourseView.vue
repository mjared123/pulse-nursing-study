<script setup>
import { computed } from 'vue'
import Icon from '../components/Icon.vue'
import ProgressRing from '../components/ProgressRing.vue'
import NotFound from './NotFound.vue'
import { getCourse } from '../data'
import { courseProgress, unitProgress, continueTarget } from '../lib/progress'

const props = defineProps({ courseId: String })
const course = computed(() => getCourse(props.courseId))
const progress = computed(() => courseProgress(course.value))
const units = computed(() => course.value.units.map((e) => ({ e, p: unitProgress(e), next: continueTarget(e) })))
</script>

<template>
  <NotFound v-if="!course" />
  <div v-else class="space-y-10">
    <RouterLink to="/" class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-maroon-700 dark:hover:text-maroon-300">
      <Icon name="arrow-left" :size="16" /> All classes
    </RouterLink>

    <section class="card relative overflow-hidden p-7 sm:p-10 animate-rise">
      <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-maroon-500/10 to-transparent md:block"></div>
      <div class="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div class="max-w-xl">
          <p class="eyebrow">{{ course.units[0].term }} · Missouri State</p>
          <h1 class="mt-2 font-display text-5xl font-bold tracking-tight sm:text-6xl">{{ course.course }}</h1>
          <p class="mt-3 text-lg text-stone-600 dark:text-stone-400">
            {{ course.units.length }} units · {{ progress.total }} sections · {{ course.questionCount.toLocaleString() }} practice questions
          </p>
        </div>
        <div class="flex items-center gap-6">
          <ProgressRing :value="progress.pct" :size="120" :stroke="10" />
          <div class="text-sm">
            <p class="font-semibold">Class progress</p>
            <p class="mt-1 text-stone-500">{{ progress.done }} of {{ progress.total }} sections complete</p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <p class="eyebrow">Course outline</p>
      <h2 class="mt-1 font-display text-3xl font-bold">Units</h2>
      <ol class="mt-6 space-y-5">
        <li v-for="({ e, p, next }, i) in units" :key="e.id" class="animate-rise" :style="{ animationDelay: i * 80 + 'ms' }">
          <div class="card card-hover group relative overflow-hidden">
            <RouterLink :to="`/${e.id}`" class="absolute inset-0 z-0" :aria-label="`Open Unit ${e.unit}`"></RouterLink>
            <div class="pointer-events-none relative z-10 flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-7">
              <div class="flex shrink-0 items-center gap-4 sm:w-28 sm:flex-col sm:items-start sm:gap-1">
                <p class="text-xs font-bold tracking-[0.16em] text-stone-500 uppercase">Unit</p>
                <p class="font-display text-5xl leading-none font-bold text-maroon-700 dark:text-maroon-300">{{ e.unit }}</p>
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="font-display text-2xl font-bold group-hover:text-maroon-700 dark:group-hover:text-maroon-300">{{ e.subtitle }}</h3>
                <p class="mt-1 text-sm text-stone-500">Prepares you for {{ e.course }} {{ e.title }} · {{ e.topics.length }} sections · {{ e.practiceExams.count }} practice exams</p>
                <div class="mt-4 flex items-center gap-3">
                  <div class="h-2 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-white/5">
                    <div class="h-full rounded-full bg-gradient-to-r from-maroon-600 to-amber-500 transition-all duration-700" :style="{ width: p.pct * 100 + '%' }"></div>
                  </div>
                  <span class="font-mono text-xs font-bold text-stone-500">{{ p.done }}/{{ p.total }}</span>
                </div>
                <p class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold">
                  <span v-if="p.unlocked" class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><Icon name="unlock" :size="13" /> Practice exams unlocked · {{ p.practiceTaken }}/{{ p.practiceCount }} taken</span>
                  <span v-else class="flex items-center gap-1.5 text-stone-500"><Icon name="lock" :size="13" /> Practice exams unlock after all sections</span>
                </p>
              </div>
              <RouterLink :to="p.started ? next.to : `/${e.id}`" class="btn-primary pointer-events-auto shrink-0">
                <Icon name="play" :size="14" /> {{ p.started ? 'Continue' : 'Start unit' }}
              </RouterLink>
            </div>
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>
