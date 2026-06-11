import { usePlan } from '~/composables/usePlan'

const _hidden = ref(false)

export function useWatermarkPreview() {
  const { isPro } = usePlan()
  const active = computed(() => !isPro.value && !_hidden.value)
  function toggle() { _hidden.value = !_hidden.value }
  return { active, hidden: _hidden, toggle }
}
