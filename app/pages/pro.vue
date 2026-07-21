<template>
  <div class="relative flex h-full flex-col items-center justify-center gap-4 bg-[var(--color-surface)] px-4">
    <NuxtLink
      to="/projects"
      class="absolute left-4 top-4 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
    >
      <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Projects
    </NuxtLink>
    <div class="w-full max-w-sm p-6 bg-[var(--color-surface-3)] border-strong rounded-2xl text-center">
      <h1 class="text-lg font-medium text-[var(--color-text)]">Ongoing Access</h1>
      <p class="mt-2 text-sm text-[var(--color-text-muted)]">
        Watermark-free exports and URL screenshot capture, all the time — no need to renew a 7-Day Pass.
      </p>
      <div class="mt-4 text-2xl font-semibold text-[var(--color-text)]">$14.99<span class="text-sm font-normal text-[var(--color-text-muted)]">/mo</span></div>
      <AppButton size="lg" class="mt-5 w-full" :disabled="checkoutLoading" @click="startCheckout('pro')">
        <Loader2Icon v-if="checkoutLoading" class="size-3.5 shrink-0 animate-spin" />
        {{ checkoutLoading ? 'Redirecting to Lemon Squeezy…' : 'Subscribe' }}
      </AppButton>
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
