<template>
  <div class="bg-[var(--color-surface)] text-[var(--color-text)]">

    <!-- Nav -->
    <header class="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-sm">
      <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <NuxtLink to="/" class="flex items-center gap-3">
          <svg class="size-8" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="48" height="48" rx="12" ry="12" style="fill:var(--color-accent)"/>
            <rect x="8" y="7.82" width="17" height="24" rx="2.5" ry="2.5" style="fill:var(--color-brand-700)"/>
            <rect x="28.1" y="7.82" width="12" height="13" rx="2.5" ry="2.5" style="fill:var(--color-brand-700)"/>
            <rect x="28.1" y="23.82" width="12" height="16" rx="2.5" ry="2.5" style="fill:var(--color-brand-500)"/>
          </svg>
          <span class="text-base font-medium tracking-tight">
            snipfol<span class="text-[var(--color-accent)]">.io</span>
          </span>
        </NuxtLink>
        <div class="flex items-center gap-5">
          <NuxtLink
            v-if="!authStore.isAuthenticated"
            to="/login"
            class="marketing-sm hidden text-[var(--color-text-muted)] transition hover:text-[var(--color-text)] sm:block"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            v-if="authStore.isAuthenticated"
            to="/dashboard"
            class="btn-primary rounded-md bg-[var(--color-accent)] px-5 py-2.5 font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)]"
            style="color:var(--color-surface)"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            v-else
            to="/login"
            class="btn-primary rounded-md bg-[var(--color-accent)] px-5 py-2.5 font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)]"
            style="color:var(--color-surface)"
          >
            Get started free
          </NuxtLink>
        </div>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section class="mx-auto max-w-5xl px-4 pb-16 pt-20 text-center">
        <h1>Simple pricing</h1>
      </section>

      <!-- Pricing cards -->
      <section class="border-t border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <div class="mx-auto max-w-5xl px-4 py-20">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <!-- Free -->
            <div class="mk-card flex flex-col rounded-xl p-6">
              <div class="plan-name mb-1 font-medium text-[var(--color-text-muted)]">Free</div>
              <div class="plan-price mb-4 font-semibold">$0</div>
              <ul class="mb-6 space-y-2.5">
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Check class="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" :stroke-width="2" />
                  No account needed
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Check class="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" :stroke-width="2" />
                  Core snipping and composition
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Check class="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" :stroke-width="2" />
                  1 project
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Minus class="mt-0.5 size-4 shrink-0 text-[var(--color-text-muted)] opacity-40" :stroke-width="2" />
                  Watermarked exports
                </li>
              </ul>
              <NuxtLink
                to="/login"
                class="btn-ghost mk-border mt-auto flex h-10 w-full items-center justify-center rounded-md text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
              >
                Get started
              </NuxtLink>
            </div>

            <!-- Day pass -->
            <div class="mk-card flex flex-col rounded-xl p-6">
              <div class="plan-name mb-1 font-medium text-[var(--color-text-muted)]">Day pass</div>
              <div class="plan-price mb-1 font-semibold">$4.99</div>
              <div class="plan-note mb-4 text-[var(--color-text-muted)]">one-time, 24 hours</div>
              <ul class="mb-6 space-y-2.5">
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Check class="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" :stroke-width="2" />
                  Everything in Free
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Check class="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" :stroke-width="2" />
                  Clean exports for 1 project
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Check class="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" :stroke-width="2" />
                  No watermark, 24 hours
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Check class="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" :stroke-width="2" />
                  No subscription
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Minus class="mt-0.5 size-4 shrink-0 text-[var(--color-text-muted)] opacity-40" :stroke-width="2" />
                  Pro-only tools not included
                </li>
              </ul>
              <NuxtLink
                to="/login"
                class="btn-ghost mk-border mt-auto flex h-10 w-full items-center justify-center rounded-md text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)]"
              >
                Buy a day pass
              </NuxtLink>
            </div>

            <!-- Pro -->
            <div class="mk-card-accent flex flex-col rounded-xl p-6">
              <div class="mb-1 flex items-center gap-2">
                <span class="plan-name font-medium text-[var(--color-accent)]">Pro</span>
                <span
                  class="mock-caption rounded-sm px-1.5 py-0.5 font-medium"
                  style="background:var(--color-accent-dim);color:var(--color-accent)"
                >
                  Launch price
                </span>
              </div>
              <div class="plan-price mb-1 font-semibold">$9.99<span class="plan-price-unit font-normal text-[var(--color-text-muted)]">/mo</span></div>
              <div class="plan-note mb-4 text-[var(--color-text-muted)]">$14.99 after launch</div>
              <ul class="mb-6 space-y-2.5">
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Check class="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" :stroke-width="2" />
                  Everything in Free
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Check class="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" :stroke-width="2" />
                  No watermark on all exports
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Check class="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" :stroke-width="2" />
                  Unlimited projects
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Check class="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" :stroke-width="2" />
                  Higher storage limits
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Check class="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" :stroke-width="2" />
                  Priority support
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <Check class="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" :stroke-width="2" />
                  Early access to new features
                </li>
              </ul>
              <NuxtLink
                to="/login"
                class="btn-primary mt-auto flex h-10 w-full items-center justify-center rounded-md bg-[var(--color-accent)] font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)]"
                style="color:var(--color-surface)"
              >
                Get Pro
              </NuxtLink>
            </div>
          </div>

          <!-- Day pass callout -->
          <p class="mt-8 text-center text-sm text-[var(--color-text-muted)]">
            Not ready to subscribe? A day pass gives you clean exports for one project for 24 hours — no strings attached.
          </p>
        </div>
      </section>

      <!-- Comparison table -->
      <section class="border-t border-[var(--color-border)]">
        <div class="mx-auto max-w-3xl px-4 py-20">
          <h2 class="mb-10 text-center">What's included</h2>
          <div class="overflow-hidden rounded-xl mk-border">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  <th class="px-5 py-3.5 text-left font-medium text-[var(--color-text-muted)]">Feature</th>
                  <th class="px-4 py-3.5 text-center font-medium text-[var(--color-text-muted)]">Free</th>
                  <th class="px-4 py-3.5 text-center font-medium text-[var(--color-text-muted)]">Day pass</th>
                  <th class="px-4 py-3.5 text-center font-medium text-[var(--color-accent)]">Pro</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--color-border)]">
                <tr v-for="row in comparisonRows" :key="row.feature" class="bg-[var(--color-surface)]">
                  <td class="px-5 py-3.5 text-[var(--color-text-muted)]">{{ row.feature }}</td>
                  <td class="px-4 py-3.5 text-center">
                    <Check v-if="row.free === true" class="mx-auto size-4 text-[var(--color-accent)]" :stroke-width="2" />
                    <Minus v-else-if="row.free === false" class="mx-auto size-4 text-[var(--color-text-muted)] opacity-30" :stroke-width="2" />
                    <span v-else class="text-[var(--color-text-muted)]">{{ row.free }}</span>
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <Check v-if="row.dayPass === true" class="mx-auto size-4 text-[var(--color-accent)]" :stroke-width="2" />
                    <Minus v-else-if="row.dayPass === false" class="mx-auto size-4 text-[var(--color-text-muted)] opacity-30" :stroke-width="2" />
                    <span v-else class="text-[var(--color-text-muted)]">{{ row.dayPass }}</span>
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <Check v-if="row.pro === true" class="mx-auto size-4 text-[var(--color-accent)]" :stroke-width="2" />
                    <Minus v-else-if="row.pro === false" class="mx-auto size-4 text-[var(--color-text-muted)] opacity-30" :stroke-width="2" />
                    <span v-else class="text-[var(--color-text-muted)]">{{ row.pro }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="border-t border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <div class="mx-auto max-w-2xl px-4 py-20">
          <h2 class="mb-10 text-center">Questions</h2>
          <div class="space-y-2">
            <details
              v-for="item in faq"
              :key="item.q"
              class="mk-card-2 group rounded-xl"
            >
              <summary class="flex cursor-pointer list-none items-center justify-between px-5 py-4">
                {{ item.q }}
                <svg
                  class="size-4 shrink-0 text-[var(--color-text-muted)] transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div class="border-t border-[var(--color-border)] px-5 pb-4 pt-3 text-[var(--color-text-muted)]">
                {{ item.a }}
              </div>
            </details>
          </div>
        </div>
      </section>

      <!-- Footer CTA -->
      <section class="border-t border-[var(--color-border)]">
        <div class="mx-auto max-w-2xl px-4 py-20 text-center">
          <h2 class="mb-3">Start for free</h2>
          <p class="mb-8 text-[var(--color-text-muted)]">No install. No card required.</p>
          <NuxtLink
            to="/login"
            class="btn-primary inline-flex items-center rounded-lg bg-[var(--color-accent)] px-8 py-3.5 font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)]"
            style="color:var(--color-surface)"
          >
            Open Snipfolio
          </NuxtLink>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-[var(--color-border)]">
      <div class="mx-auto flex max-w-5xl flex-col items-start gap-6 px-4 pb-6 pt-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2.5">
            <svg class="size-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="48" height="48" rx="12" ry="12" style="fill:var(--color-accent)"/>
              <rect x="8" y="7.82" width="17" height="24" rx="2.5" ry="2.5" style="fill:var(--color-brand-700)"/>
              <rect x="28.1" y="7.82" width="12" height="13" rx="2.5" ry="2.5" style="fill:var(--color-brand-700)"/>
              <rect x="28.1" y="23.82" width="12" height="16" rx="2.5" ry="2.5" style="fill:var(--color-brand-500)"/>
            </svg>
            <span class="marketing-sm font-medium tracking-tight">
              snipfol<span class="text-[var(--color-accent)]">.io</span>
            </span>
          </div>
          <p class="marketing-sm mt-1.5 text-[var(--color-text-muted)]">Screenshot clipping and composition</p>
        </div>
        <nav class="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer navigation">
          <NuxtLink to="/#pricing" class="marketing-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Pricing</NuxtLink>
          <NuxtLink to="/#faq" class="marketing-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">FAQ</NuxtLink>
          <NuxtLink to="/login" class="marketing-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Sign in</NuxtLink>
        </nav>
      </div>
      <div class="mx-auto max-w-5xl border-t border-[var(--color-border)] px-4 py-4">
        <p class="marketing-sm text-[var(--color-text-muted)]">© {{ new Date().getFullYear() }} Snipfolio. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Check, Minus } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'landing', middleware: [] })

