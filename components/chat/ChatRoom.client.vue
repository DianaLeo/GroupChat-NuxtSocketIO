<script setup lang="ts">
    import type { Chat, User } from "../../server/types"
    import { getUserByUserId } from "../../server/utils/users"

    const props = withDefaults(
        defineProps<{
            userId: string
            chatList: Chat[]
            users?: User[]
            showUsers?: boolean
            showAdminMessage?: boolean
            availableRooms?: string[]
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
    }>()

    const currentUser = getUserByUserId(props.userId)
    const currentRoom = ref(currentUser?.countryCode || props.availableRooms[1])
    const message = ref("")
    const messageListEl = ref<HTMLDivElement>()
    const socket = useChatSocketClient()
    async function sendMessage() {
        if (!message.value) return
        socket.emit("chatMessage", message.value)
        await nextTick(() => (message.value = ""))
    }

    watch(
        () => props.chatList,
        () => {
            scroll()
        },
        { deep: true },
    )

    const scroll = () => {
        nextTick(() => {
            messageListEl.value?.scrollTo(0, messageListEl.value?.scrollHeight)
        })
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
        <div
            ref="messageListEl"
            class="hide-scrollbar flex w-[400px] w-full grow flex-col space-y-2 overflow-y-auto rounded bg-background-900 pb-4"
        >
            <!-- message list-->
            <div
                v-for="(chat, index) in chatList"
                :key="index"
                class="flex"
                :class="{
                    'justify-center': chat.senderId === '0',
                    'justify-end': chat.senderId === userId,
                    'justify-start': chat.senderId !== userId,
                }"
            >
                <!-- for admin-->
                <div
                    v-if="showAdminMessage && chat.senderId === '0'"
                    title="Admin notifications can be turned off"
                >
                    <span class="text-primary-600 text-center text-xs">
                        {{ chat.text }} at {{ chat.sentTime }}
                    </span>
                </div>
                <!-- for normal users-->
                <div
                    v-else
                    class="flex flex-col"
                    :class="{
                        'items-end': chat.senderId === userId,
                        'items-start': chat.senderId !== userId,
                    }"
                >
                    <div
                        v-if="
                            index === 0 ||
                            chat.senderId !== chatList[index - 1].senderId ||
                            timeDiffIn(chat.sentTime, chatList[index - 1].sentTime, 'minutes') > 0
                        "
                        class="text-primary-600 relative mb-1.5 mt-3 space-x-3 text-xs"
                        :class="{
                            'mr-12 text-right': chat.senderId === userId,
                            'ml-12 text-left': chat.senderId !== userId,
                        }"
                    >
                        <div
                            class="text-primary-50 absolute top-5 size-9 rounded-full text-center leading-9"
                            :class="{
                                '-right-11': chat.senderId === userId,
                                '-left-11': chat.senderId !== userId,
                            }"
                            :style="{
                                backgroundColor: getUserByUserId(chat.senderId)?.avatar,
                            }"
                        >
                            {{ getUserByUserId(chat.senderId)?.username[0] }}
                        </div>
                        <div>
                            <span
                                >{{ getUserByUserId(chat.senderId)?.username }},
                                {{ chat.sentTime }}</span
                            >
                        </div>
                    </div>
                    <div
                        class="w-fit rounded-3xl px-4 py-1.5"
                        :class="{
                            'mx-12 bg-background-500': chat.senderId === userId,
                            'mx-12 bg-background-700': chat.senderId !== userId,
                        }"
                    >
                        {{ chat.text }}
                    </div>
                </div>
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
