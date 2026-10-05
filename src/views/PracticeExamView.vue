<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import QuestionCard from '../components/QuestionCard.vue'
import NotFound from './NotFound.vue'
import { getExam } from '../data'
import { buildPracticeExams } from '../lib/examBuilder'
import { ALT_TYPES, isAnswered, isCorrect } from '../lib/grading'
import { examRecord, bumpStreak } from '../lib/storage'
import { clock } from '../lib/format'

const props = defineProps({ examId: String, n: Number })
const router = useRouter()
const exam = getExam(props.examId)
const valid = exam && props.n >= 1 && props.n <= exam.practiceExams.count
const ids = valid ? buildPracticeExams(exam)[props.n - 1] : []
const questions = ids.map((id) => exam.questionIndex[id])
const rec = valid ? examRecord(exam.id, props.n) : null
const state = computed(() => rec?.inProgress)
const seed = `${props.examId}-practice-${props.n}`

const altCount = questions.filter((q) => ALT_TYPES.includes(q.type)).length
const calcCount = questions.filter((q) => q.type === 'numeric').length
const topicTitle = (q) => exam.topics.find((t) => t.slug === q.topic)?.short

function start() {
  rec.inProgress = { answers: {}, flags: {}, current: 0, remaining: exam.format.minutes * 60, startedAt: Date.now() }
  bumpStreak()
}

const current = computed(() => questions[state.value?.current ?? 0])
const answered = computed(() => (state.value ? questions.filter((q) => isAnswered(q, state.value.answers[q.id])).length : 0))
const flagged = computed(() => (state.value ? questions.filter((q) => state.value.flags[q.id]).length : 0))
const lowTime = computed(() => state.value && state.value.remaining <= 300)

