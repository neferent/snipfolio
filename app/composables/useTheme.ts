export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'sf-theme'
const theme = ref<Theme>('light')
let initialized = false

function applyTheme(t: Theme) {
  const root = document.documentElement
  root.classList.add('theme-transition')
  root.classList.toggle('dark', t === 'dark')
  window.setTimeout(() => root.classList.remove('theme-transition'), 200)
}

export function useTheme() {
  if (!initialized && import.meta.client) {
    initialized = true
    theme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  }

  function setTheme(t: Theme) {
    theme.value = t
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, t)
      applyTheme(t)
    }
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggleTheme }
}
