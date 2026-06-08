<template>
  <div class="flex h-full flex-col items-center justify-center gap-4 bg-[var(--color-surface)]">
    <div class="text-2xl font-semibold text-[var(--color-text)]">You're all set!</div>
    <div class="text-sm text-[var(--color-text-muted)]">
      Your purchase was successful. Enjoy Snipfolio.
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from '~/composables/useToast'

definePageMeta({ layout: 'default', middleware: [] })

const { refreshProfile } = useAuth()

onMounted(async () => {
  const returnTo = localStorage.getItem('snipfolio_checkout_return') ?? '/dashboard'
  const checkoutType = localStorage.getItem('snipfolio_checkout_type') ?? ''
  localStorage.removeItem('snipfolio_checkout_return')
  localStorage.removeItem('snipfolio_checkout_type')

  await refreshProfile()

  const label = checkoutType === 'day_pass' ? 'Day pass activated!' : 'Pro activated!'
  toast.success(label, { description: 'Enjoy watermark-free exports.' })

  await navigateTo(returnTo)
})
</script>
