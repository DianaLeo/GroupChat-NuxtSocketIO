<script setup lang="ts">
import { type Socket } from "socket.io-client"
import type {Chat, ChatHistory, User} from "~/types"
import { users as registeredUsers } from "../server/utils/users"

const [chatModalOpen, toggleChatModal] = useToggle(false)

let socket: Socket | null = null
const username = ref("")
const room = ref("Global")

const loggedIn = ref<boolean>(false)
const userId = ref<string>()
const errorMessage = ref<string>()

const unreadMessageCount = ref<number>(0)
const chatList = ref<Chat[]>([])
const usersInRoom = ref<User[]>([])
const endCursor = ref<number>(0)
const canLoadMore = ref<boolean>(true)
const chatModalAtBottom = ref<boolean>(false)
const chatRoomComponent = ref()
const showAdminMessage = ref<boolean>(false)

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
  resetUnreadMessageCount()
}

function resetUnreadMessageCount(){
  unreadMessageCount.value = 0
}

function establishSocketConnection() {
  socket = useChatSocketClient()
  socket.on("connect", () => {
    console.log("[chat.vue]: ws connected")
  })
  socket.emit("userJoin", userId.value, room.value)
  socket.on("history", (history: ChatHistory) => {
    chatList.value = [...chatList.value,...history.history]
    endCursor.value = history.endCursor
    if (!history.hasNext) {
      canLoadMore.value = false
    }
  })
  socket.on("roomUsers", (payload: { room: string; users: User[] }) => {
    if (room.value === payload.room) usersInRoom.value = payload.users
  })
  socket.on("message", (newMessage: Chat) => {
    if (newMessage.room === room.value) {
      // If receiver chat modal is closed, or receiver scrollbar is not on the bottom, show unread message count
      if (newMessage.senderId === "0"){
        showAdminMessage.value && ++unreadMessageCount.value
      }else if (
          newMessage.senderId !== userId.value && !chatModalOpen.value ||
          newMessage.senderId !== userId.value && !chatModalAtBottom.value
      ) {
        ++unreadMessageCount.value
      }
      chatList.value.unshift(newMessage)
      // On sending a msg, sender should scroll to bottom, receivers should not
      if (newMessage.senderId === userId.value) chatRoomComponent.value?.scrollToBottom()
      // To avoid duplicate history being fetched
      updateCursor()
    }
  })
}

function changeRoom(newRoom: string) {
  room.value = newRoom
  chatList.value = []
  canLoadMore.value = true
  socket?.emit("changeRoom", userId.value, newRoom)
}

onBeforeUnmount(() => {
  socket?.off("connect")
  socket?.off("disconnect", () => {
    console.log("[chat.vue]: ws disconnected before unmount")
    socket?.disconnect()
  })
})

function fetchMoreHistory() {
  socket?.emit("moreHistory", endCursor.value)
}

function updateCursor(){
  endCursor.value = chatList.value.length - 1
}

function setChatModalAtBottomToTrue(){
  chatModalAtBottom.value = true
}
</script>

<template>
  <div class="h-screen">
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
    <div v-else class="relative flex w-[400px] h-full grow flex-col">
      <button
          class="absolute -left-32"
          title="Toggle chat modal"
          @click="toggleBtnClickHandler"
      >
        <NuxtIcon name="message" class="text-3xl hover:text-neutral-50 md:text-4xl" />
        <!--notification-->
        <span
            v-if="unreadMessageCount && !chatModalOpen"
            class="absolute -top-2 left-4 size-5 rounded-full bg-red-600 text-xs leading-5"
        >
                    {{ unreadMessageCount }}
                </span>
      </button>
      <ChatRoom
          ref="chatRoomComponent"
          v-if="chatModalOpen"
          class="max-h-full grow"
          :user-id="userId"
          :room="room"
          :chat-list="chatList"
          :users="usersInRoom"
          :can-load-more="canLoadMore"
          :unread-message-count="unreadMessageCount"
          :show-admin-message="showAdminMessage"
          @logout="logout"
          @change-room="changeRoom"
          @fetch-more-history="fetchMoreHistory"
          @update-cursor="updateCursor"
          @reset-unread-message-count="resetUnreadMessageCount"
          @set-chat-modal-at-bottom-to-true="setChatModalAtBottomToTrue"
      />
    </div>
  </div>
</template>
