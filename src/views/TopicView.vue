<script setup>
import { computed } from 'vue'
import Icon from '../components/Icon.vue'
import ProgressRing from '../components/ProgressRing.vue'
import NotFound from './NotFound.vue'
import { getExam, getTopic } from '../data'
import { store, topicMastery, missedIds } from '../lib/storage'
import { pct, ago } from '../lib/format'
import { topicStatus, sectionNumber } from '../lib/progress'

const props = defineProps({ examId: String, slug: String })
const exam = computed(() => getExam(props.examId))
const topic = computed(() => getTopic(exam.value, props.slug))
const mastery = computed(() => topicMastery(exam.value.id, topic.value))
const missed = computed(() => missedIds(exam.value.id, topic.value))
const attempts = computed(() => store.quizzes[exam.value.id]?.[topic.value.slug]?.attempts ?? [])
const status = computed(() => topicStatus(exam.value, topic.value))
const num = computed(() => sectionNumber(exam.value, topic.value))
const quizLen = computed(() => Math.min(exam.value.quizLength, topic.value.questions.length))
const typeCounts = computed(() => {
  const c = {}
  for (const q of topic.value.questions) c[q.type] = (c[q.type] ?? 0) + 1
  return c
})
const neighbors = computed(() => {
  const i = exam.value.topics.findIndex((t) => t.slug === props.slug)
  return { prev: exam.value.topics[i - 1], next: exam.value.topics[i + 1] }
})
</script>

