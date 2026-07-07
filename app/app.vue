<template>
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
</script>
