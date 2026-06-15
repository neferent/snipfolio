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
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default', middleware: [] })

const { refreshProfile } = useAuth()
const authStore = useAuthStore()

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

onMounted(async () => {
  const returnTo = localStorage.getItem('snipfolio_checkout_return') ?? '/dashboard'
  const checkoutType = localStorage.getItem('snipfolio_checkout_type') ?? ''
  localStorage.removeItem('snipfolio_checkout_return')
  localStorage.removeItem('snipfolio_checkout_type')

  // The LemonSqueezy webhook that activates Pro/day-pass access runs
  // asynchronously and may not have landed yet when we get redirected here,
  // so poll briefly until the profile reflects the purchase.
  let activated = false
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await refreshProfile()
    } catch {
      // ignore transient errors and keep retrying
    }
    if (authStore.isPro || authStore.proExpiresAt) {
      activated = true
      break
    }
    await sleep(1500)
  }

  if (activated) {
    const label = checkoutType === 'day_pass' ? '3-Day Pass activated!' : 'Subscription activated!'
    const description = checkoutType === 'day_pass'
      ? 'Enjoy 3 days of full access.'
      : 'Enjoy watermark-free exports.'
    toast.success(label, { description })
  } else {
    toast.info('Purchase received', {
      description: 'Your access is being activated — this can take a minute. Refresh the page if it doesn\'t appear shortly.',
    })
  }

  await navigateTo(returnTo)
})
</script>
