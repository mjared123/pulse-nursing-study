import { createApp } from 'vue'
import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'
import App from './App.vue'
import { router } from './router'
import './style.css'

// Vercel Web Analytics + Speed Insights: anonymous page views only, no custom events.
// The injected script also records client-side route changes. Skipped in the sandboxed preview build.
if (!import.meta.env.VITE_MEMORY_ROUTER) {
  inject({ framework: 'vue' })
  injectSpeedInsights({ framework: 'vue' })
}

createApp(App).use(router).mount('#app')