const authStore = useAuthStore()

useSeoMeta({
  title: 'Pricing — Snipfolio',
  description: 'Free to try. $4.99 day pass for clean exports with no watermark. $9.99/mo Pro for unlimited projects and priority support.',
  ogTitle: 'Snipfolio Pricing',
  ogDescription: 'Free to try. $4.99 day pass for clean exports. $9.99/mo Pro for unlimited projects.',
  ogType: 'website',
  ogUrl: 'https://snipfolio.com/pricing',
  ogSiteName: 'Snipfolio',
  ogImage: 'https://snipfolio.com/og-image.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
  twitterTitle: 'Snipfolio Pricing',
  twitterDescription: 'Free to try. $4.99 day pass for clean exports. $9.99/mo Pro for unlimited projects.',
  twitterImage: 'https://snipfolio.com/og-image.png',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://snipfolio.com/pricing' }],
})

const comparisonRows = [
  { feature: 'Snipping and composition', free: true, dayPass: true, pro: true },
  { feature: 'Device frames', free: true, dayPass: true, pro: true },
  { feature: 'Custom backgrounds', free: true, dayPass: true, pro: true },
  { feature: 'PNG export', free: true, dayPass: true, pro: true },
  { feature: 'Clean export (no watermark)', free: false, dayPass: '1 project, 24h', pro: true },
  { feature: 'Projects', free: '1', dayPass: '1', pro: 'Unlimited' },
  { feature: 'Cloud save', free: false, dayPass: false, pro: true },
  { feature: 'Pro-only tools (presets + more)', free: false, dayPass: false, pro: true },
  { feature: 'Priority support', free: false, dayPass: false, pro: true },
]

