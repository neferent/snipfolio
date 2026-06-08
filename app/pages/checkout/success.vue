<template>
  <div class="flex h-full flex-col items-center justify-center gap-4 bg-[var(--color-surface)]">
    <div class="text-2xl font-semibold text-[var(--color-text)]">You're all set!</div>
    <div class="text-sm text-[var(--color-text-muted)]">
      Your purchase was successful. Enjoy Snipfolio.
    </div>
    <button
      class="mt-4 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      @click="goToDashboard"
    >
      Go to dashboard
    </button>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: [] })

const { refreshProfile } = useAuth()

onMounted(async () => {
  await refreshProfile()
})

async function goToDashboard() {
  await navigateTo('/dashboard')
}
</script>
