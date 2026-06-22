<template>
  <TransitionRoot appear :show="open" as="template">
    <Dialog as="div" class="relative z-50" @close="$emit('close')">

      <TransitionChild
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/60" />
      </TransitionChild>

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
              class="relative w-full max-h-[85vh] overflow-y-auto bg-[var(--color-surface-3)] border-strong rounded-2xl"
              :style="{ maxWidth: maxWidth ?? '520px' }"
            >
              <div
                v-if="title"
                class="flex items-center justify-between px-6 py-4 border-b-faint"
              >
                <DialogTitle class="text-sm font-medium text-[var(--color-text)]">
                  {{ title }}
                </DialogTitle>
                <button
                  class="rounded-[6px] p-1 text-[var(--color-text-muted)] transition hover:bg-white/10 hover:text-[var(--color-text)]"
                  aria-label="Close"
                  @click="$emit('close')"
                >
                  <X class="size-4" aria-hidden="true" />
                </button>
              </div>

              <div class="p-6">
                <slot />
              </div>

              <div
                v-if="hasFooter"
                class="flex justify-end gap-2 px-6 py-4 border-t-faint"
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
import { X } from 'lucide-vue-next'

defineProps<{
  open: boolean
  title?: string
  maxWidth?: string
}>()

defineEmits<{ close: [] }>()

const slots = useSlots()
const hasFooter = computed(() => !!slots.footer)
</script>
