<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <Toaster position="bottom-right" theme="dark" rich-colors />
  </ClientOnly>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const Toaster = defineAsyncComponent(() => import('vue-sonner').then(m => m.Toaster))
</script>
