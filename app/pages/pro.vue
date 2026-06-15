<template>
  <div class="flex h-full flex-col items-center justify-center gap-4 bg-[var(--color-surface)] px-4">
    <div class="w-full max-w-sm p-6 bg-[var(--color-surface-3)] border-strong rounded-2xl text-center">
      <h1 class="text-lg font-medium text-[var(--color-text)]">Ongoing Access</h1>
      <p class="mt-2 text-sm text-[var(--color-text-muted)]">
        Watermark-free exports and URL screenshot capture, all the time — no need to renew a 3-Day Pass.
      </p>
      <div class="mt-4 text-2xl font-semibold text-[var(--color-text)]">$14.99<span class="text-sm font-normal text-[var(--color-text-muted)]">/mo</span></div>
      <button
        class="mt-5 flex h-9 w-full items-center justify-center gap-1.5 rounded-[6px] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-on-accent)] transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] disabled:opacity-50"
        :disabled="checkoutLoading"
        @click="startCheckout('pro')"
      >
        <Loader2Icon v-if="checkoutLoading" class="size-3.5 shrink-0 animate-spin" />
        {{ checkoutLoading ? 'Redirecting to Lemon Squeezy…' : 'Subscribe' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCheckout } from '~/composables/useCheckout'
import { Loader2Icon } from 'lucide-vue-next'

useHead({ title: 'Ongoing Access — Snipfolio' })
definePageMeta({ layout: 'default', middleware: [] })

const { startCheckout, loading: checkoutLoading } = useCheckout()
</script>
