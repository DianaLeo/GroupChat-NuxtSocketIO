<script lang="ts" setup>
const props = withDefaults(
    defineProps<{
      tag?: string
      wide?: boolean
      ui?: {
        gap?: string | string[]
        margin?: string | string[]
      }
    }>(),
    {
      tag: "div",
      wide: false,
      ui: () => ({}),
    },
)

const gap = useTailwindMerged("gap-4 md:gap-6 lg:gap-9", () => props.ui.gap ?? "")
const margin = useTailwindMerged("mt-10", () => props.ui.margin ?? "")
</script>

<template>
  <AppContainer :tag :wide class="flex grow flex-col items-center" :class="[gap, margin]">
    <slot></slot>
  </AppContainer>
</template>
