<template>
  <TransitionRoot appear :show="open" as="template">
    <Dialog as="div" class="relative z-50" @close="$emit('close')">

      <!-- Backdrop: TransitionChild without as="template" so it renders a real div -->
      <TransitionChild
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      </TransitionChild>

      <!-- Scroll container keeps modal on-screen on short viewports -->
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-200"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-150"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="relative w-full rounded-xl bg-[var(--color-surface-2)] shadow-2xl ring-1 ring-white/10"
              :style="{ maxWidth: maxWidth ?? '480px' }"
            >
              <div
                v-if="title"
                class="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4"
              >
                <DialogTitle class="text-sm font-semibold text-[var(--color-text)]">
                  {{ title }}
                </DialogTitle>
                <button
                  class="rounded p-1 text-[var(--color-text-muted)] transition hover:bg-white/10 hover:text-[var(--color-text)]"
                  @click="$emit('close')"
                >
                  <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="p-5">
                <slot />
              </div>

              <div
                v-if="hasFooter"
                class="flex justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4"
              >
                <slot name="footer" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>

    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue'

defineProps<{
  open: boolean
  title?: string
  maxWidth?: string
}>()

defineEmits<{ close: [] }>()

const slots = useSlots()
const hasFooter = computed(() => !!slots.footer)
</script>