<template>
  <NotFound v-if="!exam || !topic" />
  <div v-else class="space-y-8">
    <RouterLink :to="`/${exam.id}`" class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-maroon-700 dark:hover:text-maroon-300">
      <Icon name="arrow-left" :size="16" /> Unit {{ exam.unit }} sections
    </RouterLink>

    <section class="card relative overflow-hidden p-7 sm:p-10 animate-rise">
      <div class="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-maroon-500/10 blur-3xl"></div>
      <div class="relative flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div class="max-w-2xl">
          <span class="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-maroon-500 to-maroon-800 text-white shadow-lg shadow-maroon-900/30">
            <Icon :name="topic.icon" :size="28" />
          </span>
          <p class="eyebrow mt-5">Section {{ num }} · {{ exam.course }} Unit {{ exam.unit }}</p>
          <h1 class="mt-1 font-display text-4xl font-bold tracking-tight">{{ topic.title }}</h1>
          <p class="mt-3 text-lg text-stone-600 dark:text-stone-400">{{ topic.description }}</p>
          <div class="mt-5 flex flex-wrap gap-2">
            <span v-if="status.complete" class="chip bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"><Icon name="check" :size="12" :stroke="3" /> Section complete · best {{ pct(status.best) }}%</span>
            <span v-else class="chip bg-stone-100 text-stone-600 dark:bg-white/5 dark:text-stone-400">Finish a {{ quizLen }}-question quiz to complete</span>
            <span class="chip bg-maroon-100 text-maroon-800 dark:bg-maroon-500/15 dark:text-maroon-200">{{ topic.blueprint }} question{{ topic.blueprint > 1 ? 's' : '' }} on the exam</span>
            <span class="chip bg-stone-100 text-stone-600 dark:bg-white/5 dark:text-stone-400">{{ topic.questions.length }} in this bank</span>
            <span v-if="typeCounts.sata" class="chip bg-stone-100 text-stone-600 dark:bg-white/5 dark:text-stone-400">{{ typeCounts.sata }} SATA</span>
            <span v-if="typeCounts.order" class="chip bg-stone-100 text-stone-600 dark:bg-white/5 dark:text-stone-400">{{ typeCounts.order }} ordering</span>
          </div>
        </div>
        <div class="flex shrink-0 flex-col items-center">
          <ProgressRing :value="mastery.pct" :size="110" :stroke="9" />
          <p class="mt-2 text-xs text-stone-500">{{ mastery.right }}/{{ mastery.total }} mastered</p>
        </div>
      </div>

      <div class="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <RouterLink v-if="status.inProgress" :to="`/${exam.id}/topic/${topic.slug}/quiz?resume=1`" class="btn-primary py-4 text-base">
          <Icon name="play" :size="16" /> Resume · question {{ status.inProgress.idx + 1 }} of {{ status.inProgress.ids.length }}
        </RouterLink>
        <RouterLink :to="`/${exam.id}/topic/${topic.slug}/quiz`" :class="status.inProgress ? 'btn-ghost' : 'btn-primary'" class="py-4 text-base">
          <Icon :name="status.inProgress ? 'rotate' : 'play'" :size="16" /> {{ status.inProgress ? 'New quiz' : `Quiz · ${quizLen} questions` }}
        </RouterLink>
        <RouterLink v-if="topic.questions.length > quizLen" :to="`/${exam.id}/topic/${topic.slug}/quiz?mode=all`" class="btn-ghost py-4 text-base">
          <Icon name="layers" :size="16" /> All {{ topic.questions.length }}
        </RouterLink>
        <RouterLink v-if="missed.length" :to="`/${exam.id}/topic/${topic.slug}/quiz?mode=missed`" class="btn-ghost py-4 text-base">
          <Icon name="rotate" :size="16" /> Retry {{ missed.length }} missed
        </RouterLink>
      </div>
    </section>

    <div class="grid gap-5 lg:grid-cols-3">
      <section class="card p-7 lg:col-span-2">
        <p class="eyebrow">High-yield</p>
        <h2 class="mt-1 font-display text-2xl font-bold">Know these cold</h2>
        <ul class="mt-5 space-y-3">
          <li v-for="(k, i) in topic.keyPoints" :key="i" class="flex gap-3">
            <span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-100 font-mono text-[11px] font-bold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">{{ i + 1 }}</span>
            <span class="leading-relaxed text-stone-700 dark:text-stone-300">{{ k }}</span>
          </li>
        </ul>
      </section>
      <section class="card p-7">
        <p class="eyebrow">Your history</p>
        <h2 class="mt-1 font-display text-2xl font-bold">Recent quizzes</h2>
        <div v-if="attempts.length" class="mt-5">
          <div class="flex h-24 items-end gap-1.5">
            <div v-for="(a, i) in attempts.slice(-12)" :key="i" class="flex-1 rounded-t-md bg-gradient-to-t from-maroon-700 to-maroon-400" :style="{ height: Math.max(6, (a.correct / a.total) * 100) + '%' }" :title="`${pct(a.correct / a.total)}%`"></div>
          </div>
          <ul class="mt-4 space-y-2 text-sm">
            <li v-for="(a, i) in attempts.slice(-4).reverse()" :key="i" class="flex justify-between">
              <span class="text-stone-500">{{ ago(a.at) }}</span>
              <span class="font-mono font-bold">{{ a.correct }}/{{ a.total }} · {{ pct(a.correct / a.total) }}%</span>
            </li>
          </ul>
        </div>
        <p v-else class="mt-5 text-sm text-stone-500">No quizzes yet. Your scores will chart here.</p>
      </section>
    </div>

    <nav class="flex justify-between gap-4 text-sm font-semibold">
      <RouterLink v-if="neighbors.prev" :to="`/${exam.id}/topic/${neighbors.prev.slug}`" class="btn-ghost"><Icon name="arrow-left" :size="16" />{{ sectionNumber(exam, neighbors.prev) }} {{ neighbors.prev.short }}</RouterLink>
      <span v-else></span>
      <RouterLink v-if="neighbors.next" :to="`/${exam.id}/topic/${neighbors.next.slug}`" class="btn-ghost">{{ sectionNumber(exam, neighbors.next) }} {{ neighbors.next.short }}<Icon name="arrow-right" :size="16" /></RouterLink>
      <RouterLink v-else :to="`/${exam.id}#practice`" class="btn-ghost">Practice exams<Icon name="arrow-right" :size="16" /></RouterLink>
    </nav>
  </div>
</template>
