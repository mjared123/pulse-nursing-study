<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../components/Icon.vue'
import NotFound from './NotFound.vue'
import { getExam, getTopic } from '../data'
import { markReviewed, touch } from '../lib/storage'
import { topicStatus, sectionNumber, quizLength } from '../lib/progress'

const props = defineProps({ examId: String, slug: String })
const router = useRouter()
const exam = computed(() => getExam(props.examId))
const topic = computed(() => getTopic(exam.value, props.slug))
const review = computed(() => topic.value?.review)
const num = computed(() => sectionNumber(exam.value, topic.value))
const status = computed(() => topicStatus(exam.value, topic.value))
const quizLen = computed(() => quizLength(exam.value, topic.value))
const group = computed(() => exam.value.groups.find((g) => g.id === topic.value.group))

const blocks = computed(() => (review.value?.blocks ?? []).map((b, i) => ({ ...b, key: i })))
const headings = computed(() => blocks.value.filter((b) => b.type === 'heading'))
const cueCount = computed(() => blocks.value.filter((b) => b.type === 'cue').length)

// Cue answers start hidden so students try to recall them first (the guide's "cover the right side").
const shown = reactive({})
const showAll = ref(false)
const shownCount = computed(() => (showAll.value ? cueCount.value : Object.values(shown).filter(Boolean).length))
const isShown = (k) => showAll.value || shown[k]
function toggle(k) {
  if (showAll.value) {
    showAll.value = false
    for (const b of blocks.value) if (b.type === 'cue') shown[b.key] = b.key !== k
  } else shown[k] = !shown[k]
}
function toggleAll() {
  showAll.value = !showAll.value
  for (const k of Object.keys(shown)) delete shown[k]
}
watch(
  () => props.slug,
  () => {
    showAll.value = false
    for (const k of Object.keys(shown)) delete shown[k]
  }
)
const jump = (k) => document.getElementById(`r-${k}`)?.scrollIntoView({ behavior: 'smooth' })

const TONES = {
  exam: { icon: 'star', label: 'Exam connection', box: 'border-amber-300/70 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-400/[0.06]', ink: 'text-amber-700 dark:text-amber-300' },
  alert: { icon: 'alert', label: 'Red flag', box: 'border-rose-300/70 bg-rose-50/80 dark:border-rose-400/20 dark:bg-rose-500/[0.07]', ink: 'text-rose-700 dark:text-rose-300' },
  conflict: { icon: 'scale', label: 'Book conflict', box: 'border-orange-300/70 bg-orange-50/80 dark:border-orange-400/20 dark:bg-orange-500/[0.06]', ink: 'text-orange-700 dark:text-orange-300' },
  nurse: { icon: 'stethoscope', label: 'What the nurse does', box: 'border-sky-300/70 bg-sky-50/80 dark:border-sky-400/20 dark:bg-sky-500/[0.06]', ink: 'text-sky-700 dark:text-sky-300' },
  memory: { icon: 'lightbulb', label: 'Memory aid', box: 'border-violet-300/70 bg-violet-50/80 dark:border-violet-400/20 dark:bg-violet-500/[0.06]', ink: 'text-violet-700 dark:text-violet-300' },
  key: { icon: 'check', label: 'Key points', box: 'border-emerald-300/70 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-500/[0.06]', ink: 'text-emerald-700 dark:text-emerald-300' },
}

const neighbors = computed(() => {
  const i = exam.value.topics.findIndex((t) => t.slug === props.slug)
  return { prev: exam.value.topics[i - 1], next: exam.value.topics[i + 1] }
})
const linkFor = (t) => `/${exam.value.id}/topic/${t.slug}${t.review ? '/learn' : ''}`

