<template>
  <div class="flex h-full items-center justify-center bg-[var(--color-surface)]">
    <div class="text-sm text-[var(--color-text-muted)]">{{ status }}</div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: [] })

const status = ref('Verifying…')
const route = useRoute()

onMounted(async () => {
  const supabase = useSupabaseClient()
  const token_hash = route.query.token_hash as string
  const type = route.query.type as string

  if (!token_hash || !type) {
    status.value = 'Invalid link.'
    return
  }

  const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })

  if (error) {
    status.value = 'Link expired or invalid. Please request a new one.'
    return
  }

  await navigateTo('/reset-password')
})
</script>
