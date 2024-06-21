<script setup lang="ts">
    const gameStore = useGameStore()
    const { newestYValue, countDown } = storeToRefs(gameStore)
</script>

<template>
    <div
        v-if="!countDown"
        class="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-left text-6xl"
    >
        {{ newestYValue }}x
    </div>
    <div
        v-if="countDown"
        class="leading-20 absolute left-1/2 top-1/2 z-10 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-gr text-center text-6xl"
    >
        {{ countDown }}
    </div>
</template>
