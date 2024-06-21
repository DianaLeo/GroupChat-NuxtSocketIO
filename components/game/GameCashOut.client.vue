<script setup lang="ts">
    const gameStore = useGameStore()
    const { cashOutMultiplier } = storeToRefs(gameStore)

    defineProps<{
        cashOutYValue: string | number
    }>()

    const emit = defineEmits<{
        (e: "onCashOut"): void
    }>()
</script>

<template>
    <div class="mt-8 flex justify-center space-x-8">
        <BaseButton title="Cash Out" @click="emit('onCashOut')" />
        <span class="leading-8">From FE: {{ cashOutYValue }}x</span>
        <span class="leading-8">From BE: {{ cashOutMultiplier }}x</span>
    </div>
</template>