const faq = [
  {
    q: 'What is the difference between the day pass and Pro?',
    a: 'The day pass is a one-time purchase that lets you export one project without watermarks for 24 hours. Pro is a monthly subscription with no watermarks, unlimited projects, cloud save, and access to Pro-only features as they ship. If you just need a clean export once in a while, a day pass is probably the better pick.',
  },
  {
    q: 'Will the Pro price go up?',
    a: 'Yes. The current $9.99/mo is a launch price. It will rise to $14.99/mo when additional Pro features ship. Anyone subscribed at $9.99 is grandfathered at that rate permanently.',
  },
  {
    q: 'Do I need an account to use Snipfolio?',
    a: 'No. The free tier works without an account. You need to sign in to save projects across sessions or to buy a day pass or Pro subscription.',
  },
  {
    q: 'Is there a free trial for Pro?',
    a: 'Not a timed trial, but the free tier lets you use most features before paying. Note that some tools (like platform presets) are Pro-only and not included in the day pass. The free tier gives you a good sense of the core workflow.',
  },
  {
    q: 'Can I cancel Pro anytime?',
    a: 'Yes. Cancel anytime from your account settings. You keep Pro access until the end of the billing period.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'Credit and debit cards via Lemon Squeezy. Apple Pay and Google Pay are supported in compatible browsers.',
  },
]
</script>
