<script setup lang="ts">
    import type { Chat, User } from "~/types"
    import { getUserByUserId } from "~/server/utils/users"

    const props = withDefaults(
        defineProps<{
            userId: string
            chatList: Chat[]
            users?: User[]
            showUsers?: boolean
            showAdminMessage?: boolean
            availableRooms?: string[]
            canLoadMore: boolean
            isInitialized: boolean
        }>(),
        {
            users: () => [],
            showUsers: true,
            showAdminMessage: true,
            availableRooms: () => ["Global", "EN", "ES", "PT", "PH", "JP"],
        },
    )

    const emit = defineEmits<{
        (e: "logout"): void
        (e: "changeRoom", newRoom: string): void
      (e: "fetchMoreHistory"): void
      (e: "updateCursor"): void
    }>()

    const currentUser = getUserByUserId(props.userId)
    const currentRoom = ref(currentUser?.countryCode || props.availableRooms[1])
    const message = ref("")
    const socket = useChatSocketClient()

    async function sendMessage() {
        if (!message.value) return
        socket.emit("chatMessage", message.value)
        emit("updateCursor")
        await nextTick(() => (message.value = ""))
        scroll()
    }
</script>

<template>
    <div class="flex flex-col">
        <!-- header-->
        <div class="my-4 flex w-[400px] justify-between">
            <div class="flex items-center space-x-3">
                <h2>{{ currentUser?.username }} in</h2>
                <select
                    v-model="currentRoom"
                    class="bg-primary-800 text-primary-50 h-fit w-28 rounded-lg px-2 py-1"
                    title="Currently global room get chat histories of all the other rooms. Requirements to be specified."
                    @change="emit('changeRoom', currentRoom)"
                >
                    <option v-for="r in availableRooms" :key="r" :value="r">{{ r }}</option>
                </select>
            </div>
            <BaseButton title="Logout" @click="emit('logout')" />
        </div>
        <!-- all users in a room-->
        <div
            v-if="showUsers"
            class="flex space-x-4 bg-background-950 p-4"
            title="All-users-in-a-room. This section can be turned off"
        >
            <div
                v-for="(u, index) in users"
                :key="index"
                class="size-9 rounded-full text-center leading-9"
                :style="{ backgroundColor: u.avatar }"
            >
                {{ u.username[0] }}
            </div>
        </div>
        <!-- main -->
      <InfiniteScroll :scroll-list="chatList" :can-load-more="canLoadMore" :is-initialized="isInitialized" :height="700" @fetch-more="emit('fetchMoreHistory')">
        <template #renderer="{scrollList}">
          <ChatList :user-id="userId" :chat-list="scrollList"/>
        </template>
      </InfiniteScroll>
        <!--editing box-->
        <form class="flex space-x-4 bg-background-500 p-4" @submit.prevent="sendMessage">
            <input
                v-model="message"
                type="text"
                class="bg-primary-500 text-primary-900 grow rounded-3xl px-4 py-1.5"
            />
            <BaseButton :ui="'size-8 rounded-full'" />
        </form>
    </div>
</template>
