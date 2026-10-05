<script setup>
import { computed, ref, watch } from 'vue'
import Icon from './Icon.vue'
import EcgStrip from './EcgStrip.vue'
import { mulberry32, shuffle } from '../lib/rng'
import { isCorrect, sataBreakdown, typeLabel } from '../lib/grading'

const props = defineProps({
  question: { type: Object, required: true },
  modelValue: { default: null },
  revealed: { type: Boolean, default: false },
  seed: { type: String, default: () => String(Math.random()) },
  number: { type: Number, default: null },
  topicTitle: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const q = computed(() => props.question)
const LETTERS = 'ABCDEFGH'

const options = computed(() => (q.value.options ? shuffle(q.value.options, mulberry32(props.seed + q.value.id)) : []))

// ordered response keeps its own working order until the student moves something
const working = ref([])
watch(
  () => [q.value.id, props.seed],
  () => {
    if (q.value.type !== 'order') return
    const start = Array.isArray(props.modelValue) ? props.modelValue : shuffle(q.value.items, mulberry32(props.seed + q.value.id)).map((i) => i.id)
    working.value = [...start]
  },
  { immediate: true }
)
const itemById = (id) => q.value.items.find((i) => i.id === id)

function choose(id) {
  if (props.revealed) return
  if (q.value.type === 'single') emit('update:modelValue', id)
  else {
    const cur = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const i = cur.indexOf(id)
    i >= 0 ? cur.splice(i, 1) : cur.push(id)
    emit('update:modelValue', cur)
  }
}
const selected = (id) => (q.value.type === 'single' ? props.modelValue === id : Array.isArray(props.modelValue) && props.modelValue.includes(id))

function move(i, dir) {
  if (props.revealed) return
  const j = i + dir
  if (j < 0 || j >= working.value.length) return
  const a = [...working.value]
  ;[a[i], a[j]] = [a[j], a[i]]
  working.value = a
  emit('update:modelValue', a)
}
let dragFrom = null
function onDrop(i) {
  if (dragFrom == null || props.revealed) return
  const a = [...working.value]
  const [it] = a.splice(dragFrom, 1)
  a.splice(i, 0, it)
  working.value = a
  dragFrom = null
  emit('update:modelValue', a)
}
function lockOrder() {
  emit('update:modelValue', [...working.value])
}

defineExpose({
  get qid() {
    return q.value.id
  },
  pressKey(k) {
    const n = Number(k)
    if (n >= 1 && n <= options.value.length) choose(options.value[n - 1].id)
  },
  ensureOrder() {
    if (q.value.type === 'order' && !Array.isArray(props.modelValue)) lockOrder()
  },
})

const correct = computed(() => isCorrect(q.value, props.modelValue))
const sata = computed(() => (q.value.type === 'sata' ? sataBreakdown(q.value, props.modelValue ?? []) : null))

function optionState(o) {
  if (!props.revealed) return selected(o.id) ? 'selected' : 'idle'
  if (o.correct && selected(o.id)) return 'hit'
  if (o.correct) return 'missed'
  if (selected(o.id)) return 'wrong'
  return 'neutral'
}
const optionClass = {
  idle: 'border-stone-200 bg-white hover:border-maroon-300 hover:bg-maroon-50/40 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-maroon-400/40 dark:hover:bg-maroon-500/5',
  selected: 'border-maroon-500 bg-maroon-50 ring-4 ring-maroon-500/10 dark:border-maroon-400 dark:bg-maroon-500/10',
  hit: 'border-emerald-500 bg-emerald-50 dark:border-emerald-400/70 dark:bg-emerald-500/10',
  missed: 'border-emerald-400 border-dashed bg-emerald-50/40 dark:border-emerald-400/50 dark:bg-emerald-500/5',
  wrong: 'border-rose-500 bg-rose-50 dark:border-rose-400/70 dark:bg-rose-500/10',
  neutral: 'border-stone-200 bg-white opacity-80 dark:border-white/10 dark:bg-white/[0.02]',
}
const badgeClass = {
  idle: 'border-stone-300 text-stone-500 dark:border-white/15 dark:text-stone-400',
  selected: 'border-maroon-600 bg-maroon-600 text-white',
  hit: 'border-emerald-500 bg-emerald-500 text-white',
  missed: 'border-emerald-500 text-emerald-600 dark:text-emerald-300',
  wrong: 'border-rose-500 bg-rose-500 text-white',
  neutral: 'border-stone-300 text-stone-400 dark:border-white/15',
}
const stateLabel = { hit: 'Correct · you chose this', missed: 'Correct answer', wrong: 'Incorrect · you chose this', neutral: 'Incorrect' }
</script>

<template>
  <article class="space-y-5">
    <div class="flex flex-wrap items-center gap-2">
      <span v-if="number" class="chip bg-stone-900 text-white dark:bg-white dark:text-stone-900">Q{{ number }}</span>
      <span class="chip bg-maroon-100 text-maroon-800 dark:bg-maroon-500/15 dark:text-maroon-200">{{ typeLabel(q.type) }}</span>
      <span v-if="topicTitle" class="chip bg-stone-100 text-stone-600 dark:bg-white/5 dark:text-stone-400">{{ topicTitle }}</span>
    </div>

    <EcgStrip v-if="q.ecg" :rhythm="q.ecg" :seed="q.id" />

    <h2 class="text-lg leading-relaxed font-semibold text-pretty sm:text-xl">{{ q.stem }}</h2>

    <!-- single & SATA -->
    <ul v-if="q.type === 'single' || q.type === 'sata'" class="space-y-3" :role="q.type === 'single' ? 'radiogroup' : 'group'">
      <li v-for="(o, i) in options" :key="o.id">
        <button
          type="button"
          :role="q.type === 'single' ? 'radio' : 'checkbox'"
          :aria-checked="selected(o.id)"
          class="group w-full rounded-2xl border-2 px-4 py-3.5 text-left transition duration-200"
          :class="[optionClass[optionState(o)], revealed ? 'cursor-default' : '']"
          @click="choose(o.id)"
        >
          <div class="flex items-start gap-3.5">
            <span
              class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center border-2 text-xs font-bold transition"
              :class="[badgeClass[optionState(o)], q.type === 'sata' ? 'rounded-lg' : 'rounded-full']"
            >
              <Icon v-if="['hit', 'missed'].includes(optionState(o))" name="check" :size="14" :stroke="3" />
              <Icon v-else-if="optionState(o) === 'wrong'" name="x" :size="14" :stroke="3" />
              <Icon v-else-if="q.type === 'sata' && selected(o.id)" name="check" :size="14" :stroke="3" />
              <template v-else>{{ LETTERS[i] }}</template>
            </span>
            <div class="min-w-0 flex-1">
              <p class="leading-relaxed">{{ o.text }}</p>
              <div v-if="revealed" class="mt-2.5 animate-rise">
                <p
                  class="text-[11px] font-bold tracking-wider uppercase"
                  :class="{ hit: 'text-emerald-700 dark:text-emerald-300', missed: 'text-emerald-700 dark:text-emerald-300', wrong: 'text-rose-700 dark:text-rose-300', neutral: 'text-stone-500' }[optionState(o)]"
                >
                  {{ stateLabel[optionState(o)] }}
                </p>
                <p class="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{{ o.rationale }}</p>
              </div>
            </div>
            <kbd v-if="!revealed && i < 9" class="kbd mt-1 hidden sm:inline">{{ i + 1 }}</kbd>
          </div>
        </button>
      </li>
    </ul>

    <!-- ordered response -->
    <div v-else-if="q.type === 'order'">
      <p v-if="!revealed" class="mb-3 text-sm text-stone-500 dark:text-stone-400">Drag the items, or use the arrows, so the first step is on top.</p>
      <ol class="space-y-2.5">
        <li
          v-for="(id, i) in working"
          :key="id"
          :draggable="!revealed"
          class="flex items-center gap-3 rounded-2xl border-2 bg-white px-3 py-3 transition dark:bg-white/[0.02]"
          :class="
            revealed
              ? q.items[i].id === id
                ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400/60 dark:bg-emerald-500/10'
                : 'border-rose-400 bg-rose-50 dark:border-rose-400/60 dark:bg-rose-500/10'
              : 'border-stone-200 hover:border-maroon-300 dark:border-white/10'
          "
          @dragstart="dragFrom = i"
          @dragover.prevent
          @drop="onDrop(i)"
        >
          <span v-if="!revealed" class="cursor-grab text-stone-400"><Icon name="grip" :size="18" /></span>
          <span class="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-stone-100 font-mono text-xs font-bold dark:bg-white/10">{{ i + 1 }}</span>
          <span class="flex-1 leading-relaxed">{{ itemById(id).text }}</span>
          <template v-if="!revealed">
            <button type="button" class="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-20 dark:hover:bg-white/10" :disabled="i === 0" aria-label="Move up" @click="move(i, -1)">
              <Icon name="chevron-up" :size="18" />
            </button>
            <button type="button" class="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-20 dark:hover:bg-white/10" :disabled="i === working.length - 1" aria-label="Move down" @click="move(i, 1)">
              <Icon name="chevron-down" :size="18" />
            </button>
          </template>
          <Icon v-else :name="q.items[i].id === id ? 'check' : 'x'" :size="18" :class="q.items[i].id === id ? 'text-emerald-600' : 'text-rose-500'" />
        </li>
      </ol>
      <button v-if="!revealed && !Array.isArray(modelValue)" type="button" class="mt-3 text-sm font-semibold text-maroon-700 hover:underline dark:text-maroon-300" @click="lockOrder">
        This order looks right as is
      </button>
      <div v-if="revealed && !correct" class="mt-5 animate-rise rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-400/20 dark:bg-emerald-500/5">
        <p class="text-[11px] font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">Correct order</p>
        <ol class="mt-2 list-decimal space-y-1 pl-5 text-sm text-stone-700 dark:text-stone-300">
          <li v-for="it in q.items" :key="it.id">{{ it.text }}</li>
        </ol>
      </div>
    </div>

    <!-- numeric -->
    <div v-else-if="q.type === 'numeric'">
      <label class="flex max-w-sm items-center gap-3 rounded-2xl border-2 bg-white px-4 py-3 transition focus-within:border-maroon-500 focus-within:ring-4 focus-within:ring-maroon-500/10 dark:bg-white/[0.02]"
        :class="revealed ? (correct ? 'border-emerald-500' : 'border-rose-500') : 'border-stone-200 dark:border-white/10'">
        <input
          type="number"
          step="any"
          inputmode="decimal"
          class="w-full bg-transparent font-mono text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0"
          :value="modelValue"
          :disabled="revealed"
          @input="emit('update:modelValue', $event.target.value)"
        />
        <span class="shrink-0 font-semibold text-stone-500">{{ q.unit }}</span>
      </label>
      <div v-if="revealed" class="mt-5 animate-rise rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <p class="text-sm">
          <span class="font-semibold">Correct answer:</span>
          <span class="ml-1 font-mono font-bold text-emerald-700 dark:text-emerald-300">{{ q.answer }} {{ q.unit }}</span>
          <span v-if="!correct && modelValue !== null && modelValue !== ''" class="ml-3 text-stone-500">You entered <span class="font-mono text-rose-600 dark:text-rose-400">{{ modelValue }}</span></span>
        </p>
        <ol class="mt-3 space-y-1.5 text-sm text-stone-600 dark:text-stone-300">
          <li v-for="(s, i) in q.steps" :key="i" class="flex gap-2.5"><span class="font-mono text-xs text-maroon-600 dark:text-maroon-300">{{ i + 1 }}</span><span>{{ s }}</span></li>
        </ol>
      </div>
    </div>

    <!-- verdict + takeaway -->
    <div v-if="revealed" class="animate-rise rounded-2xl p-5" :class="correct ? 'bg-emerald-500/10 ring-1 ring-emerald-500/25' : 'bg-rose-500/10 ring-1 ring-rose-500/25'">
      <div class="flex items-center gap-2.5">
        <span class="grid h-8 w-8 place-items-center rounded-full text-white" :class="correct ? 'bg-emerald-500' : 'bg-rose-500'">
          <Icon :name="correct ? 'check' : 'x'" :size="16" :stroke="3" />
        </span>
        <p class="font-bold" :class="correct ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'">
          {{ correct ? 'Correct!' : modelValue == null || modelValue === '' ? 'Not answered' : 'Not quite' }}
          <span v-if="sata && !correct" class="ml-1 font-medium opacity-80">
            · you found {{ sata.hits }} of {{ sata.total }} correct options<template v-if="sata.wrongPicks">, plus {{ sata.wrongPicks }} incorrect</template>
          </span>
        </p>
      </div>
      <div class="mt-3 flex gap-2.5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <Icon name="lightbulb" :size="18" class="mt-0.5 shrink-0 text-amber-500" />
        <p>{{ q.explanation }}</p>
      </div>
    </div>
  </article>
</template>
