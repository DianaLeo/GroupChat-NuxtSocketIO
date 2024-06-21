<script setup lang="ts">
    const gameStore = useGameStore()
    const { resultPerRound } = storeToRefs(gameStore)
</script>

<template>
    <div class="mt-8 flex flex-col justify-center bg-background-800">
        <h2 class="my-4 text-center">Cash Out Results Per Round</h2>
        <table>
            <thead>
                <tr>
                    <th>User ID</th>
                    <th>Cash Out Time</th>
                    <th>Multiplier</th>
                </tr>
            </thead>
            <tbody class="text-center">
                <tr v-for="(result, index) in resultPerRound" :key="index">
                    <td>{{ result.userId }}</td>
                    <td>{{ result.cashOutX }}</td>
                    <td>{{ result.multiplier }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped></style>
