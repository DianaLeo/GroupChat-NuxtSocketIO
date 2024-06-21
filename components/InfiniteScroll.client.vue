<script setup lang="ts">
import { useGroupChatStore } from "~/stores/groupChat"

const groupChatStore = useGroupChatStore()
const { canLoadMore: canLoadMoreHistory, shouldScrollToBottom } = storeToRefs(groupChatStore)

const props = withDefaults(
    defineProps<{
      ui?: {
        height?: string
      }
    }>(),
    {
      ui: () => ({}),
    },
)

const height = useTailwindMerged("h-[700px]", () => props.ui.height ?? "")

const scrollContainer = ref<HTMLElement | null>(null)

useInfiniteScroll(scrollContainer, loadMore, {
  direction: "top",
  canLoadMore: () => canLoadMoreHistory.value,
})

useEventListener(scrollContainer, "scroll", () => {
  checkIfAtBottom()
})

onMounted(async () => {
  checkIfAtBottom()
})

async function loadMore() {
  groupChatStore.setCanLoadMore(false)
  groupChatStore.fetchMoreHistory()
}

function checkIfAtBottom() {
  if (scrollContainer.value) {
    if (scrollContainer.value.scrollTop > -30) {
      groupChatStore.setIsScrollAtBottom(true)
    } else {
      groupChatStore.setIsScrollAtBottom(false)
    }
  }
}

async function scrollToBottom() {
  if (!scrollContainer.value) return
  setTimeout(() => {
    scrollContainer.value?.scrollTo({
      top: scrollContainer.value.scrollHeight,
      behavior: "smooth",
    })
  }, 50)
}

watchEffect(() => {
  shouldScrollToBottom.value && scrollToBottom()
})
</script>

<template>
  <div
      ref="scrollContainer"
      class="hide-scrollbar flex flex-col-reverse space-y-2 overflow-y-auto bg-background-900 pb-4"
      :class="[height]"
  >
    <slot name="renderer"></slot>
    <div v-if="!canLoadMoreHistory" class="text-center">No More History</div>
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
