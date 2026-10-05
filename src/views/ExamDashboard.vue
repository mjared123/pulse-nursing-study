<script setup>
import { computed } from 'vue'
import Icon from '../components/Icon.vue'
import ProgressRing from '../components/ProgressRing.vue'
import NotFound from './NotFound.vue'
import { getExam } from '../data'
import { store, topicMastery } from '../lib/storage'
import { pct, ago } from '../lib/format'

const props = defineProps({ examId: String })
const exam = computed(() => getExam(props.examId))

const GROUP_TONE = {
  rose: 'from-rose-500 to-maroon-700',
  amber: 'from-amber-400 to-orange-600',
  sky: 'from-sky-400 to-indigo-600',
  emerald: 'from-emerald-400 to-teal-600',
}

const groups = computed(() =>
  exam.value.groups.map((g) => ({ ...g, topics: exam.value.topics.filter((t) => t.group === g.id) })).filter((g) => g.topics.length)
)
const mastery = (t) => topicMastery(exam.value.id, t)
const overall = computed(() => {
  const m = exam.value.topics.map(mastery)
  const total = m.reduce((s, x) => s + x.total, 0)
  return {
    pct: total ? m.reduce((s, x) => s + x.right, 0) / total : 0,
    answered: m.reduce((s, x) => s + x.answered, 0),
    total,
  }
})
const weakest = computed(() =>
  exam.value.topics
    .map((t) => ({ t, m: mastery(t) }))
    .filter((x) => x.m.answered > 0)
    .sort((a, b) => a.m.right / a.m.answered - b.m.right / b.m.answered)[0]
)

const practice = computed(() =>
  Array.from({ length: exam.value.practiceExams.count }, (_, i) => {
    const rec = store.exams[exam.value.id]?.[i + 1]
    const attempts = rec?.attempts ?? []
    return {
      n: i + 1,
      inProgress: rec?.inProgress,
      best: attempts.length ? Math.max(...attempts.map((a) => a.correct / a.total)) : null,
      last: attempts.at(-1),
      attempts: attempts.length,
    }
  })
)

const maxBlueprint = computed(() => Math.max(...exam.value.topics.map((t) => t.blueprint)))
const bloomTotal = computed(() => Object.values(exam.value.bloom).reduce((a, b) => a + b, 0))
const BLOOM_COLORS = { remember: 'bg-sky-400', understand: 'bg-indigo-400', apply: 'bg-maroon-500', analyze: 'bg-amber-500', evaluate: 'bg-emerald-500', create: 'bg-stone-400' }
</script>

