<template>
  <div class="min-h-screen bg-[var(--color-surface-2)]">
    <header class="border-b-faint bg-[var(--color-surface-2)]/90 px-8 py-5">
      <p class="text-[11px] font-semibold tracking-[0.08em] text-[var(--color-text-faint)] uppercase">Internal · dev only</p>
      <h1 class="text-lg font-semibold text-[var(--color-text)]">Component library</h1>
    </header>

    <ThemeToggle class="fixed right-6 bottom-6 z-10 bg-[var(--color-surface)] shadow-md" />

    <main class="mx-auto flex w-full max-w-4xl flex-col gap-16 px-8 py-10">

      <!-- Button -->
      <section>
        <div class="mb-5 flex items-baseline justify-between gap-4">
          <h2 class="text-[15px] font-semibold text-[var(--color-text)]">Button</h2>
          <span class="text-xs text-[var(--color-text-faint)]">sm 28px · md 32px · lg 40px</span>
        </div>
        <div class="rounded-2xl border-faint bg-[var(--color-surface)] p-6">
          <div class="grid grid-cols-[repeat(auto-fit,minmax(0,max-content))] items-end">
            <div class="flex flex-col items-start gap-2 p-3">
              <span class="font-mono text-[11px] text-[var(--color-text-faint)]">sm</span>
              <AppButton size="sm">Save</AppButton>
            </div>
            <div class="flex flex-col items-start gap-2 p-3">
              <span class="font-mono text-[11px] text-[var(--color-text-faint)]">md (default)</span>
              <AppButton>Save changes</AppButton>
            </div>
            <div class="flex flex-col items-start gap-2 p-3">
              <span class="font-mono text-[11px] text-[var(--color-text-faint)]">lg</span>
              <AppButton size="lg">Continue</AppButton>
            </div>
            <div class="flex flex-col items-start gap-2 p-3">
              <span class="font-mono text-[11px] text-[var(--color-text-faint)]">icon-only</span>
              <AppButton variant="secondary" icon-only aria-label="Zoom in">
                <ZoomIn />
              </AppButton>
            </div>
            <div class="flex flex-col items-start gap-2 p-3">
              <span class="font-mono text-[11px] text-[var(--color-text-faint)]">disabled</span>
              <AppButton disabled>Save changes</AppButton>
            </div>
          </div>

          <div class="my-5 h-px bg-[var(--color-border)]" />

          <div class="grid grid-cols-[repeat(auto-fit,minmax(0,max-content))] items-end">
            <div class="flex flex-col items-start gap-2 p-3">
              <span class="font-mono text-[11px] text-[var(--color-text-faint)]">primary</span>
              <AppButton>Create project</AppButton>
            </div>
            <div class="flex flex-col items-start gap-2 p-3">
              <span class="font-mono text-[11px] text-[var(--color-text-faint)]">secondary</span>
              <AppButton variant="secondary">Cancel</AppButton>
            </div>
            <div class="flex flex-col items-start gap-2 p-3">
              <span class="font-mono text-[11px] text-[var(--color-text-faint)]">ghost</span>
              <AppButton variant="ghost">Skip</AppButton>
            </div>
            <div class="flex flex-col items-start gap-2 p-3">
              <span class="font-mono text-[11px] text-[var(--color-text-faint)]">danger</span>
              <AppButton variant="danger">Delete project</AppButton>
            </div>
            <div class="flex flex-col items-start gap-2 p-3">
              <span class="font-mono text-[11px] text-[var(--color-text-faint)]">danger-ghost</span>
              <AppButton variant="danger-ghost">Remove</AppButton>
            </div>
          </div>
        </div>
      </section>

      <!-- Input & Select -->
      <section>
        <div class="mb-5 flex items-baseline justify-between gap-4">
          <h2 class="text-[15px] font-semibold text-[var(--color-text)]">Input &amp; Select</h2>
          <span class="text-xs text-[var(--color-text-faint)]">matches Button's height scale, so rows line up</span>
        </div>
        <div class="rounded-2xl border-faint bg-[var(--color-surface)] p-6">
          <div class="grid grid-cols-2">
            <div class="flex flex-col gap-1.5 p-3">
              <label class="text-xs font-medium text-[var(--color-text-muted)]">Email — sm</label>
              <AppInput v-model="emailSm" size="sm" placeholder="you@example.com" />
            </div>
            <div class="flex flex-col gap-1.5 p-3">
              <label class="text-xs font-medium text-[var(--color-text-muted)]">Email — md (default)</label>
              <AppInput v-model="emailMd" placeholder="you@example.com" />
            </div>
            <div class="flex flex-col gap-1.5 p-3">
              <label class="text-xs font-medium text-[var(--color-text-muted)]">Project name — lg</label>
              <AppInput v-model="projectName" size="lg" placeholder="Untitled project" />
            </div>
            <div class="flex flex-col gap-1.5 p-3">
              <label class="text-xs font-medium text-[var(--color-text-muted)]">Password — error state</label>
              <AppInput v-model="passwordDemo" type="password" error="Must be at least 8 characters" />
            </div>
            <div class="flex flex-col gap-1.5 p-3">
              <label class="text-xs font-medium text-[var(--color-text-muted)]">Password — with suffix</label>
              <AppInput v-model="passwordDemo2" :type="showPassword ? 'text' : 'password'" placeholder="••••••••">
                <template #suffix>
                  <button type="button" tabindex="-1" @click="showPassword = !showPassword">
                    <component :is="showPassword ? EyeOff : Eye" class="size-4" />
                  </button>
                </template>
              </AppInput>
            </div>
            <div class="flex flex-col gap-1.5 p-3">
              <label class="text-xs font-medium text-[var(--color-text-muted)]">Disabled</label>
              <AppInput model-value="Locked value" disabled />
            </div>
            <div class="flex flex-col gap-1.5 p-3">
              <label class="text-xs font-medium text-[var(--color-text-muted)]">Snap frame — select</label>
              <AppSelect v-model="snapFrame" :options="snapFrameOptions" />
            </div>
          </div>

          <div class="my-5 h-px bg-[var(--color-border)]" />

          <div class="flex flex-wrap items-center gap-3">
            <AppButton variant="secondary">Cancel</AppButton>
            <AppInput v-model="pairedInput" class="w-56" placeholder="Paired with button — heights match" />
            <AppButton>Go</AppButton>
          </div>
        </div>
      </section>

      <!-- Checkbox / Radio / Toggle -->
      <section>
        <div class="mb-5 flex items-baseline justify-between gap-4">
          <h2 class="text-[15px] font-semibold text-[var(--color-text)]">Checkbox, Radio &amp; Toggle</h2>
          <span class="text-xs text-[var(--color-text-faint)]">16px controls, 32px switch</span>
        </div>
        <div class="rounded-2xl border-faint bg-[var(--color-surface)] p-6">
          <div class="grid grid-cols-[repeat(auto-fit,minmax(0,max-content))] items-center gap-4">
            <AppCheckbox v-model="checkA">Include watermark</AppCheckbox>
            <AppCheckbox v-model="checkB">Auto-save</AppCheckbox>
            <AppRadioGroup v-model="radioDevice">
              <AppRadio value="desktop">Desktop</AppRadio>
              <AppRadio value="mobile">Mobile</AppRadio>
            </AppRadioGroup>
            <div class="p-3"><AppToggle v-model="toggleDark">Dark mode</AppToggle></div>
          </div>
        </div>
      </section>

      <!-- Toggle Button -->
      <section>
        <div class="mb-5 flex items-baseline justify-between gap-4">
          <h2 class="text-[15px] font-semibold text-[var(--color-text)]">Toggle Button</h2>
          <span class="text-xs text-[var(--color-text-faint)]">a Button that carries a pressed state — for segmented pickers and toolbar toggles</span>
        </div>
        <div class="rounded-2xl border-faint bg-[var(--color-surface)] p-6">
          <div class="flex flex-col gap-2">
            <span class="font-mono text-[11px] text-[var(--color-text-faint)]">solid — segmented picker (e.g. device selection)</span>
            <div class="flex gap-1">
              <AppToggleButton v-model="deviceDesktop">Desktop</AppToggleButton>
              <AppToggleButton v-model="deviceTablet">Tablet</AppToggleButton>
              <AppToggleButton v-model="deviceMobile">Mobile</AppToggleButton>
            </div>
          </div>

          <div class="my-5 h-px bg-[var(--color-border)]" />

          <div class="flex flex-col gap-2">
            <span class="font-mono text-[11px] text-[var(--color-text-faint)]">tint — icon toolbar toggles</span>
            <div class="flex gap-1">
              <AppToggleButton v-model="gridShow" variant="tint" size="sm" icon-only aria-label="Toggle grid">
                <Grid3x3 />
              </AppToggleButton>
              <AppToggleButton v-model="gridSnap" variant="tint" size="sm" icon-only aria-label="Toggle snap to grid">
                <Magnet />
              </AppToggleButton>
              <AppToggleButton v-model="gridDisabled" variant="tint" size="sm" icon-only disabled aria-label="Disabled toggle">
                <Crosshair />
              </AppToggleButton>
            </div>
          </div>
        </div>
      </section>

      <!-- Badge -->
      <section>
        <div class="mb-5 flex items-baseline justify-between gap-4">
          <h2 class="text-[15px] font-semibold text-[var(--color-text)]">Badge</h2>
          <span class="text-xs text-[var(--color-text-faint)]">status pills, snap-frame tags, plan labels</span>
        </div>
        <div class="rounded-2xl border-faint bg-[var(--color-surface)] p-6">
          <div class="grid grid-cols-[repeat(auto-fit,minmax(0,max-content))] items-center">
            <div class="p-2"><AppBadge>Desktop</AppBadge></div>
            <div class="p-2"><AppBadge variant="accent">3-Day Pass</AppBadge></div>
            <div class="p-2"><AppBadge variant="success">Saved</AppBadge></div>
            <div class="p-2"><AppBadge variant="warning">Free plan</AppBadge></div>
            <div class="p-2"><AppBadge variant="danger">Error</AppBadge></div>
          </div>
        </div>
      </section>

      <!-- Values -->
      <section>
        <div class="mb-5 flex items-baseline justify-between gap-4">
          <h2 class="text-[15px] font-semibold text-[var(--color-text)]">Values</h2>
          <span class="text-xs text-[var(--color-text-faint)]">sourced from the @theme tokens in main.css — no new colors</span>
        </div>
        <div class="overflow-x-auto rounded-2xl border-faint bg-[var(--color-surface)] p-6">
          <table class="w-full text-[12.5px]">
            <thead>
              <tr class="border-b-faint text-left text-[10.5px] font-semibold tracking-[0.04em] text-[var(--color-text-faint)] uppercase">
                <th class="pb-2">Size</th>
                <th class="pb-2">Height</th>
                <th class="pb-2">Padding-x</th>
                <th class="pb-2">Font</th>
                <th class="pb-2">Radius</th>
                <th class="pb-2">Used for</th>
              </tr>
            </thead>
            <tbody class="text-[var(--color-text)]">
              <tr class="border-b-faint">
                <td class="py-2.5 font-medium">sm</td>
                <td class="py-2.5 font-mono text-[var(--color-text-muted)]">28px</td>
                <td class="py-2.5 font-mono text-[var(--color-text-muted)]">10px</td>
                <td class="py-2.5 font-mono text-[var(--color-text-muted)]">12px / 500</td>
                <td class="py-2.5 font-mono text-[var(--color-text-muted)]">radius-sm (4px)</td>
                <td class="py-2.5">inline/toolbar actions, compact chips</td>
              </tr>
              <tr class="border-b-faint">
                <td class="py-2.5 font-medium">md</td>
                <td class="py-2.5 font-mono text-[var(--color-text-muted)]">32px</td>
                <td class="py-2.5 font-mono text-[var(--color-text-muted)]">14px</td>
                <td class="py-2.5 font-mono text-[var(--color-text-muted)]">13px / 500</td>
                <td class="py-2.5 font-mono text-[var(--color-text-muted)]">radius-md (6px)</td>
                <td class="py-2.5">default — modals, panels, forms</td>
              </tr>
              <tr>
                <td class="py-2.5 font-medium">lg</td>
                <td class="py-2.5 font-mono text-[var(--color-text-muted)]">40px</td>
                <td class="py-2.5 font-mono text-[var(--color-text-muted)]">18px</td>
                <td class="py-2.5 font-mono text-[var(--color-text-muted)]">14px / 500</td>
                <td class="py-2.5 font-mono text-[var(--color-text-muted)]">radius-lg (8px)</td>
                <td class="py-2.5">primary page actions (login, checkout)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
import { Eye, EyeOff, ZoomIn, Grid3x3, Magnet, Crosshair } from 'lucide-vue-next'

definePageMeta({ layout: false })

useHead({
  title: 'Component library — Snipfolio',
  bodyAttrs: { class: 'dev-page-scroll' },
})

// Not linked from nav — visit /dev/components directly. Extend this page as new
// primitives are added to app/components/ui/, so it stays the living reference.

const emailSm = ref('')
const emailMd = ref('')
const projectName = ref('')
const passwordDemo = ref('short')
const passwordDemo2 = ref('')
const showPassword = ref(false)
const snapFrame = ref('desktop')
const snapFrameOptions = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'mobile', label: 'Mobile' },
]
const pairedInput = ref('')
const checkA = ref(true)
const checkB = ref(false)
const radioDevice = ref('desktop')
const toggleDark = ref(true)
const deviceDesktop = ref(true)
const deviceTablet = ref(false)
const deviceMobile = ref(true)
const gridShow = ref(true)
const gridSnap = ref(false)
const gridDisabled = ref(false)
</script>
