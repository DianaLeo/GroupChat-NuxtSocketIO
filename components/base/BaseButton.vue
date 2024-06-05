<script lang="ts" setup>
    const props = withDefaults(
        defineProps<{
            title?: string | undefined
            ui?: string | string[]
        }>(),
        {
            title: undefined,
            ui: () => [],
        },
    )

    const buttonClasses = useTailwindMerged(
        `relative text-primary rounded-xl bg-gradient-to-b from-blue-gr/80 to-blue-gr transition-all duration-200 hover:bg-blue-gr p-1.5 text-center text-sm font-semibold shadow-button-glow`,
        () => props.ui ?? "",
    )
</script>

<template>
    <button :class="buttonClasses">
        {{ title }}
    </button>
</template>
