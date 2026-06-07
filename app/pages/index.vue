<template>
  <div class="bg-[var(--color-surface)] text-[var(--color-text)]">

    <!-- Nav -->
    <header class="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-sm">
      <div class="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div class="flex items-center gap-3">
          <svg class="size-8" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="48" height="48" rx="12" ry="12" style="fill:var(--color-accent)"/>
            <rect x="8" y="7.82" width="17" height="24" rx="2.5" ry="2.5" style="fill:var(--color-brand-700)"/>
            <rect x="28.1" y="7.82" width="12" height="13" rx="2.5" ry="2.5" style="fill:var(--color-brand-700)"/>
            <rect x="28.1" y="23.82" width="12" height="16" rx="2.5" ry="2.5" style="fill:var(--color-brand-500)"/>
          </svg>
          <span class="text-base font-medium tracking-tight">
            snipfol<span class="text-[var(--color-accent)]">.io</span>
          </span>
        </div>
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
        <h1>
          Turn raw screenshots into<br class="hidden sm:block" />
          clean, shareable exports
        </h1>
        <p class="mx-auto mt-5 max-w-xl text-[var(--color-text-muted)]">
          Draw crop regions on any screenshot, pick a device frame, add a background, and export. Good for documentation, PRs, app store shots, and portfolio work.
        </p>
        <div class="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <NuxtLink
            to="/login"
            class="btn-primary mk-border w-full rounded-lg bg-[var(--color-accent)] px-7 py-3.5 font-medium transition hover:bg-[var(--color-accent-hover)] hover:text-[var(--color-text)] sm:w-auto"
            style="color:var(--color-surface)"
          >
            Get started free
          </NuxtLink>
          <a
            href="#how-it-works"
            class="btn-ghost mk-border w-full rounded-lg px-7 py-3.5 text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-[var(--color-text)] sm:w-auto"
          >
            See how it works
          </a>
        </div>

        <!-- Hero mockup: before/after split -->
        <div
          class="mx-auto mt-14 max-w-[780px] overflow-hidden rounded-xl mk-border"
          role="img"
          aria-label="Before: a cluttered browser screenshot with a 16:9 selection box drawn over a UI region. After: that region inside a desktop frame on a clean gradient background."
        >
          <div class="grid grid-cols-2 divide-x divide-[var(--color-border)]">
            <!-- Before: messy screenshot -->
            <div class="flex flex-col bg-[var(--color-surface-2)] p-4">
              <div class="mb-3 flex items-center gap-1.5">
                <div class="size-2.5 rounded-full bg-red-400/50" />
                <div class="size-2.5 rounded-full bg-yellow-400/50" />
                <div class="size-2.5 rounded-full bg-green-400/50" />
                <div class="ml-2 h-4 flex-1 rounded-sm bg-[var(--color-surface-4)] px-2" />
              </div>
              <div class="space-y-2">
                <div class="flex gap-2">
                  <div class="h-3 w-1/2 rounded-sm bg-[var(--color-surface-4)]" />
                  <div class="h-3 w-1/4 rounded-sm bg-[var(--color-surface-4)]" />
                </div>
                <div class="h-3 w-3/4 rounded-sm bg-[var(--color-surface-3)]" />
                <!-- 16:9 snip region -->
                <div class="mk-selection-box relative aspect-video rounded-sm">
                  <div class="absolute inset-2 flex flex-col gap-1.5">
                    <div class="h-[55%] rounded-sm bg-[var(--color-surface-4)]" />
                    <div class="h-[15%] w-2/3 rounded-sm bg-[var(--color-surface-4)]" />
                  </div>
                  <div class="absolute -left-1 -top-1 size-2 rounded-sm bg-red-400/70" />
                  <div class="absolute -right-1 -top-1 size-2 rounded-sm bg-red-400/70" />
                  <div class="absolute -bottom-1 -left-1 size-2 rounded-sm bg-red-400/70" />
                  <div class="absolute -bottom-1 -right-1 size-2 rounded-sm bg-red-400/70" />
                </div>
                <div class="h-3 w-full rounded-sm bg-[var(--color-surface-3)]" />
                <div class="h-3 w-3/4 rounded-sm bg-[var(--color-surface-3)]" />
              </div>
              <p class="mt-3 text-center text-xs text-[var(--color-text-muted)]">Before</p>
            </div>
            <!-- After: clean export -->
            <div class="flex flex-col items-center bg-gradient-to-br from-slate-700/40 to-slate-900/60 p-4">
              <div class="flex flex-1 w-full items-center justify-center">
                <div class="w-full max-w-[240px]">
                  <div class="mk-frame-body overflow-hidden rounded-md">
                    <div class="mk-frame-bezel flex items-center justify-center py-1">
                      <div class="size-1 rounded-full bg-white/20" />
                    </div>
                    <!-- 16:9 screen area -->
                    <div class="aspect-video bg-[var(--color-surface-3)] p-2">
                      <div class="h-[55%] rounded-sm bg-[var(--color-surface-4)]" />
                      <div class="mt-[5%] h-[15%] w-2/3 rounded-sm bg-[var(--color-surface-4)]" />
                    </div>
                  </div>
                  <div class="mk-frame-base h-2 rounded-b-md" style="width:110%;margin-left:-5%" />
                </div>
              </div>
              <p class="mt-3 text-center text-xs text-[var(--color-text-muted)]">After</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Problem -->
      <section class="border-t border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <div class="mx-auto max-w-2xl px-4 py-16 text-center">
          <p class="pullquote text-[var(--color-text-muted)]">
            You need to share a screenshot. Maybe it's a UI component, an error state, or a widget. You take a screenshot but it's much too wide and full of things that don't matter. So you crop it, frame it, fix the proportions, and export it. Then you realize you need to do it four more times...
          </p>
          <p class="pullquote-answer mt-5 text-[var(--color-text)]">
            Snipfolio skips all that.
          </p>
        </div>
      </section>

      <!-- How it works -->
      <section id="how-it-works" class="border-t border-[var(--color-border)]">
        <div class="mx-auto max-w-5xl px-4 py-20">
          <h2 class="mb-12 text-center">How it works</h2>

          <div class="space-y-20">
            <!-- Step 1 -->
            <div class="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
              <div class="flex-1">
                <div class="eyebrow mb-3 text-[var(--color-text-muted)]">Step 1</div>
                <h3 class="mb-3">Drop a screenshot</h3>
                <p class="text-[var(--color-text-muted)]">
                  Drag in any screenshot. Snipfolio reads the natural pixel dimensions so your crop coordinates stay accurate regardless of your screen resolution.
                </p>
              </div>
              <div
                class="mk-border w-full overflow-hidden rounded-xl sm:w-80"
                role="img"
                aria-label="A screenshot being dragged onto a drop zone with a dashed border"
              >
                <div class="bg-[var(--color-surface-2)] p-6">
                  <div class="mk-border-dashed flex flex-col items-center justify-center gap-3 rounded-lg py-10">
                    <div
                      class="mk-border mk-card rounded-md p-3 shadow-xl"
                      style="transform:rotate(-2deg)"
                    >
                      <div class="h-14 w-24 rounded-sm bg-[var(--color-surface-4)]" />
                      <div class="mt-1.5 h-1.5 w-3/4 rounded-sm bg-[var(--color-surface-4)]" />
                    </div>
                    <p class="mock-caption text-[var(--color-text-muted)]">Drop screenshot here</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="flex flex-col-reverse items-start gap-8 sm:flex-row sm:items-center">
              <div
                class="mk-border w-full overflow-hidden rounded-xl sm:w-80"
                role="img"
                aria-label="Screenshot canvas with two snip regions: a desktop-ratio snip with a green outline and Desktop label, and a mobile-ratio snip with a green outline and Mobile label"
              >
                <div class="bg-[var(--color-surface-2)] p-4">
                  <div class="relative h-[160px] overflow-hidden rounded-sm bg-[var(--color-surface-3)]">
                    <div class="absolute inset-0 grid grid-cols-3 gap-1.5 p-2 opacity-40">
                      <div class="rounded-sm bg-[var(--color-surface-4)]" />
                      <div class="col-span-2 rounded-sm bg-[var(--color-surface-4)]" />
                      <div class="col-span-2 rounded-sm bg-[var(--color-surface-4)]" />
                      <div class="rounded-sm bg-[var(--color-surface-4)]" />
                      <div class="col-span-3 rounded-sm bg-[var(--color-surface-4)]" />
                    </div>
                    <div
                      class="mk-snip-desktop absolute left-2 top-2"
                      style="right:40%;bottom:30%"
                    >
                      <span class="mock-chip absolute top-1 left-1 whitespace-nowrap rounded-sm bg-emerald-500 px-1.5 py-0.5 font-medium text-white">
                        Desktop
                      </span>
                    </div>
                    <div
                      class="mk-snip-desktop absolute"
                      style="left:65%;top:5%;right:8%;bottom:0%"
                    >
                      <span class="mock-chip absolute top-1 left-1 whitespace-nowrap rounded-sm bg-emerald-500 px-1.5 py-0.5 font-medium text-white">
                        Mobile
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex-1">
                <div class="eyebrow mb-3 text-[var(--color-text-muted)]">Step 2</div>
                <h3 class="mb-3">Draw snip regions</h3>
                <p class="text-[var(--color-text-muted)]">
                  Draw boxes over the parts that matter. Each box is a snip. You can draw as many as you want, name them, and reorder them. Snipfolio snaps to common frame ratios so the device frame fits without stretching.
                </p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
              <div class="flex-1">
                <div class="eyebrow mb-3 text-[var(--color-text-muted)]">Step 3</div>
                <h3 class="mb-3">Compose and export</h3>
                <p class="text-[var(--color-text-muted)]">
                  Open a composition. Choose a background, pick a device frame, arrange your snips. When you are happy, export as PNG.
                </p>
              </div>
              <div
                class="mk-border w-full overflow-hidden rounded-xl sm:w-80"
                role="img"
                aria-label="The composition editor: a snip inside a desktop frame on a warm gradient background, with background and frame controls in a sidebar"
              >
                <div class="flex h-[180px] bg-[var(--color-surface-2)]">
                  <div class="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-700/50 to-indigo-900/30">
                    <div class="relative mr-6">
                      <!-- Desktop frame -->
                      <div class="w-24">
                        <div class="mk-frame-body-dark overflow-hidden rounded-sm">
                          <div class="mk-frame-bezel-dark flex items-center justify-center py-0.5">
                            <div class="size-0.5 rounded-full bg-white/20" />
                          </div>
                          <div class="aspect-video bg-[var(--color-surface-3)] p-1.5">
                            <div class="h-[55%] rounded-sm bg-[var(--color-surface-4)]" />
                            <div class="mt-[5%] h-[15%] w-2/3 rounded-sm bg-[var(--color-surface-4)]" />
                          </div>
                        </div>
                        <div class="mk-frame-base-dark h-1.5 rounded-b-sm" style="width:110%;margin-left:-5%" />
                      </div>
                      <!-- Mobile frame floating over desktop -->
                      <div class="absolute -right-9 top-1/2 z-10 w-10 -translate-y-1/2 drop-shadow-xl">
                        <div class="mk-frame-body-dark overflow-hidden rounded-lg">
                          <div class="mk-frame-bezel-dark flex items-center justify-center py-1">
                            <div class="size-0.5 rounded-full bg-white/20" />
                          </div>
                          <div class="aspect-[9/16] bg-[var(--color-surface-3)] p-1">
                            <div class="h-[40%] rounded-sm bg-[var(--color-surface-4)]" />
                            <div class="mt-[8%] h-[12%] w-3/4 rounded-sm bg-[var(--color-surface-4)]" />
                          </div>
                          <div class="mk-frame-bezel-dark flex items-center justify-center py-1">
                            <div class="h-0.5 w-4 rounded-full bg-white/30" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex w-24 flex-col border-l border-[var(--color-border)] p-2">
                    <div class="mock-label mb-1.5 text-[var(--color-text-muted)]">Background</div>
                    <div class="mb-3 flex gap-1">
                      <div class="size-4 rounded-sm bg-gradient-to-br from-slate-700 to-slate-800" />
                      <div class="size-4 rounded-sm bg-slate-600/50" />
                      <div class="size-4 rounded-sm bg-indigo-800/50" />
                    </div>
                    <div class="mock-label mb-1.5 text-[var(--color-text-muted)]">Frame</div>
                    <div class="mb-3 flex gap-1">
                      <div class="mock-chip mk-border inline-flex h-4 items-center rounded-sm px-1.5 text-[var(--color-text-muted)]">
                        Desktop
                      </div>
                    </div>
                    <div class="mt-auto">
                      <div
                        class="mock-label flex h-5 w-full items-center justify-center rounded-sm font-medium"
                        style="background:var(--color-accent);color:var(--color-surface)"
                      >
                        Export
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="border-t border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <div class="mx-auto max-w-5xl px-4 py-20">
          <h2 class="mb-12 text-center">What you get</h2>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="feature in features"
              :key="feature.title"
              class="mk-card rounded-xl p-5"
            >
              <component :is="feature.icon" class="mb-3 size-6 text-[var(--color-accent)]" :stroke-width="1.5" />
              <h3 class="feature-title mb-1.5">{{ feature.title }}</h3>
              <p class="feature-body text-[var(--color-text-muted)]">{{ feature.body }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Use cases -->
      <section class="border-t border-[var(--color-border)]">
        <div class="mx-auto max-w-5xl px-4 py-20">
          <h2 class="mb-12 text-center">Where it fits</h2>
          <div class="space-y-6">
            <div
              v-for="useCase in useCases"
              :key="useCase.title"
              class="mk-card-2 rounded-xl p-5 sm:p-6"
            >
              <h3 class="mb-2">{{ useCase.title }}</h3>
              <p class="text-[var(--color-text-muted)]">{{ useCase.body }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing -->
      <section id="pricing" class="border-t border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <div class="mx-auto max-w-5xl px-4 py-20">
          <h2 class="mb-4 text-center">Pricing</h2>
          <p class="mb-12 text-center text-[var(--color-text-muted)]">
            Not sure yet? A day pass lets you export one project without watermarks for 24 hours. No subscription required.
          </p>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <!-- Free -->
            <div class="mk-card flex flex-col rounded-xl p-6">
              <div class="plan-name mb-1 font-medium text-[var(--color-text-muted)]">Free</div>
              <div class="plan-price mb-4 font-semibold">$0</div>
              <ul class="mb-6 space-y-2.5">
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <span class="mt-0.5 text-[var(--color-accent)]">+</span>
                  No account needed
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <span class="mt-0.5 text-[var(--color-accent)]">+</span>
                  Core snipping and composition
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <span class="mt-0.5 text-[var(--color-danger)]">-</span>
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
                  <span class="mt-0.5 text-[var(--color-accent)]">+</span>
                  Export 1 project without watermarks
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <span class="mt-0.5 text-[var(--color-accent)]">+</span>
                  Valid for 24 hours
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <span class="mt-0.5 text-[var(--color-accent)]">+</span>
                  No subscription
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
                  <span class="mt-0.5 text-[var(--color-accent)]">+</span>
                  Everything in Free
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <span class="mt-0.5 text-[var(--color-accent)]">+</span>
                  No watermark
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <span class="mt-0.5 text-[var(--color-accent)]">+</span>
                  Unlimited projects
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <span class="mt-0.5 text-[var(--color-accent)]">+</span>
                  Higher storage limits
                </li>
                <li class="plan-feature flex items-start gap-2 text-[var(--color-text-muted)]">
                  <span class="mt-0.5 text-[var(--color-accent)]">+</span>
                  Priority support
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
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="border-t border-[var(--color-border)]">
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
      <section class="border-t border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <div class="mx-auto max-w-2xl px-4 py-20 text-center">
          <h2 class="mb-3">It's faster to just try it</h2>
          <p class="mb-8 text-[var(--color-text-muted)]">Free. No install.</p>
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
          <a href="#pricing" class="marketing-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Pricing</a>
          <a href="#faq" class="marketing-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">FAQ</a>
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
import { Crop, Layers, LayoutDashboard, Palette, Type, ArrowUpFromLine } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'landing', middleware: [] })

