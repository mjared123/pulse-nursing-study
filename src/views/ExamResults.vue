<script setup>
import { computed, ref } from 'vue'
import Icon from '../components/Icon.vue'
import QuestionCard from '../components/QuestionCard.vue'
import ProgressRing from '../components/ProgressRing.vue'
import Confetti from '../components/Confetti.vue'
import NotFound from './NotFound.vue'
import { getExam } from '../data'
import { buildPracticeExams } from '../lib/examBuilder'
import { ALT_TYPES, isAnswered, isCorrect } from '../lib/grading'
import { store } from '../lib/storage'
import { clock, grade, pct, ago } from '../lib/format'

const props = defineProps({ examId: String, n: Number, attempt: Number })
const exam = getExam(props.examId)
const attempts = computed(() => store.exams[props.examId]?.[props.n]?.attempts ?? [])
const idx = ref(props.attempt ?? attempts.value.length - 1)
const a = computed(() => attempts.value[idx.value])
const questions = exam && props.n >= 1 && props.n <= exam.practiceExams.count ? buildPracticeExams(exam)[props.n - 1].map((id) => exam.questionIndex[id]) : []
const seed = `${props.examId}-practice-${props.n}`

const ok = (q) => isCorrect(q, a.value?.answers?.[q.id])
const score = computed(() => (a.value ? a.value.correct / a.value.total : 0))
const g = computed(() => grade(score.value))

function bucket(keyFn, labelFn) {
  const m = new Map()
  questions.forEach((q) => {
    const k = keyFn(q)
    const b = m.get(k) ?? { key: k, label: labelFn(k), total: 0, right: 0 }
    b.total++
    if (ok(q)) b.right++
    m.set(k, b)
  })
  return [...m.values()]
}
const byTopic = computed(() =>
  a.value ? bucket((q) => q.topic, (k) => exam.topics.find((t) => t.slug === k)?.short).sort((x, y) => x.right / x.total - y.right / y.total) : []
)
const BLOOM = ['remember', 'understand', 'apply', 'analyze', 'evaluate']
const byBloom = computed(() => (a.value ? bucket((q) => q.bloom ?? 'apply', (k) => k).sort((x, y) => BLOOM.indexOf(x.key) - BLOOM.indexOf(y.key)) : []))
const byType = computed(() =>
  a.value ? bucket((q) => (q.type === 'numeric' ? 'Dosage calc' : ALT_TYPES.includes(q.type) ? 'Alternate format' : 'Multiple choice'), (k) => k) : []
)

const filter = ref('incorrect')
const filtered = computed(() =>
  questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => {
      if (filter.value === 'incorrect') return !ok(q)
      if (filter.value === 'correct') return ok(q)
      if (filter.value === 'flagged') return a.value?.flags?.[q.id]
      return true
    })
)
const counts = computed(() => ({
  all: questions.length,
  incorrect: questions.filter((q) => !ok(q)).length,
  correct: questions.filter(ok).length,
  flagged: questions.filter((q) => a.value?.flags?.[q.id]).length,
}))
const topicTitle = (slug) => exam.topics.find((t) => t.slug === slug)?.short
const barTone = (p) => (p >= 0.9 ? 'bg-emerald-500' : p >= 0.75 ? 'bg-sky-500' : p >= 0.6 ? 'bg-amber-500' : 'bg-rose-500')
</script>

