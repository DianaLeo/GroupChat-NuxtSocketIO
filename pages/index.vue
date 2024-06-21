<script setup lang="ts">
import { useGroupChatStore } from "~/stores/groupChat"
import { useLoginStore } from "~/stores/login"

const groupChatStore = useGroupChatStore()
const gameStore = useGameStore()
const loginStore = useLoginStore()
const [chatModalOpen, toggleChatModal] = useToggle(false)

const { unreadMessageCount } = storeToRefs(groupChatStore)
const { loggedIn, countryCode, errorMessage } = storeToRefs(loginStore)

const username = ref("")

async function login() {
  await loginStore.login(username.value)
  if (loggedIn.value) {
    chatModalOpen.value = true
    groupChatStore.setCurrentRoom(countryCode.value)
    await groupChatStore.establishSocketConnection(chatModalOpen.value)
    gameStore.establishSocketConnection()
  }
}

async function logout() {
  chatModalOpen.value = false
  await loginStore.logout()
}

function toggleBtnClickHandler() {
  toggleChatModal()
  groupChatStore.resetUnreadMessageCount()
}

onBeforeUnmount(() => {
  groupChatStore.disconnectSocket()
})
</script>

<template>
  <div class="absolute h-full w-full">
    <!--         login-->
    <div v-if="!loggedIn" class="mx-auto w-[400px]">
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
    <div v-if="loggedIn" class="fixed right-0 h-full w-[400px]">
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
      <ChatRoom v-if="chatModalOpen" class="h-full" @logout="logout" />
    </div>
    <GameView v-if="loggedIn" />
  </div>
</template>
