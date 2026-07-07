<template>
  <button
    type="button"
    class="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:bg-overlay/8 hover:text-[var(--color-text)] border-strong"
    :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggleTheme"
  >
    <SunIcon v-if="theme === 'dark'" class="size-4" />
    <MoonIcon v-else class="size-4" />
  </button>
</template>

<script setup lang="ts">
import { SunIcon, MoonIcon } from 'lucide-vue-next'
import { useTheme } from '~/composables/useTheme'

const { theme, toggleTheme } = useTheme()
</script>
