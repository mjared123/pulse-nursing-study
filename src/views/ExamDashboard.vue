<script setup>
import { computed } from 'vue'
import Icon from '../components/Icon.vue'
import ProgressRing from '../components/ProgressRing.vue'
import NotFound from './NotFound.vue'
import { getExam } from '../data'
import { pct, ago } from '../lib/format'
import { topicStatus, practiceStatus, unitProgress, continueTarget, sectionNumber, quizLength } from '../lib/progress'

const props = defineProps({ examId: String })
const exam = computed(() => getExam(props.examId))

const GROUP_TONE = {
  rose: 'from-rose-500 to-maroon-700',
  amber: 'from-amber-400 to-orange-600',
  sky: 'from-sky-400 to-indigo-600',
  emerald: 'from-emerald-400 to-teal-600',
  violet: 'from-violet-400 to-purple-700',
  indigo: 'from-indigo-400 to-blue-700',
}

const sections = computed(() => exam.value.topics.map((t) => ({ t, s: topicStatus(exam.value, t), num: sectionNumber(exam.value, t) })))
const groups = computed(() =>
  exam.value.groups.map((g) => ({ ...g, sections: sections.value.filter((x) => x.t.group === g.id) })).filter((g) => g.sections.length)
)
const progress = computed(() => unitProgress(exam.value))
const next = computed(() => continueTarget(exam.value))
const remaining = computed(() => progress.value.total - progress.value.done)
const practice = computed(() => Array.from({ length: exam.value.practiceExams.count }, (_, i) => practiceStatus(exam.value, i + 1)))

const bloomTotal = computed(() => Object.values(exam.value.bloom ?? {}).reduce((a, b) => a + b, 0))
const BLOOM_COLORS = { remember: 'bg-sky-400', understand: 'bg-indigo-400', apply: 'bg-maroon-500', analyze: 'bg-amber-500', evaluate: 'bg-emerald-500', create: 'bg-stone-400' }
</script>

