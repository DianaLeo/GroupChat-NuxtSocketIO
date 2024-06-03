<script setup lang="ts">
import { type Socket } from "socket.io-client"
import type { Chat, User } from "~/types"
import { users as registeredUsers } from "../server/utils/users"

const [chatModalOpen, toggleChatModal] = useToggle(false)

const username = ref("")
const room = ref("EN")

const loggedIn = ref<boolean>(false)
const userId = ref<string>()
const errorMessage = ref<string>()

let socket: Socket | null = null
const unreadMessageCount = ref<number>(0)
const chatList = ref<Chat[]>([])
const usersInRoom = ref<User[]>([])

function login() {
  const user = registeredUsers.find((u) => u.username === username.value)
  if (user) {
    loggedIn.value = true
    userId.value = user.userId
    room.value = user.countryCode
    chatModalOpen.value = true
    establishSocketConnection()
  } else {
    errorMessage.value = "User not found"
  }
}

function logout() {
  loggedIn.value = false
  chatModalOpen.value = false
  if (socket?.connected) {
    console.log("[chat.vue]: ws disconnected after logout")
    socket?.disconnect()
  }
}

function toggleBtnClickHandler() {
  toggleChatModal()
  unreadMessageCount.value = 0
}

function establishSocketConnection() {
  socket = useChatSocketClient()
  socket.on("connect", () => {
    console.log("[chat.vue]: ws connected")
  })
  socket.emit("userJoin", userId.value, room.value)
  socket.on("history", (history: Chat[]) => {
    chatList.value = history
  })
  socket.on("roomUsers", (payload: { room: string; users: User[] }) => {
    if (room.value === payload.room) usersInRoom.value = payload.users
  })
  socket.on("message", (newMessage: Chat) => {
    if (newMessage.room === room.value) {
      if (newMessage.senderId !== userId.value && !chatModalOpen.value)
        ++unreadMessageCount.value
      chatList.value.push(newMessage)
    }
  })
}

function changeRoom(newRoom: string) {
  room.value = newRoom
  socket?.emit("changeRoom", userId.value, newRoom)
}

onBeforeUnmount(() => {
  socket?.off("connect")
  socket?.off("disconnect", () => {
    console.log("[chat.vue]: ws disconnected before unmount")
    socket?.disconnect()
  })
})
</script>

<template>
  <PageContent>
    <!-- login-->
    <div v-if="!loggedIn">
      <p class="text-blue-gr">This is a fake login page.</p>
      <p class="text-blue-gr">Registered users are VJ, Ryan, Ryo, Tianyi and Diana.</p>
      <form class="my-6 flex flex-col space-y-4" @submit.prevent="login">
        <label class="leading-none">User name:</label>
        <input
            v-model="username"
            type="text"
            class="text-primary-900 rounded-lg px-6 py-2"
        />
        <button
            type="submit"
            :disabled="!username"
            class="text-primary w-full rounded-xl bg-blue-gr py-1.5 text-center text-sm font-semibold shadow-button-glow"
        >
          Login
        </button>
        <p v-if="errorMessage" class="text-red-400">{{ errorMessage }}</p>
      </form>
    </div>
    <!-- chat room-->
    <div v-else class="relative flex w-[400px] grow flex-col">
      <button
          class="absolute -left-32"
          title="Toggle chat modal"
          @click="toggleBtnClickHandler"
      >
        <NuxtIcon name="message" class="text-3xl hover:text-neutral-50 md:text-4xl" />
        <!--notification-->
        <span
            v-if="unreadMessageCount"
            class="absolute -top-2 left-4 size-5 rounded-full bg-red-600 text-xs leading-5"
        >
                    {{ unreadMessageCount }}
                </span>
      </button>
      <ChatRoom
          v-if="chatModalOpen"
          class="max-h-[700px] grow"
          :user-id="userId"
          :chat-list="chatList"
          :users="usersInRoom"
          @logout="logout"
          @change-room="changeRoom"
      />
    </div>
  </PageContent>
</template>

<style lang="scss" scoped></style>
