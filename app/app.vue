<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <div
    v-if="isLocalAuth"
    class="fixed bottom-3 right-3 z-50 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-black shadow-lg"
  >
    Local Auth
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const isLocalAuth = computed(() => config.public.authMode === 'local')
</script>