<template>
  <NotFound v-if="!exam" />
  <div v-else class="space-y-10">
    <RouterLink :to="`/${exam.courseId}`" class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-maroon-700 dark:hover:text-maroon-300">
      <Icon name="arrow-left" :size="16" /> {{ exam.course }} units
    </RouterLink>

    <!-- header -->
    <section class="card relative overflow-hidden p-7 sm:p-10 animate-rise">
      <div class="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-maroon-500/10 to-transparent md:block"></div>
      <div class="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-2xl">
          <p class="eyebrow">{{ exam.course }} · Unit {{ exam.unit }} · {{ exam.term }}</p>
          <h1 class="mt-2 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">{{ exam.subtitle }}</h1>
          <p class="mt-3 text-stone-600 dark:text-stone-400">Work through the sections in order, then sit the practice exams for {{ exam.title }}. You can jump to any section at any time.</p>
          <div class="mt-5 flex flex-wrap gap-2">
            <span class="chip bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300"><Icon name="list" :size="13" />{{ exam.format.totalQuestions }}-question exam</span>
            <span class="chip bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300"><Icon name="clock" :size="13" />{{ exam.format.minutes }} minutes</span>
            <span class="chip bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300"><Icon name="layers" :size="13" />{{ exam.format.alternateFormat }} alternate format</span>
            <span class="chip bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300"><Icon name="calculator" :size="13" />{{ exam.format.dosageCalculation }} dosage calc</span>
          </div>
        </div>
        <div class="w-full shrink-0 rounded-2xl border border-stone-200/70 bg-white/70 p-5 lg:w-80 dark:border-white/10 dark:bg-white/[0.03]">
          <div class="flex items-center gap-4">
            <ProgressRing :value="progress.pct" :size="72" :stroke="7" />
            <div class="text-sm">
              <p class="font-semibold">Unit progress</p>
              <p class="text-stone-500">{{ progress.done }} of {{ progress.total }} sections complete</p>
            </div>
          </div>
          <RouterLink :to="next.to" class="btn-primary mt-4 w-full py-3">
            <Icon name="play" :size="14" /> {{ next.fresh ? 'Start unit' : 'Continue where you left off' }}
          </RouterLink>
          <p class="mt-2 truncate text-center text-xs text-stone-500">{{ next.title }} · {{ next.detail }}</p>
        </div>
      </div>
    </section>

    <div class="grid items-start gap-8 lg:grid-cols-[17rem_1fr]">
      <!-- table of contents -->
      <aside class="card hidden p-5 lg:sticky lg:top-24 lg:block">
        <p class="eyebrow">Contents</p>
        <ol class="mt-3 space-y-0.5 text-sm">
          <li v-for="x in sections" :key="x.t.slug">
            <RouterLink :to="`/${exam.id}/topic/${x.t.slug}`" class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-stone-100 dark:hover:bg-white/5" :class="next.topic?.slug === x.t.slug ? 'bg-maroon-50 font-semibold text-maroon-800 dark:bg-maroon-500/10 dark:text-maroon-200' : ''">
              <span class="grid h-4 w-4 shrink-0 place-items-center rounded-full" :class="x.s.complete ? 'bg-emerald-500 text-white' : x.s.started ? 'border-2 border-amber-400' : 'border-2 border-stone-300 dark:border-white/15'">
                <Icon v-if="x.s.complete" name="check" :size="10" :stroke="3.5" />
              </span>
              <span class="w-7 shrink-0 font-mono text-xs text-stone-400">{{ x.num }}</span>
              <span class="truncate">{{ x.t.short }}</span>
            </RouterLink>
          </li>
          <li class="mt-2 border-t border-stone-200/70 pt-2 dark:border-white/5">
            <RouterLink :to="`/${exam.id}#practice`" class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-stone-100 dark:hover:bg-white/5" :class="next.kind === 'practice' ? 'bg-maroon-50 font-semibold text-maroon-800 dark:bg-maroon-500/10 dark:text-maroon-200' : ''">
              <Icon :name="progress.unlocked ? 'unlock' : 'lock'" :size="15" :class="progress.unlocked ? 'text-emerald-500' : 'text-stone-400'" />
              <span>Practice exams</span>
            </RouterLink>
          </li>
        </ol>
      </aside>

      <div class="min-w-0 space-y-12">
        <!-- sections -->
        <section id="topics">
          <p class="eyebrow">Step 1 · Study by topic</p>
          <h2 class="mt-1 font-display text-3xl font-bold">Sections</h2>
          <p class="mt-2 max-w-2xl text-stone-600 dark:text-stone-400">Each section has key points and a quiz with instant rationales. Finish a full quiz to complete the section.</p>
          <div class="mt-6 space-y-8">
            <div v-for="g in groups" :key="g.id">
              <div class="mb-3 flex items-center gap-3">
                <span class="h-6 w-1.5 rounded-full bg-gradient-to-b" :class="GROUP_TONE[g.color]"></span>
                <h3 class="text-lg font-bold">{{ g.title }}</h3>
              </div>
              <ol class="card divide-y divide-stone-200/70 overflow-hidden dark:divide-white/5">
                <li v-for="x in g.sections" :key="x.t.slug" class="relative flex items-center gap-4 px-4 py-4 transition hover:bg-stone-50 sm:px-5 dark:hover:bg-white/[0.03]" :class="next.topic?.slug === x.t.slug ? 'bg-maroon-50/60 dark:bg-maroon-500/[0.06]' : ''">
                  <RouterLink :to="`/${exam.id}/topic/${x.t.slug}`" class="absolute inset-0" :aria-label="`Section ${x.num} ${x.t.short}`"></RouterLink>
                  <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm" :class="GROUP_TONE[g.color]">
                    <Icon :name="x.t.icon" :size="19" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-bold"><span class="mr-1.5 font-mono text-sm font-semibold text-stone-400">{{ x.num }}</span>{{ x.t.short }}</p>
                    <p class="text-xs text-stone-500">{{ quizLength(exam, x.t) }}-question quiz · {{ x.t.questions.length }} in bank · {{ x.t.blueprint }} on exam</p>
                  </div>
                  <div class="pointer-events-none relative flex shrink-0 items-center gap-3">
                    <span v-if="x.s.complete" class="chip bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"><Icon name="check" :size="12" :stroke="3" /> {{ pct(x.s.best) }}%</span>
                    <RouterLink v-else-if="x.s.inProgress" :to="`/${exam.id}/topic/${x.t.slug}/quiz?resume=1`" class="pointer-events-auto chip bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-400/10 dark:text-amber-300">
                      <Icon name="play" :size="11" /> Resume {{ x.s.inProgress.idx + 1 }}/{{ x.s.inProgress.ids.length }}
                    </RouterLink>
                    <span v-else-if="x.s.started" class="chip bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">Started</span>
                    <span v-else-if="next.topic?.slug === x.t.slug" class="chip bg-maroon-600 text-white">Up next</span>
                    <Icon name="chevron-right" :size="18" class="hidden text-stone-400 sm:block" />
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        <!-- practice exams -->
        <section id="practice" class="scroll-mt-24">
          <p class="eyebrow">Step 2 · Full length, real format</p>
          <h2 class="mt-1 font-display text-3xl font-bold">Practice exams</h2>
          <p class="mt-2 max-w-2xl text-stone-600 dark:text-stone-400">
            Each one is {{ exam.format.totalQuestions }} questions in {{ exam.format.minutes }} minutes, mixed across every section. Rationales unlock when you submit.
          </p>
          <div v-if="!progress.unlocked" class="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-stone-300 p-4 text-sm dark:border-white/15">
            <Icon name="lock" :size="18" class="mt-0.5 shrink-0 text-stone-400" />
            <p class="text-stone-600 dark:text-stone-400">
              <b class="text-stone-800 dark:text-stone-200">Unlocks after {{ remaining }} more section{{ remaining === 1 ? '' : 's' }}.</b>
              Want to test yourself now? You can skip ahead and start any exam.
            </p>
          </div>
          <div v-else class="mt-5 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Icon name="unlock" :size="18" /> Every section complete. Your practice exams are unlocked.
          </div>
          <div class="mt-5 grid gap-5 md:grid-cols-3">
            <div v-for="p in practice" :key="p.n" class="card relative flex flex-col overflow-hidden p-6 transition" :class="progress.unlocked || p.attempts || p.inProgress ? 'card-hover' : 'opacity-70 hover:opacity-100'">
              <div class="absolute top-0 right-0 font-display text-[120px] leading-none font-bold text-stone-900/[0.04] dark:text-white/[0.04]">{{ p.n }}</div>
              <p class="flex items-center gap-1.5 text-sm font-semibold text-stone-500">
                <Icon v-if="!progress.unlocked" name="lock" :size="13" /> Practice Exam
              </p>
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
                <RouterLink :to="`/${exam.id}/practice/${p.n}`" :class="progress.unlocked || p.inProgress || p.attempts ? 'btn-primary' : 'btn-ghost'" class="flex-1">
                  {{ p.inProgress ? 'Resume' : p.attempts ? 'Retake' : progress.unlocked ? 'Start exam' : 'Skip ahead' }}
                </RouterLink>
                <RouterLink v-if="p.attempts" :to="`/${exam.id}/practice/${p.n}/results`" class="btn-ghost" title="Review last attempt"><Icon name="eye" :size="18" /></RouterLink>
              </div>
            </div>
          </div>
        </section>

        <!-- blueprint -->
        <section id="blueprint" class="grid items-start gap-5" :class="{ 'xl:grid-cols-2': exam.bloom }">
          <div v-if="exam.bloom" class="card p-7">
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
    </div>
  </div>
</template>