<template>
  <NotFound v-if="!exam" />
  <div v-else class="space-y-14">
    <!-- header -->
    <section class="card relative overflow-hidden p-7 sm:p-10 animate-rise">
      <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-maroon-500/10 to-transparent md:block"></div>
      <div class="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div class="max-w-xl">
          <p class="eyebrow">{{ exam.course }} · {{ exam.term }}</p>
          <h1 class="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{{ exam.title }}</h1>
          <p class="mt-2 text-lg text-stone-600 dark:text-stone-400">{{ exam.subtitle }}</p>
          <div class="mt-5 flex flex-wrap gap-2">
            <span class="chip bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300"><Icon name="list" :size="13" />{{ exam.format.totalQuestions }} questions</span>
            <span class="chip bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300"><Icon name="clock" :size="13" />{{ exam.format.minutes }} minutes</span>
            <span class="chip bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300"><Icon name="layers" :size="13" />{{ exam.format.alternateFormat }} alternate format</span>
            <span class="chip bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300"><Icon name="calculator" :size="13" />{{ exam.format.dosageCalculation }} dosage calc</span>
          </div>
        </div>
        <div class="flex items-center gap-6">
          <ProgressRing :value="overall.pct" :size="120" :stroke="10" />
          <div class="text-sm">
            <p class="font-semibold">Exam mastery</p>
            <p class="mt-1 text-stone-500">{{ overall.answered }} of {{ overall.total }} questions tried</p>
            <RouterLink v-if="weakest" :to="`/${exam.id}/topic/${weakest.t.slug}`" class="mt-3 inline-flex items-center gap-1.5 font-semibold text-maroon-700 hover:underline dark:text-maroon-300">
              <Icon name="target" :size="15" /> Focus next: {{ weakest.t.short }}
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- practice exams -->
    <section id="practice">
      <p class="eyebrow">Full length · real format</p>
      <h2 class="mt-1 font-display text-3xl font-bold">Practice exams</h2>
      <p class="mt-2 max-w-2xl text-stone-600 dark:text-stone-400">
        Each one is {{ exam.format.totalQuestions }} questions in {{ exam.format.minutes }} minutes with at least {{ exam.format.alternateFormat }} alternate-format items and {{ exam.format.dosageCalculation }} dosage calculations, mixed across every topic. Rationales unlock when you submit.
      </p>
      <div class="mt-6 grid gap-5 md:grid-cols-3">
        <div v-for="p in practice" :key="p.n" class="card card-hover relative flex flex-col overflow-hidden p-6">
          <div class="absolute top-0 right-0 font-display text-[120px] leading-none font-bold text-stone-900/[0.04] dark:text-white/[0.04]">{{ p.n }}</div>
          <p class="text-sm font-semibold text-stone-500">Practice Exam</p>
          <p class="font-display text-4xl font-bold">#{{ p.n }}</p>
          <div class="mt-4 min-h-12 text-sm">
            <p v-if="p.inProgress" class="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400"><Icon name="play" :size="13" /> In progress</p>
            <template v-else-if="p.best != null">
              <p><span class="font-mono text-2xl font-bold" :class="p.best >= 0.8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-maroon-700 dark:text-maroon-300'">{{ pct(p.best) }}%</span> <span class="text-stone-500">best</span></p>
              <p class="text-xs text-stone-500">{{ p.attempts }} attempt{{ p.attempts > 1 ? 's' : '' }} · last {{ ago(p.last.at) }}</p>
            </template>
            <p v-else class="text-stone-500">Not attempted yet</p>
          </div>
          <div class="mt-5 flex gap-2">
            <RouterLink :to="`/${exam.id}/practice/${p.n}`" class="btn-primary flex-1">
              {{ p.inProgress ? 'Resume' : p.attempts ? 'Retake' : 'Start exam' }}
            </RouterLink>
            <RouterLink v-if="p.attempts" :to="`/${exam.id}/practice/${p.n}/results`" class="btn-ghost" title="Review last attempt"><Icon name="eye" :size="18" /></RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- topics -->
    <section id="topics">
      <p class="eyebrow">Section quizzes</p>
      <h2 class="mt-1 font-display text-3xl font-bold">Study by topic</h2>
      <p class="mt-2 max-w-2xl text-stone-600 dark:text-stone-400">Every answer shows why each choice is right or wrong right away. The bar on each card shows how many questions that topic has on the real exam.</p>
      <div class="mt-8 space-y-10">
        <div v-for="g in groups" :key="g.id">
          <div class="mb-4 flex items-center gap-3">
            <span class="h-6 w-1.5 rounded-full bg-gradient-to-b" :class="GROUP_TONE[g.color]"></span>
            <h3 class="text-lg font-bold">{{ g.title }}</h3>
          </div>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <RouterLink v-for="t in g.topics" :key="t.slug" :to="`/${exam.id}/topic/${t.slug}`" class="card card-hover group flex items-center gap-4 p-5">
              <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md" :class="GROUP_TONE[g.color]">
                <Icon :name="t.icon" :size="22" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate font-bold group-hover:text-maroon-700 dark:group-hover:text-maroon-300">{{ t.short }}</p>
                <p class="text-xs text-stone-500">{{ t.questions.length }} questions · {{ t.blueprint }} on exam</p>
                <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-white/5">
                  <div class="h-full rounded-full bg-gradient-to-r" :class="GROUP_TONE[g.color]" :style="{ width: (t.blueprint / maxBlueprint) * 100 + '%' }"></div>
                </div>
              </div>
              <ProgressRing :value="mastery(t).pct" :size="46" :stroke="5" />
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- blueprint -->
    <section id="blueprint" class="grid items-start gap-5 lg:grid-cols-2">
      <div class="card p-7">
        <p class="eyebrow">From the blueprint</p>
        <h2 class="mt-1 font-display text-2xl font-bold">Thinking levels tested</h2>
        <p class="mt-1 text-sm text-stone-500">Bloom's cognitive level, {{ bloomTotal }} points total. Most of this exam is application and analysis.</p>
        <div class="mt-6 flex h-4 overflow-hidden rounded-full">
          <div v-for="(n, k) in exam.bloom" :key="k" :class="BLOOM_COLORS[k]" :style="{ width: (n / bloomTotal) * 100 + '%' }" :title="`${k}: ${n}`"></div>
        </div>
        <ul class="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <li v-for="(n, k) in exam.bloom" :key="k" class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full" :class="BLOOM_COLORS[k]"></span>
            <span class="capitalize">{{ k }}</span>
            <span class="ml-auto font-mono font-bold">{{ n }}</span>
          </li>
        </ul>
      </div>
      <div class="card p-7">
        <p class="eyebrow">From the blueprint</p>
        <h2 class="mt-1 font-display text-2xl font-bold">Learning objectives</h2>
        <div class="mt-4 space-y-5">
          <div v-for="o in exam.objectives" :key="o.title">
            <p class="font-bold">{{ o.title }}</p>
            <ul class="mt-2 space-y-1.5">
              <li v-for="item in o.items" :key="item" class="flex gap-2 text-sm text-stone-600 dark:text-stone-400">
                <Icon name="check" :size="15" class="mt-0.5 shrink-0 text-emerald-500" />{{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