const authStore = useAuthStore()

useSeoMeta({
  title: 'Snipfolio -- Screenshot clipping and composition for developers and designers',
  description: 'Clip regions from any screenshot, then compose them into polished exports with device frames, captions, and custom backgrounds. No Figma required.',
  ogTitle: 'Snipfolio',
  ogDescription: 'Clip regions from any screenshot, then compose them into polished exports with device frames, captions, and custom backgrounds.',
  ogType: 'website',
  ogUrl: 'https://snipfolio.com',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Snipfolio',
  twitterDescription: 'Clip regions from any screenshot, then compose them into polished exports with device frames, captions, and custom backgrounds.',
})

const faq = [
  {
    q: 'Does Snipfolio store my screenshots?',
    a: 'When you are signed in, your source images are uploaded and stored securely on our servers so your work persists across sessions. If you use the app without an account, nothing is uploaded, everything stays in your browser tab and is gone when you close it.',
  },
  {
    q: 'What file types can I drop in?',
    a: 'PNG and JPEG. If your screenshot tool exports WebP, convert it first. WebP support is coming soon.',
  },
  {
    q: 'What do the device frames look like?',
    a: 'We currently have a desktop frame, a mobile frame, and a browser frame. The frames are SVG overlays sized to match the crop ratios Snipfolio snaps to.',
  },
  {
    q: 'Can I use Snipfolio for app store screenshots?',
    a: 'Yes. The mobile frame and export dimensions are sized for standard app store requirements. You will need to check the exact pixel specs for each store and set your composition to match.',
  },
  {
    q: 'Is there a Figma plugin?',
    a: 'Not yet. Snipfolio is a standalone web app. If a Figma plugin is something you need, let us know.',
  },
  {
    q: 'What is the difference between the day pass and Pro?',
    a: 'The day pass is a one-time purchase that lets you export one project without watermarks for 24 hours. Pro is a monthly subscription with no watermarks, unlimited projects, higher storage limits, and access to Pro-only features as they ship. If you just need a clean export once in a while, a day pass is probably the better pick.',
  },
  {
    q: 'Do I need an account to use it?',
    a: 'No. The free tier works without an account. You need to sign in to save compositions across sessions.',
  },
]