<template>
  <NotFound v-if="!exam || !questions.length" />
  <div v-else-if="!a" class="card mx-auto max-w-lg p-10 text-center">
    <p class="font-semibold">No results for this practice exam yet.</p>
    <RouterLink :to="`/${examId}/practice/${n}`" class="btn-primary mt-6">Take Practice Exam {{ n }}</RouterLink>
  </div>
  <div v-else class="space-y-8">
    <Confetti v-if="score >= 0.8 && idx === attempts.length - 1 && Date.now() - a.at < 10000" />
    <RouterLink :to="`/${exam.id}#practice`" class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-maroon-700 dark:hover:text-maroon-300">
      <Icon name="arrow-left" :size="16" /> {{ exam.course }} {{ exam.title }}
    </RouterLink>

    <!-- score hero -->
    <section class="card overflow-hidden animate-pop">
      <div class="flex flex-col items-center gap-8 p-8 sm:p-10 md:flex-row">
        <ProgressRing :value="score" :size="180" :stroke="14" />
        <div class="flex-1 text-center md:text-left">
          <p class="eyebrow">Practice Exam {{ n }} · results</p>
          <h1 class="mt-2 font-display text-5xl font-bold">{{ g.label }}</h1>
          <p class="mt-2 text-lg text-stone-600 dark:text-stone-400">
            <b class="text-stone-900 dark:text-white">{{ a.correct }}</b> of {{ a.total }} correct in {{ clock(a.durationSec) }}
          </p>
          <div v-if="attempts.length > 1" class="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
            <button
              v-for="(at, i) in attempts"
              :key="at.at"
              class="chip transition"
              :class="i === idx ? 'bg-maroon-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-white/5 dark:text-stone-300'"
              :disabled="!at.answers"
              :title="at.answers ? '' : 'Only the 5 most recent attempts keep full answers'"
              @click="idx = i"
            >
              #{{ i + 1 }} · {{ pct(at.correct / at.total) }}% · {{ ago(at.at) }}
            </button>
          </div>
          <div class="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            <RouterLink :to="`/${exam.id}/practice/${n}`" class="btn-primary"><Icon name="rotate" :size="16" /> Retake</RouterLink>
            <RouterLink v-if="n < exam.practiceExams.count" :to="`/${exam.id}/practice/${n + 1}`" class="btn-ghost">Practice Exam {{ n + 1 }} <Icon name="arrow-right" :size="16" /></RouterLink>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-px border-t border-stone-200 bg-stone-200 dark:border-white/5 dark:bg-white/5">
        <div v-for="t in byType" :key="t.key" class="bg-white p-4 text-center dark:bg-[#151011]">
          <p class="font-mono text-xl font-bold">{{ t.right }}/{{ t.total }}</p>
          <p class="text-xs text-stone-500">{{ t.label }}</p>
        </div>
      </div>
    </section>

    <div class="grid gap-5 lg:grid-cols-5">
      <section class="card p-7 lg:col-span-3">
        <h2 class="font-display text-2xl font-bold">By topic</h2>
        <p class="text-sm text-stone-500">Weakest first. Tap a topic to drill it.</p>
        <ul class="mt-5 space-y-3">
          <li v-for="t in byTopic" :key="t.key">
            <RouterLink :to="`/${exam.id}/topic/${t.key}`" class="group block">
              <div class="flex justify-between text-sm">
                <span class="font-semibold group-hover:text-maroon-700 dark:group-hover:text-maroon-300">{{ t.label }}</span>
                <span class="font-mono text-stone-500">{{ t.right }}/{{ t.total }}</span>
              </div>
              <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-white/5">
                <div class="h-full rounded-full transition-all duration-700" :class="barTone(t.right / t.total)" :style="{ width: Math.max(2, (t.right / t.total) * 100) + '%' }"></div>
              </div>
            </RouterLink>
          </li>
        </ul>
      </section>
      <section class="card p-7 lg:col-span-2">
        <h2 class="font-display text-2xl font-bold">By thinking level</h2>
        <p class="text-sm text-stone-500">Bloom's level of each question.</p>
        <ul class="mt-5 space-y-4">
          <li v-for="b in byBloom" :key="b.key">
            <div class="flex justify-between text-sm">
              <span class="font-semibold capitalize">{{ b.label }}</span>
              <span class="font-mono text-stone-500">{{ pct(b.right / b.total) }}%</span>
            </div>
            <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-white/5">
              <div class="h-full rounded-full" :class="barTone(b.right / b.total)" :style="{ width: Math.max(2, (b.right / b.total) * 100) + '%' }"></div>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <!-- review -->
    <section>
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="eyebrow">Rationales</p>
          <h2 class="mt-1 font-display text-3xl font-bold">Review every question</h2>
        </div>
        <div class="flex flex-wrap gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-white/5">
          <button
            v-for="f in ['incorrect', 'flagged', 'correct', 'all']"
            :key="f"
            class="rounded-xl px-3.5 py-2 text-sm font-semibold capitalize transition"
            :class="filter === f ? 'bg-white text-stone-900 shadow-sm dark:bg-white/15 dark:text-white' : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'"
            @click="filter = f"
          >
            {{ f }} <span class="font-mono text-xs opacity-60">{{ counts[f] }}</span>
          </button>
        </div>
      </div>
      <div class="mt-6 space-y-5">
        <p v-if="!filtered.length" class="card p-8 text-center text-stone-500">Nothing here.</p>
        <section v-for="{ q, i } in filtered" :key="q.id" class="card p-6 sm:p-8">
          <div v-if="a.flags?.[q.id]" class="mb-3"><span class="chip bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"><Icon name="flag" :size="12" />You flagged this</span></div>
          <p v-if="!isAnswered(q, a.answers?.[q.id])" class="mb-3 text-sm font-semibold text-rose-600 dark:text-rose-400">Left unanswered</p>
          <QuestionCard :question="q" :model-value="a.answers?.[q.id] ?? null" revealed :seed="seed" :number="i + 1" :topic-title="topicTitle(q.topic)" />
        </section>
      </div>
    </section>
  </div>
</template>
