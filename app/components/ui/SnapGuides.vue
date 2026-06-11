<template>
  <div class="pointer-events-none absolute inset-0 overflow-visible">
    <div
      v-for="x in vertical"
      :key="'v' + x"
      class="absolute top-0 bottom-0 w-px bg-pink-500"
      :style="{ left: `${x}px` }"
    />
    <div
      v-for="y in horizontal"
      :key="'h' + y"
      class="absolute left-0 right-0 h-px bg-pink-500"
      :style="{ top: `${y}px` }"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  vertical: number[]
  horizontal: number[]
}>()
</script>