// Reading progress, and the review counts as read once the end of the page scrolls into view.
const readPct = ref(0)
const end = ref(null)
let observer
function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  readPct.value = max > 0 ? Math.min(1, window.scrollY / max) : 1
}
onMounted(() => {
  if (exam.value) touch(exam.value.id)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting) && topic.value?.review) markReviewed(exam.value.id, topic.value.slug)
  })
  watch(end, (el, old) => {
    if (old) observer.unobserve(old)
    if (el) observer.observe(el)
  }, { immediate: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  observer?.disconnect()
})

function startQuiz() {
  markReviewed(exam.value.id, topic.value.slug)
  router.push(`/${exam.value.id}/topic/${topic.value.slug}/quiz${status.value.inProgress ? '?resume=1' : ''}`)
}
</script>

<template>
  <NotFound v-if="!exam || !topic || !review" />
  <div v-else class="space-y-8">
    <div class="fixed inset-x-0 top-16 z-30 h-0.5 bg-transparent">
      <div class="h-full bg-gradient-to-r from-maroon-600 to-amber-500 transition-[width] duration-150" :style="{ width: readPct * 100 + '%' }"></div>
    </div>

    <RouterLink :to="`/${exam.id}`" class="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-maroon-700 dark:hover:text-maroon-300">
      <Icon name="arrow-left" :size="16" /> Unit {{ exam.unit }} sections
    </RouterLink>

    <!-- header -->
    <section class="card relative overflow-hidden p-7 sm:p-10 animate-rise">
      <div class="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl"></div>
      <div class="relative">
        <p class="eyebrow">Section {{ num }} · Study guide<span v-if="review.pages"> · {{ review.pages }}</span></p>
        <h1 class="mt-2 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">{{ topic.title }}</h1>
        <p v-if="group" class="mt-2 text-sm font-semibold text-stone-500">{{ group.title }}</p>
        <div v-if="review.bigIdea" class="mt-6 flex max-w-3xl gap-4 rounded-2xl bg-stone-100/80 p-5 dark:bg-white/[0.04]">
          <Icon name="lightbulb" :size="22" class="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p class="text-xs font-bold tracking-[0.14em] text-stone-500 uppercase">The big question</p>
            <p class="mt-1 text-lg leading-relaxed font-medium text-pretty">{{ review.bigIdea }}</p>
          </div>
        </div>

        <!-- the two steps of a section -->
        <ol class="mt-7 grid gap-3 sm:grid-cols-2">
          <li class="flex items-center gap-3 rounded-2xl border-2 border-maroon-500/70 bg-maroon-50/70 p-4 dark:bg-maroon-500/[0.08]">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white" :class="status.reviewed ? 'bg-emerald-500' : 'bg-maroon-600'">
              <Icon v-if="status.reviewed" name="check" :size="16" :stroke="3" /><Icon v-else name="book-open" :size="16" />
            </span>
            <div class="min-w-0">
              <p class="text-xs font-bold tracking-[0.14em] text-maroon-700 uppercase dark:text-maroon-300">Step 1 · You are here</p>
              <p class="font-semibold">Review the study guide</p>
            </div>
          </li>
          <li>
            <button class="flex w-full items-center gap-3 rounded-2xl border-2 border-stone-200 p-4 text-left transition hover:border-maroon-300 hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/[0.03]" @click="startQuiz">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full" :class="status.quizDone ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-600 dark:bg-white/10 dark:text-stone-300'">
                <Icon v-if="status.quizDone" name="check" :size="16" :stroke="3" /><Icon v-else name="play" :size="14" />
              </span>
              <div class="min-w-0">
                <p class="text-xs font-bold tracking-[0.14em] text-stone-500 uppercase">Step 2</p>
                <p class="font-semibold">Section quiz · {{ quizLen }} questions</p>
              </div>
              <Icon name="arrow-right" :size="18" class="ml-auto text-stone-400" />
            </button>
          </li>
        </ol>
      </div>
    </section>

    <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <article class="min-w-0 space-y-6">
        <!-- objectives -->
        <section v-if="review.objectives?.length" class="card p-6 sm:p-7">
          <p class="eyebrow">Learning objectives</p>
          <h2 class="mt-1 font-display text-2xl font-bold">After this section you can…</h2>
          <ul class="mt-4 space-y-2">
            <li v-for="o in review.objectives" :key="o" class="flex gap-2.5 text-stone-700 dark:text-stone-300">
              <Icon name="target" :size="17" class="mt-0.5 shrink-0 text-maroon-500" />{{ o }}
            </li>
          </ul>
        </section>

        <!-- recall toolbar -->
        <div v-if="cueCount" class="sticky top-20 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#171213]/90">
          <Icon name="eye" :size="18" class="shrink-0 text-maroon-600 dark:text-maroon-300" />
          <p class="min-w-0 flex-1 text-sm text-stone-600 dark:text-stone-400">
            <b class="text-stone-800 dark:text-stone-200">Answer out loud first,</b> then tap to check. {{ shownCount }}/{{ cueCount }} revealed.
          </p>
          <button class="btn-ghost px-3 py-1.5 text-sm" @click="toggleAll">
            {{ showAll ? 'Hide answers' : 'Show all answers' }}
          </button>
        </div>

        <!-- content blocks -->
        <template v-for="b in blocks" :key="b.key">
          <h2 v-if="b.type === 'heading'" :id="`r-${b.key}`" class="scroll-mt-40 pt-6 font-display text-3xl font-bold tracking-tight first:pt-0">
            {{ b.text }}
            <span v-if="b.pages" class="ml-2 align-middle font-mono text-xs font-semibold text-stone-400">{{ b.pages }}</span>
          </h2>

          <p v-else-if="b.type === 'text'" class="text-lg leading-relaxed text-stone-700 dark:text-stone-300">{{ b.text }}</p>

          <div v-else-if="b.type === 'cue'" class="card overflow-hidden">
            <button class="flex w-full items-start gap-3 p-4 text-left transition hover:bg-stone-50 sm:p-5 dark:hover:bg-white/[0.03]" :aria-expanded="!!isShown(b.key)" @click="toggle(b.key)">
              <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-maroon-100 font-display text-sm font-bold text-maroon-700 dark:bg-maroon-500/15 dark:text-maroon-200">?</span>
              <span class="flex-1 pt-0.5 font-semibold text-pretty">{{ b.q }}</span>
              <span class="hidden shrink-0 items-center gap-1 pt-0.5 text-xs font-semibold text-stone-400 sm:flex">
                {{ isShown(b.key) ? 'Hide' : 'Show answer' }}<Icon :name="isShown(b.key) ? 'chevron-up' : 'chevron-down'" :size="15" />
              </span>
            </button>
            <div v-if="isShown(b.key)" class="border-t border-stone-100 bg-stone-50/60 px-4 py-4 pl-14 leading-relaxed whitespace-pre-line text-stone-700 sm:px-5 sm:pl-15 dark:border-white/5 dark:bg-white/[0.02] dark:text-stone-300 animate-rise">{{ b.a }}</div>
          </div>

          <div v-else-if="b.type === 'timeline'" class="card p-5 sm:p-6">
            <p v-if="b.title" class="mb-4 font-bold">{{ b.title }}</p>
            <ol class="relative ml-2 space-y-4 border-l-2 border-stone-200 dark:border-white/10">
              <li v-for="(it, j) in b.items" :key="j" class="relative pl-6">
                <span class="absolute top-1.5 -left-[7px] h-3 w-3 rounded-full" :class="it.star ? 'bg-amber-400 ring-4 ring-amber-100 dark:ring-amber-400/20' : 'bg-maroon-500'"></span>
                <p class="flex flex-wrap items-center gap-2 font-mono text-sm font-bold text-maroon-700 dark:text-maroon-300">
                  {{ it.year }}
                  <span v-if="it.star" class="chip bg-amber-100 font-sans text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"><Icon name="star" :size="11" /> Most testable</span>
                </p>
                <p class="mt-0.5 text-stone-700 dark:text-stone-300">{{ it.text }}</p>
              </li>
            </ol>
          </div>

          <div v-else-if="b.type === 'list'" class="card p-5 sm:p-6">
            <p v-if="b.title" class="mb-3 font-bold">{{ b.title }}</p>
            <ol class="space-y-2">
              <li v-for="(it, j) in b.items" :key="j" class="flex gap-3 leading-relaxed text-stone-700 dark:text-stone-300">
                <span v-if="b.ordered" class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stone-100 font-mono text-[11px] font-bold text-stone-600 dark:bg-white/5 dark:text-stone-300">{{ j + 1 }}</span>
                <span v-else class="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-maroon-500"></span>
                <span class="whitespace-pre-line">{{ it }}</span>
              </li>
            </ol>
          </div>

          <div v-else-if="b.type === 'table'" class="card overflow-hidden">
            <p v-if="b.title" class="border-b border-stone-200/70 px-5 py-3 font-bold dark:border-white/5">{{ b.title }}</p>
            <div class="overflow-x-auto">
              <table class="w-full min-w-[32rem] text-left text-sm">
                <thead class="bg-stone-50 text-xs tracking-wide text-stone-500 uppercase dark:bg-white/[0.03]">
                  <tr><th v-for="(c, j) in b.columns" :key="j" class="px-4 py-2.5 font-bold">{{ c }}</th></tr>
                </thead>
                <tbody class="divide-y divide-stone-200/70 dark:divide-white/5">
                  <tr v-for="(row, j) in b.rows" :key="j">
                    <td v-for="(cell, k) in row" :key="k" class="px-4 py-3 align-top leading-relaxed whitespace-pre-line" :class="k === 0 ? 'font-semibold text-stone-900 dark:text-stone-100' : 'text-stone-700 dark:text-stone-300'">{{ cell }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else-if="b.type === 'mnemonic'" class="card p-5 sm:p-6">
            <p class="mb-4 flex items-center gap-2 font-bold"><Icon name="lightbulb" :size="17" class="text-violet-500" />{{ b.title }}</p>
            <ol class="space-y-2.5">
              <li v-for="(l, j) in b.letters" :key="j" class="flex items-start gap-3">
                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-maroon-600 font-display text-lg font-bold text-white shadow-sm">{{ l.letter }}</span>
                <p class="pt-1 leading-relaxed text-stone-700 dark:text-stone-300"><b class="text-stone-900 dark:text-stone-100">{{ l.word }}</b><span v-if="l.text">: {{ l.text }}</span></p>
              </li>
            </ol>
          </div>

          <aside v-else-if="b.type === 'callout'" class="rounded-2xl border p-5" :class="(TONES[b.tone] ?? TONES.exam).box">
            <p class="flex items-center gap-2 text-xs font-bold tracking-[0.14em] uppercase" :class="(TONES[b.tone] ?? TONES.exam).ink">
              <Icon :name="(TONES[b.tone] ?? TONES.exam).icon" :size="15" />{{ b.title || (TONES[b.tone] ?? TONES.exam).label }}
            </p>
            <p class="mt-2 leading-relaxed whitespace-pre-line text-stone-800 dark:text-stone-200">{{ b.text }}</p>
          </aside>

          <div v-else-if="b.type === 'recall'" class="rounded-2xl border-2 border-dashed border-stone-300 p-5 dark:border-white/15">
            <p class="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-stone-500 uppercase"><Icon name="pencil" :size="14" /> Summarize from memory</p>
            <p class="mt-2 font-medium">{{ b.text.replace(/^summarize from memory:\s*/i, '') }}</p>
            <textarea rows="3" class="mt-3 w-full resize-y rounded-xl border border-stone-200 bg-white/70 p-3 text-sm outline-none focus:border-maroon-400 focus:ring-2 focus:ring-maroon-200 dark:border-white/10 dark:bg-white/[0.03] dark:focus:ring-maroon-500/20" placeholder="Write it in your own words, then check it against the cards above. (Not saved.)"></textarea>
          </div>
        </template>

        <!-- know these cold -->
        <section v-if="topic.keyPoints?.length" class="card p-6 sm:p-7">
          <p class="eyebrow">High-yield</p>
          <h2 class="mt-1 font-display text-2xl font-bold">Know these cold</h2>
          <ul class="mt-4 space-y-3">
            <li v-for="(k, i) in topic.keyPoints" :key="i" class="flex gap-3">
              <span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-100 font-mono text-[11px] font-bold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">{{ i + 1 }}</span>
              <span class="leading-relaxed text-stone-700 dark:text-stone-300">{{ k }}</span>
            </li>
          </ul>
        </section>

        <!-- end: on to the quiz -->
        <section ref="end" class="card relative overflow-hidden p-7 text-center sm:p-10">
          <div class="absolute -bottom-24 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-maroon-500/10 blur-3xl"></div>
          <div class="relative">
            <span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"><Icon name="check" :size="22" :stroke="3" /></span>
            <h2 class="mt-4 font-display text-3xl font-bold">Study guide reviewed</h2>
            <p class="mx-auto mt-2 max-w-md text-stone-600 dark:text-stone-400">Now test it. Finish the {{ quizLen }}-question quiz to complete section {{ num }}.</p>
            <div class="mt-6 flex flex-wrap justify-center gap-3">
              <button class="btn-primary px-6 py-3 text-base" @click="startQuiz">
                <Icon name="play" :size="16" /> {{ status.inProgress ? 'Resume the quiz' : 'Start the quiz' }}
              </button>
              <RouterLink :to="`/${exam.id}/topic/${topic.slug}`" class="btn-ghost px-5 py-3">Section overview</RouterLink>
            </div>
          </div>
        </section>

        <nav class="flex justify-between gap-4 text-sm font-semibold">
          <RouterLink v-if="neighbors.prev" :to="linkFor(neighbors.prev)" class="btn-ghost"><Icon name="arrow-left" :size="16" />{{ sectionNumber(exam, neighbors.prev) }} {{ neighbors.prev.short }}</RouterLink>
          <span v-else></span>
          <RouterLink v-if="neighbors.next" :to="linkFor(neighbors.next)" class="btn-ghost">{{ sectionNumber(exam, neighbors.next) }} {{ neighbors.next.short }}<Icon name="arrow-right" :size="16" /></RouterLink>
          <RouterLink v-else :to="`/${exam.id}#practice`" class="btn-ghost">Unit tests<Icon name="arrow-right" :size="16" /></RouterLink>
        </nav>
      </article>

      <!-- on this page -->
      <aside class="card hidden p-5 lg:sticky lg:top-24 lg:block">
        <p class="eyebrow">On this page</p>
        <ol class="mt-3 space-y-0.5 text-sm">
          <li v-for="h in headings" :key="h.key">
            <a :href="`#r-${h.key}`" class="block rounded-lg px-2 py-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-white" @click.prevent="jump(h.key)">{{ h.text }}</a>
          </li>
        </ol>
        <div class="mt-4 border-t border-stone-200/70 pt-4 dark:border-white/5">
          <div class="h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-white/5">
            <div class="h-full rounded-full bg-gradient-to-r from-maroon-600 to-amber-500" :style="{ width: (status.reviewed ? 100 : readPct * 100) + '%' }"></div>
          </div>
          <p class="mt-2 text-xs text-stone-500">{{ status.reviewed ? 'Reviewed' : `${Math.round(readPct * 100)}% read` }}</p>
          <button class="btn-primary mt-4 w-full py-2.5 text-sm" @click="startQuiz"><Icon name="play" :size="13" /> Go to quiz</button>
        </div>
      </aside>
    </div>
  </div>
</template>