function go(i) {
  if (i < 0 || i >= questions.length) return
  state.value.current = i
  navOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function toggleFlag() {
  const f = state.value.flags
  f[current.value.id] ? delete f[current.value.id] : (f[current.value.id] = true)
}

let timer
onMounted(() => {
  timer = setInterval(() => {
    if (!state.value || document.hidden) return
    state.value.remaining--
    if (state.value.remaining <= 0) submit()
  }, 1000)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  window.removeEventListener('keydown', onKey)
})

const card = ref(null)
const confirmOpen = ref(false)
const navOpen = ref(false)

function submit() {
  const s = state.value
  if (!s) return
  const correct = questions.filter((q) => isCorrect(q, s.answers[q.id])).length
  rec.attempts.push({
    at: Date.now(),
    correct,
    total: questions.length,
    durationSec: exam.format.minutes * 60 - Math.max(0, s.remaining),
    answers: s.answers,
    flags: s.flags,
  })
  // keep full answer sheets for the 5 most recent attempts
  rec.attempts.forEach((a, i) => {
    if (i < rec.attempts.length - 5) delete a.answers
  })
  rec.inProgress = null
  router.replace(`/${exam.id}/practice/${props.n}/results`)
}

function onKey(e) {
  if (!state.value || confirmOpen.value || e.metaKey || e.ctrlKey || e.target.tagName === 'INPUT') return
  if (e.key === 'ArrowRight') go(state.value.current + 1)
  else if (e.key === 'ArrowLeft') go(state.value.current - 1)
  else if (e.key.toLowerCase() === 'f') toggleFlag()
  else if (/^[1-9]$/.test(e.key)) card.value?.qid === current.value.id && card.value.pressKey(e.key)
}
</script>

<template>
  <NotFound v-if="!valid" />

  <!-- intro -->
  <div v-else-if="!state" class="mx-auto max-w-2xl">
    <section class="card overflow-hidden animate-rise">
      <div class="relative bg-gradient-to-br from-maroon-700 via-maroon-800 to-maroon-950 p-8 text-white sm:p-10">
        <div class="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_80%_20%,#f59e0b_0,transparent_40%)]"></div>
        <p class="relative text-xs font-bold tracking-[0.18em] text-maroon-200 uppercase">{{ exam.course }} · {{ exam.title }}</p>
        <h1 class="relative mt-2 font-display text-4xl font-bold sm:text-5xl">Practice Exam {{ n }}</h1>
        <p class="relative mt-2 text-maroon-100">Built to match the official blueprint.</p>
      </div>
      <div class="grid grid-cols-2 gap-px bg-stone-200 sm:grid-cols-4 dark:bg-white/5">
        <div v-for="s in [
          { v: questions.length, l: 'questions' },
          { v: exam.format.minutes, l: 'minutes' },
          { v: altCount, l: 'alternate format' },
          { v: calcCount, l: 'dosage calc' },
        ]" :key="s.l" class="bg-white p-5 text-center dark:bg-[#151011]">
          <p class="font-mono text-3xl font-bold">{{ s.v }}</p>
          <p class="text-xs text-stone-500">{{ s.l }}</p>
        </div>
      </div>
      <div class="space-y-4 p-8 text-sm text-stone-600 dark:text-stone-400">
        <p class="flex gap-3"><Icon name="clock" :size="18" class="shrink-0 text-maroon-600" />The timer counts down from {{ exam.format.minutes }} minutes and the exam submits itself at zero. It pauses if you leave this tab or close it, and you can resume later.</p>
        <p class="flex gap-3"><Icon name="eye" :size="18" class="shrink-0 text-maroon-600" />Like the real thing, you won't see whether you're right until you submit. Every rationale is waiting on the results screen.</p>
        <p class="flex gap-3"><Icon name="flag" :size="18" class="shrink-0 text-maroon-600" />Flag questions to come back to, and jump anywhere with the question map.</p>
        <p class="flex gap-3"><Icon name="alert" :size="18" class="shrink-0 text-maroon-600" />Select-all and ordering questions are all-or-nothing.</p>
        <button class="btn-primary mt-4 w-full py-4 text-base" @click="start"><Icon name="play" :size="16" /> Begin exam</button>
      </div>
    </section>
  </div>

  <!-- exam -->
  <div v-else class="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
    <div class="min-w-0">
      <div class="sticky top-[4.5rem] z-20 mb-5 flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-white/85 p-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#161112]/85">
        <span class="flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-lg font-bold" :class="lowTime ? 'animate-pulse bg-rose-500 text-white' : 'bg-stone-100 dark:bg-white/5'">
          <Icon name="clock" :size="16" />{{ clock(state.remaining) }}
        </span>
        <div class="hidden flex-1 sm:block">
          <div class="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-white/5">
            <div class="h-full rounded-full bg-gradient-to-r from-maroon-500 to-amber-500 transition-all" :style="{ width: (answered / questions.length) * 100 + '%' }"></div>
          </div>
          <p class="mt-1 text-[11px] font-semibold text-stone-500">{{ answered }} of {{ questions.length }} answered<span v-if="flagged"> · {{ flagged }} flagged</span></p>
        </div>
        <button class="btn-ghost ml-auto px-3 py-2 lg:hidden" @click="navOpen = true"><Icon name="list" :size="16" />{{ state.current + 1 }}/{{ questions.length }}</button>
        <button class="btn-primary px-4 py-2" @click="confirmOpen = true">Submit</button>
      </div>

      <Transition name="fade" mode="out-in">
        <section :key="current.id" class="card p-6 sm:p-8">
          <div class="mb-4 flex justify-end">
            <button class="chip transition" :class="state.flags[current.id] ? 'bg-amber-400 text-amber-950' : 'bg-stone-100 text-stone-500 hover:bg-amber-100 dark:bg-white/5'" @click="toggleFlag">
              <Icon name="flag" :size="13" /> {{ state.flags[current.id] ? 'Flagged' : 'Flag for review' }}
            </button>
          </div>
          <QuestionCard ref="card" v-model="state.answers[current.id]" :question="current" :seed="seed" :number="state.current + 1" />
        </section>
      </Transition>

      <div class="mt-5 flex items-center justify-between gap-3">
        <button class="btn-ghost" :disabled="state.current === 0" @click="go(state.current - 1)"><Icon name="arrow-left" :size="16" /> Previous</button>
        <p class="hidden text-xs text-stone-500 sm:block"><span class="kbd">←</span> <span class="kbd">→</span> move · <span class="kbd">F</span> flag</p>
        <button v-if="state.current < questions.length - 1" class="btn-primary" @click="go(state.current + 1)">Next <Icon name="arrow-right" :size="16" /></button>
        <button v-else class="btn-primary" @click="confirmOpen = true">Review & submit</button>
      </div>
    </div>

    <!-- navigator -->
    <aside
      class="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] translate-y-full overflow-y-auto rounded-t-3xl border-t border-stone-200 bg-white p-5 shadow-2xl transition-transform duration-300 lg:sticky lg:top-[4.5rem] lg:z-0 lg:max-h-[calc(100vh-6rem)] lg:translate-y-0 lg:rounded-3xl lg:border lg:shadow-none dark:border-white/10 dark:bg-[#151011]"
      :class="navOpen ? 'translate-y-0' : ''"
    >
      <div class="mb-4 flex items-center justify-between">
        <p class="font-bold">Question map</p>
        <button class="lg:hidden" @click="navOpen = false"><Icon name="x" :size="20" /></button>
      </div>
      <div class="grid grid-cols-8 gap-1.5 lg:grid-cols-6">
        <button
          v-for="(q, i) in questions"
          :key="q.id"
          class="relative grid aspect-square place-items-center rounded-lg font-mono text-[11px] font-bold transition"
          :class="[
            i === state.current ? 'ring-2 ring-maroon-500 ring-offset-1 dark:ring-offset-[#151011]' : '',
            isAnswered(q, state.answers[q.id]) ? 'bg-maroon-700 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-white/5 dark:hover:bg-white/10',
          ]"
          @click="go(i)"
        >
          {{ i + 1 }}
          <span v-if="state.flags[q.id]" class="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#151011]"></span>
        </button>
      </div>
      <div class="mt-4 space-y-1.5 text-xs text-stone-500">
        <p class="flex items-center gap-2"><span class="h-3 w-3 rounded bg-maroon-700"></span>Answered</p>
        <p class="flex items-center gap-2"><span class="h-3 w-3 rounded bg-stone-200 dark:bg-white/10"></span>Not answered</p>
        <p class="flex items-center gap-2"><span class="h-3 w-3 rounded-full bg-amber-400"></span>Flagged</p>
      </div>
    </aside>
    <div v-if="navOpen" class="fixed inset-0 z-30 bg-black/40 lg:hidden" @click="navOpen = false"></div>

    <!-- submit modal -->
    <Transition name="fade">
      <div v-if="confirmOpen" class="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" @click.self="confirmOpen = false">
        <div class="card w-full max-w-md bg-white p-7 animate-pop dark:bg-[#151011]">
          <h2 class="font-display text-2xl font-bold">Submit exam?</h2>
          <ul class="mt-4 space-y-2 text-sm">
            <li class="flex justify-between"><span>Answered</span><span class="font-mono font-bold">{{ answered }} / {{ questions.length }}</span></li>
            <li class="flex justify-between" :class="questions.length - answered ? 'text-rose-600 dark:text-rose-400' : ''"><span>Unanswered</span><span class="font-mono font-bold">{{ questions.length - answered }}</span></li>
            <li class="flex justify-between"><span>Flagged</span><span class="font-mono font-bold">{{ flagged }}</span></li>
            <li class="flex justify-between"><span>Time left</span><span class="font-mono font-bold">{{ clock(state.remaining) }}</span></li>
          </ul>
          <p v-if="questions.length - answered" class="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">Unanswered questions are scored as wrong.</p>
          <div class="mt-6 flex gap-3">
            <button class="btn-ghost flex-1" @click="confirmOpen = false">Keep working</button>
            <button class="btn-primary flex-1" @click="submit">Submit</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
