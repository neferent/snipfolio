// Snipfolio-local is free — there is no watermark. Kept as a composable
// (rather than deleting it) since it's the plumbed-in `watermark` input to
// the canvas renderer (CompositionCanvas.vue, CompositionPreview.vue,
// FreeformEditor.vue) — always inactive.
export function useWatermarkPreview() {
  const active = computed(() => false)
  return { active }
}
