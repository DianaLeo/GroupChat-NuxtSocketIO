<script setup lang="ts">
import type { Chat } from "~/types"

const props = withDefaults(
    defineProps<{
      scrollList: Chat[] | null
      canLoadMore: boolean
      isInitialized: boolean
      height?: number
    }>(),
    {
      scrollList: null,
      height: 300,
    },
)

const emit = defineEmits<{
  (e: "fetchMore"): void
}>()

console.log("props.height=",props.height)

const scrollContainer = ref(null)

useInfiniteScroll(scrollContainer, loadMore, {
  distance: props.height,
  direction: "top",
  canLoadMore: () => props.canLoadMore,
})

onMounted(() => {
  loadMore()
})

async function loadMore () {
  if (props.isInitialized) {
    emit("fetchMore")
  }
}
</script>

<template>
  <div
      ref="scrollContainer"
      class="flex flex-col-reverse overflow-y-auto pb-4 hide-scrollbar space-y-2 bg-background-900"
      :style="{height: `${height}px`}"
  >
      <slot name="renderer" :scroll-list="scrollList"></slot>
    <div v-if="!props.canLoadMore" class="text-center">No More History</div>
  </div>
</template>

<style lang="scss" scoped>
  /* Hide scrollbar for Chrome, Safari and Opera */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>