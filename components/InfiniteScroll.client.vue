<script setup lang="ts">
import type { Chat } from "~/types"

const props = withDefaults(
    defineProps<{
      scrollList: Chat[]
      canLoadMore: boolean
      ui?:{
        height?: string
      }
    }>(),
    {
      ui: () => ({}),
    },
)

const emit = defineEmits<{
  (e: "fetchMore"): void
  (e: "setChatModalAtBottomToTrue"): void
}>()

const { scrollList } = toRefs(props)

const height = useTailwindMerged("h-[700px]", () => props.ui.height ?? "")

const scrollContainer = ref<HTMLElement | null>(null)

useInfiniteScroll(scrollContainer, loadMore, {
  distance: 50,
  direction: "top",
  canLoadMore: () => props.canLoadMore,
})

useEventListener(scrollContainer, 'scroll', () => {
  checkIfAtBottom()
})

onMounted(async () => {
  await loadMore()
  await nextTick()
  checkIfAtBottom()
})

async function loadMore () {
    emit("fetchMore")
}

function checkIfAtBottom () {
  const element = scrollContainer.value as HTMLElement
  if (element?.scrollTop === 0) {
    emit("setChatModalAtBottomToTrue")
  }
}
async function scrollToBottom(){
  if (!scrollContainer.value) return
  setTimeout(()=>{
    scrollContainer.value?.scrollTo({
      top: scrollContainer.value.scrollHeight,
      behavior: "smooth",
    })
  },50)
}

defineExpose({
  scrollToBottom,
})

console.log("canLoadMore=",props.canLoadMore)
</script>

<template>
  <div
      ref="scrollContainer"
      class="flex flex-col-reverse overflow-y-auto pb-4 hide-scrollbar space-y-2 bg-background-900"
      :class="[height]"
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