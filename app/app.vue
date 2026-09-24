<template>
  <!-- Dev-mode banner: electron:dev serves this app from a different local
       origin (localhost:3000, for hot-reload) than the real app
       (localhost:45677) — they have completely separate, non-shared
       localStorage/IndexedDB. Anything created here is throwaway test data,
       not your real projects. import.meta.dev is a build-time flag (true
       only under `nuxt dev`), so this never ships in the actual app. -->
  <div
    v-if="isDevMode"
    class="fixed inset-x-0 top-0 z-[999] flex h-5 items-center justify-center bg-amber-500 text-[10px] font-medium text-black"
  >
    DEV MODE — test data only, separate from your real projects
  </div>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <Toaster :position="isMobile ? 'top-center' : 'bottom-right'" :theme="theme" rich-colors />
  </ClientOnly>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useTheme } from '~/composables/useTheme'

const Toaster = defineAsyncComponent(() => import('vue-sonner').then(m => m.Toaster))
const isMobile = useIsMobile()
const { theme } = useTheme()
const isDevMode = import.meta.dev
</script>
