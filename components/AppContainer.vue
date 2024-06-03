<script lang="ts" setup>
    const props = withDefaults(
        defineProps<{
            tag?: string
            wide?: boolean
            ui?: {
                padding?: string | string[]
            }
        }>(),
        {
            tag: "div",
            wide: false,
            ui: () => ({}),
        },
    )

    const padding = useTailwindMerged("px-4 lg:px-8", () => props.ui.padding ?? "")
</script>

<template>
    <component
        :is="tag"
        class="container"
        :class="[padding, wide ? 'max-w-screen-xl' : 'max-w-screen-lg']"
    >
        <slot></slot>
    </component>
</template>
