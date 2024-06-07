<script setup lang="ts">
    import {useGroupChatStore} from "~/stores/groupChat"
    import {useLoginStore} from "~/stores/login";

    const groupChatStore = useGroupChatStore()
    const loginStore = useLoginStore()

    const { currentRoom, usersInRoom, unreadMessageCount } = storeToRefs(groupChatStore)
    const {username} = storeToRefs(loginStore)

    withDefaults(
        defineProps<{
            showUsers?: boolean
            availableRooms?: string[]
        }>(),
        {
            showUsers: true,
            availableRooms: () => ["Global", "EN", "ES", "PT", "PH", "JP"],
        },
    )

    const emit = defineEmits<{
        (e: "logout"): void
    }>()

    const room = ref(currentRoom.value)
    const message = ref("")
    const InfiniteScrollComponent = ref()

    async function sendMessage() {
        if (!message.value) return
        groupChatStore.sendMessage(message.value)
        groupChatStore.updateCursor()
        await nextTick()
        message.value = ""
    }
</script>

<template>
    <div class="flex flex-col">
        <!-- header-->
        <div class="my-4 flex w-[400px] justify-between">
            <div class="flex items-center space-x-3">
                <h2>{{ username }} in</h2>
                <select
                    v-model="room"
                    class="bg-primary-800 text-primary-50 h-fit w-28 rounded-lg px-2 py-1"
                    title="Currently global room get chat histories of all the other rooms. Requirements to be specified."
                    @change="groupChatStore.changeRoom(room)"
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
                v-for="(u, index) in usersInRoom"
                :key="index"
                class="size-9 rounded-full text-center leading-9"
                :style="{ backgroundColor: u.avatar }"
            >
                {{ u.username[0] }}
            </div>
        </div>
        <!-- main -->
        <InfiniteScroll
            ref="InfiniteScrollComponent"
            :ui="{height:'h-[700px]'}"
        >
          <template #renderer>
            <ChatList/>
          </template>
        </InfiniteScroll>
        <!-- unread message count-->
        <div class="relative">
          <div v-if="unreadMessageCount>0"
               class="absolute left-1/2 -translate-x-1/2 bottom-[9px] w-10 h-7 bg-blue-gr text-center leading-7 mx-auto rounded-lg after:absolute after:-bottom-[8px] after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0 after:border-0 after:border-l-[10px] after:border-r-[10px] after:border-l-transparent after:border-r-transparent after:border-t-[10px] after:border-t-blue-gr"
               @click="groupChatStore.setShouldScrollToBottom(true)"
          >
            {{unreadMessageCount}}
          </div>
        </div>
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
