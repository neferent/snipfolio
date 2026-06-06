<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const inputRef = ref<HTMLInputElement | null>(null)

const hexDisplay = computed({
  get: () => props.modelValue?.replace('#', '') ?? '',
  set: (val) => {
    const clean = val.startsWith('#') ? val : `#${val}`
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) emit('update:modelValue', clean)
  },
})

function openPicker() {
  inputRef.value?.click()
}

function onNativeInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex items-center gap-1.5">
    <button
      type="button"
      class="relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded-[5px] ring-1 ring-inset ring-white/10 transition hover:ring-white/25"
      :style="{ background: modelValue }"
      @click="openPicker"
    >
      <input
        ref="inputRef"
        type="color"
        :value="modelValue"
        class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        tabindex="-1"
        @input="onNativeInput"
      />
    </button>
    <input
      v-model="hexDisplay"
      type="text"
      maxlength="7"
      spellcheck="false"
      class="w-[5.5rem] font-mono text-xs"
      placeholder="#000000"
    />
  </div>
</template>
