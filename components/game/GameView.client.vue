<script setup lang="ts">
import type { NuxtPlotlyConfig, NuxtPlotlyData, NuxtPlotlyLayout } from "nuxt-plotly"
import tailwindConfig from "../../tailwind.config"

const gameStore = useGameStore()
const { xValues, yValues, startOrStop, resultPerRound } = storeToRefs(gameStore)

const plotBgColor = tailwindConfig.theme?.extend?.colors?.background?.["800"]
const textColor = tailwindConfig.theme?.extend?.colors?.neutral?.["650"]
const titleFont = {
  family: "Arial, sans-serif",
  size: 18,
  color: textColor,
}
const tickFont = {
  family: "Arial, sans-serif",
  size: 14,
  color: textColor,
}

const data = computed<NuxtPlotlyData>(() => [
  { x: xValues.value, y: yValues.value, mode: "lines" },
])
const layout: NuxtPlotlyLayout = {
  title: {
    text: "Crash Game",
    font: titleFont,
  },
  xaxis: {
    title: {
      text: "Time in seconds",
      font: titleFont,
    },
    showline: true,
    showgrid: false,
    linecolor: textColor,
    tickfont: tickFont,
    tickformat: ".1f",
    ticksuffix: "s",
  },
  yaxis: {
    title: {
      text: "Muliplier",
      font: titleFont,
    },
    showline: true,
    showgrid: false,
    linecolor: textColor,
    tickfont: tickFont,
    tickformat: ".1f",
    ticksuffix: "x",
    // range:[1,null],
  },
  margin: {
    l: 60,
    r: 50,
    b: 60,
    t: 60,
  },
  paper_bgcolor: plotBgColor,
  plot_bgcolor: plotBgColor,
  shapes: [
    {
      type: "line",
      x0: 0,
      y0: 1,
      x1: 10,
      y1: Math.pow(10, 1.8) / 50 + 1,
      line: {
        color: "Transparent",
        width: 2,
      },
    },
  ],
  annotations: [],
}
const config: NuxtPlotlyConfig = { scrollZoom: true, displayModeBar: false }

const cashOutXValue = ref<number | null>(null)
const cashOutYValue = ref(0)

initGame()

watch(startOrStop, () => {
  startOrStop.value && resetFrontEndStates()
})

watch(resultPerRound, () => {
  // Front end uses backend calculated multiplier as the correct value
  const newX = resultPerRound.value[resultPerRound.value.length - 1]?.cashOutX
  const newY = resultPerRound.value[resultPerRound.value.length - 1]?.multiplier
  if (newX !== null && newY !== null) {
    layout.annotations.push({
      x: newX,
      y: newY,
      text: `${newY}x`,
      xref: "x",
      yref: "y",
      showarrow: true,
      font: {
        family: "Arial, sans-serif",
        size: 14,
        color: textColor,
      },
    })
  }
})

async function onCashOut() {
  if (startOrStop.value && cashOutXValue.value === null) {
    await gameStore.cashOut()
    cashOutXValue.value = xValues.value[xValues.value.length - 1]
    cashOutYValue.value = yValues.value[yValues.value.length - 1].toFixed(
        2,
    ) as unknown as number
  }
}

function resetFrontEndStates() {
  layout.annotations = []
  cashOutXValue.value = null
  cashOutYValue.value = 0
}

function initGame() {
  const initialTimer = setInterval(() => {
    console.log("Initial plotting to show the plot background")
    xValues.value.push(0)
    yValues.value.push(1)
  }, 1000)

  setTimeout(() => {
    initialTimer && clearInterval(initialTimer)
  }, 1000)
}
</script>

<template>
  <div class="w-1/2">
    <div class="relative">
      <GameOverlay />
      <nuxt-plotly :data="data" :layout="layout" :config="config" style="width: 100%" />
    </div>
    <GameCashOut :cash-out-y-value="cashOutYValue" @on-cash-out="onCashOut" />
    <GameResultTable />
  </div>
</template>
