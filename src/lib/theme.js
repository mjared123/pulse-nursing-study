import { ref } from 'vue'

export const dark = ref(document.documentElement.classList.contains('dark'))

export function toggleTheme() {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
  try {
    localStorage.setItem('pulse-theme', dark.value ? 'dark' : 'light')
  } catch (e) {}
}
