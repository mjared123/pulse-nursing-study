<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import Icon from '../components/Icon.vue'
import QuestionCard from '../components/QuestionCard.vue'
import ProgressRing from '../components/ProgressRing.vue'
import Confetti from '../components/Confetti.vue'
import NotFound from './NotFound.vue'
import { getExam, getTopic } from '../data'
import { quizQuestions } from '../lib/examBuilder'
import { isAnswered, isCorrect } from '../lib/grading'
import { recordAnswer, recordQuiz, missedIds } from '../lib/storage'
import { grade, pct } from '../lib/format'

const props = defineProps({ examId: String, slug: String, mode: String })
const exam = getExam(props.examId)
const topic = getTopic(exam, props.slug)

const seed = String(Math.random())
const questions = ref(topic ? quizQuestions(topic, { length: exam.quizLength, mode: props.mode, missedIds: missedIds(exam.id, topic) }) : [])
const idx = ref(0)
const responses = reactive({})
const revealed = reactive({})
const done = ref(false)
const card = ref(null)

const current = computed(() => questions.value[idx.value])
const answeredCount = computed(() => Object.keys(revealed).length)
const correctCount = computed(() => questions.value.filter((q) => revealed[q.id] && isCorrect(q, responses[q.id])).length)
const canCheck = computed(() => current.value && (isAnswered(current.value, responses[current.value.id]) || current.value.type === 'order'))