useHead({
  link: [{ rel: 'canonical', href: 'https://snipfolio.com' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            name: 'Snipfolio',
            url: 'https://snipfolio.com',
            description: 'Screenshot clipping and composition for developers and designers',
          },
          {
            '@type': 'SoftwareApplication',
            name: 'Snipfolio',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Web',
            url: 'https://snipfolio.com',
            description: 'Clip regions from any screenshot, then compose them into polished exports with device frames, captions, and custom backgrounds.',
            offers: [
              {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                name: 'Free',
                description: 'Core snipping and composition with watermarked exports',
              },
              {
                '@type': 'Offer',
                price: '4.99',
                priceCurrency: 'USD',
                name: 'Day pass',
                description: '24-hour full access with no watermark, one-time purchase',
              },
              {
                '@type': 'Offer',
                price: '9.99',
                priceCurrency: 'USD',
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: '9.99',
                  priceCurrency: 'USD',
                  unitCode: 'MON',
                },
                name: 'Pro',
                description: 'Monthly subscription with no watermarks, saved compositions across sessions, and priority support.',
              },
            ],
          },
          {
            '@type': 'FAQPage',
            mainEntity: faq.map(item => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          },
        ],
      }),
    },
  ],
})

const features = [
  {
    icon: Crop,
    title: 'Frame matching',
    body: 'Snaps crops to desktop and mobile aspect ratios so the device frame fits without stretching.',
  },
  {
    icon: Layers,
    title: 'Multiple snips per screenshot',
    body: 'Draw as many crop regions as you need and organize them in the sidebar.',
  },
  {
    icon: LayoutDashboard,
    title: 'Composition layouts',
    body: 'Single snips or auto-arranged grids Snipfolio spaces and scales them for you.',
  },
  {
    icon: Palette,
    title: 'Custom backgrounds',
    body: 'Solid colors, gradients, or your own image.',
  },
  {
    icon: Type,
    title: 'Captions',
    body: 'Add a label under any snip inside the composition.',
  },
  {
    icon: ArrowUpFromLine,
    title: 'PNG export',
    body: 'One click. No watermark on paid plans.',
  },
]

const useCases = [
  {
    title: 'PRs and code review',
    body: 'Drop in a screenshot, clip the relevant UI state, export a clean image to paste in the PR description.',
  },
  {
    title: 'App store screenshots',
    body: 'Clip your UI, put it in the right device frame, batch-export. No Figma templates to maintain.',
  },
  {
    title: 'Portfolio and documentation',
    body: 'Make your project screenshots look the way you want them, not like you just hit print screen and called it done.',
  },
]

</script>
