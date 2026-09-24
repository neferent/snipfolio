<template>
  <div />
</template>

<script setup lang="ts">
// Purely local app — no auth state to branch on, always land on the Studio.
await navigateTo('/dashboard', { replace: true })
</script>