function check() {
  const q = current.value
  if (!q || revealed[q.id]) return
  card.value?.ensureOrder()
  // ensureOrder emits synchronously; read the value on the next microtask
  queueMicrotask(() => {
    if (!isAnswered(q, responses[q.id])) return
    revealed[q.id] = true
    recordAnswer(exam.id, topic.slug, q.id, isCorrect(q, responses[q.id]))
  })
}
function next() {
  if (idx.value < questions.value.length - 1) {
    idx.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else finish()
}
function finish() {
  done.value = true
  recordQuiz(exam.id, topic.slug, correctCount.value, answeredCount.value)
  window.scrollTo({ top: 0 })
}

function onKey(e) {
  if (done.value || e.metaKey || e.ctrlKey || e.target.tagName === 'INPUT') {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !done.value) revealed[current.value.id] ? next() : check()
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    revealed[current.value.id] ? next() : canCheck.value && check()
  } else if (/^[1-9]$/.test(e.key) && !revealed[current.value.id]) card.value?.qid === current.value.id && card.value.pressKey(e.key)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const score = computed(() => (answeredCount.value ? correctCount.value / answeredCount.value : 0))
const g = computed(() => grade(score.value))
const reviewOpen = ref(null)
</script>

<template>
  <NotFound v-if="!topic" />
  <div v-else-if="!questions.length" class="card mx-auto max-w-lg p-10 text-center">
    <p class="font-semibold">Nothing to retry. You haven't missed anything in this topic.</p>
    <RouterLink :to="`/${exam.id}/topic/${topic.slug}`" class="btn-primary mt-6">Back to topic</RouterLink>
  </div>

  <!-- results -->
  <div v-else-if="done" class="mx-auto max-w-3xl space-y-6">
    <Confetti v-if="score >= 0.8" />
    <section class="card p-8 text-center sm:p-12 animate-pop">
      <p class="eyebrow">{{ topic.short }} · quiz complete</p>
      <div class="mt-6 flex justify-center"><ProgressRing :value="score" :size="160" :stroke="12" /></div>
      <h1 class="mt-6 font-display text-4xl font-bold">{{ g.label }}</h1>
      <p class="mt-2 text-stone-600 dark:text-stone-400">You got <b>{{ correctCount }}</b> of <b>{{ answeredCount }}</b> right.</p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <RouterLink :to="`/${exam.id}/topic/${topic.slug}`" class="btn-ghost"><Icon name="arrow-left" :size="16" /> Topic</RouterLink>
        <a :href="`/${exam.id}/topic/${topic.slug}/quiz`" class="btn-primary"><Icon name="rotate" :size="16" /> New quiz</a>
        <a v-if="correctCount < answeredCount" :href="`/${exam.id}/topic/${topic.slug}/quiz?mode=missed`" class="btn-ghost"><Icon name="target" :size="16" /> Retry missed</a>
      </div>
    </section>
    <section class="card divide-y divide-stone-200/70 overflow-hidden dark:divide-white/5">
      <div v-for="(q, i) in questions.filter((q) => revealed[q.id])" :key="q.id">
        <button class="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-stone-50 dark:hover:bg-white/[0.03]" @click="reviewOpen = reviewOpen === q.id ? null : q.id">
          <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white" :class="isCorrect(q, responses[q.id]) ? 'bg-emerald-500' : 'bg-rose-500'">
            <Icon :name="isCorrect(q, responses[q.id]) ? 'check' : 'x'" :size="14" :stroke="3" />
          </span>
          <span class="line-clamp-1 flex-1 text-sm">{{ q.stem }}</span>
          <Icon :name="reviewOpen === q.id ? 'chevron-up' : 'chevron-down'" :size="18" class="text-stone-400" />
        </button>
        <div v-if="reviewOpen === q.id" class="border-t border-stone-100 p-5 dark:border-white/5">
          <QuestionCard :question="q" :model-value="responses[q.id]" revealed :seed="seed" :number="i + 1" />
        </div>
      </div>
    </section>
  </div>

  <!-- in progress -->
  <div v-else class="mx-auto max-w-3xl">
    <div class="mb-6 flex items-center gap-4">
      <RouterLink :to="`/${exam.id}/topic/${topic.slug}`" class="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-stone-500 hover:bg-stone-200/60 dark:hover:bg-white/10" aria-label="Exit quiz">
        <Icon name="x" :size="20" />
      </RouterLink>
      <div class="flex-1">
        <div class="flex justify-between text-xs font-semibold text-stone-500">
          <span>{{ topic.short }}</span>
          <span class="font-mono">{{ idx + 1 }} / {{ questions.length }}</span>
        </div>
        <div class="mt-1.5 flex h-2 gap-1">
          <div
            v-for="(q, i) in questions"
            :key="q.id"
            class="flex-1 rounded-full transition-colors duration-500"
            :class="revealed[q.id] ? (isCorrect(q, responses[q.id]) ? 'bg-emerald-500' : 'bg-rose-500') : i === idx ? 'bg-maroon-400' : 'bg-stone-200 dark:bg-white/10'"
          ></div>
        </div>
      </div>
      <span class="chip bg-emerald-100 font-mono text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">{{ correctCount }}/{{ answeredCount }}</span>
    </div>

    <Transition name="fade" mode="out-in">
      <section :key="current.id" class="card p-6 sm:p-8" :class="revealed[current.id] && !isCorrect(current, responses[current.id]) ? 'animate-shake' : ''">
        <QuestionCard ref="card" v-model="responses[current.id]" :question="current" :revealed="!!revealed[current.id]" :seed="seed" :number="idx + 1" />
      </section>
    </Transition>

    <div class="sticky bottom-4 z-10 mt-6 flex items-center justify-between gap-3 rounded-2xl border border-stone-200/70 bg-white/80 p-3 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#161112]/85">
      <p class="hidden pl-2 text-xs text-stone-500 sm:block"><span class="kbd">1</span>–<span class="kbd">6</span> select · <span class="kbd">Enter</span> {{ revealed[current.id] ? 'next' : 'check' }}</p>
      <div class="ml-auto flex gap-2">
        <button v-if="!revealed[current.id] && answeredCount > 0" class="btn-ghost" @click="finish">End quiz</button>
        <button v-if="!revealed[current.id]" class="btn-primary min-w-36" :disabled="!canCheck" @click="check">Check answer</button>
        <button v-else class="btn-primary min-w-36" @click="next">
          {{ idx < questions.length - 1 ? 'Next question' : 'See results' }} <Icon name="arrow-right" :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>
