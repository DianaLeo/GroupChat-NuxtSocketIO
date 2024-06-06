<script setup lang="ts">
import type {Chat} from "~/types"
import { getUserByUserId } from "~/server/utils/users"

withDefaults(
    defineProps<{
      userId: string
      chatList: Chat[]
      showAdminMessage?: boolean
    }>(),
    {showAdminMessage: true},
)
</script>

<template>
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
            v-if="chat.senderId === '0'"
            title="Admin notifications can be turned off"
        >
          <div v-if="showAdminMessage">
             <span class="text-primary-600 text-center text-xs">
                {{ chat.text }} at {{ chat.sentTime }}
            </span>
          </div>

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
                    index === chatList.length - 1 ||
                    chat.senderId !== chatList[index + 1].senderId ||
                    timeDiffIn(chat.sentTime, chatList[index + 1].sentTime, 'minutes') > 0
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
</template>
