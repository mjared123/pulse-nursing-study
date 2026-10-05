<script setup>
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <div class="relative min-h-screen overflow-x-clip">
    <div class="pointer-events-none fixed inset-0 -z-10">
      <div class="grid-bg absolute inset-0"></div>
      <div class="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-maroon-500/15 blur-[120px] dark:bg-maroon-600/20"></div>
      <div class="absolute top-[40%] -right-40 h-[400px] w-[400px] rounded-full bg-amber-400/10 blur-[120px] dark:bg-amber-500/5"></div>
    </div>
    <AppHeader />
    <main class="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">
      <RouterView v-slot="{ Component, route }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
    <footer class="border-t border-stone-200/70 py-8 text-center text-xs text-stone-500 dark:border-white/5 dark:text-stone-500">
      Built for MSU nursing students. Practice questions are study aids written from the course blueprint, not actual exam items.
      <br />Your progress is saved in this browser only.
    </footer>
  </div>
</template>
