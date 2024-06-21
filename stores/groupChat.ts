import type { Chat, ChatHistory, User } from "~/types"
import type { Socket } from "socket.io-client"

const CHAT_SOCKET_PATH = "/chat-socket/"
const { createClient, cleanUpClient } = useSocketClient(CHAT_SOCKET_PATH)
const socket = ref<Socket | null>(null)

export const useGroupChatStore = defineStore("groupChat", () => {
    const chatList = ref<Chat[]>([])
    const currentRoom = ref<string>("Global")
    const usersInRoom = ref<User[]>([])
    const historyCursor = ref<number | null>(null)
    const unreadMessageCount = ref<number>(0)
    const isScrollAtBottom = ref<boolean>(true)
    const canLoadMore = ref<boolean>(true)
    const showAdminMessage = ref<boolean>(false)
    const shouldScrollToBottom = ref<boolean>(false)

    const setCurrentRoom = (room: string) => {
        currentRoom.value = room
    }

    const changeRoom = (newRoom: string) => {
        currentRoom.value = newRoom
        chatList.value = []
        setCanLoadMore(true)
        const userId = useLoginStore().userId
        socket.value?.emit("changeRoom", userId, newRoom)
        resetUnreadMessageCount()
    }

    const updateCursor = () => {
        historyCursor.value = chatList.value.length - 1
    }

    const resetUnreadMessageCount = () => {
        unreadMessageCount.value = 0
    }

    const incrementUnreadMessageCount = () => {
        unreadMessageCount.value += 1
    }

    const setIsScrollAtBottom = (value: boolean) => {
        isScrollAtBottom.value = value
    }

    const setCanLoadMore = (value: boolean) => {
        canLoadMore.value = value
    }

    const setShowAdminMessage = (value: boolean) => {
        showAdminMessage.value = value
    }

    const setShouldScrollToBottom = (value: boolean) => {
        shouldScrollToBottom.value = value
        if (value) resetUnreadMessageCount()
    }

    const establishSocketConnection = async (isChatModalOpen: boolean) => {
        const userId = useLoginStore().userId

        socket.value = createClient()

        socket.value?.on("connect", () => {
            console.log("ws connected")
        })

        socket.value?.emit("userJoin", userId, currentRoom.value)

        socket.value?.on("history", (history: ChatHistory) => {
            chatList.value = [...chatList.value, ...history.history]
            historyCursor.value = history.endCursor
            setCanLoadMore(true)
            if (!history.hasNext) {
                setCanLoadMore(false)
            }
        })

        socket.value?.on(
            "roomUsers",
            (payload: { room: string; users: User[] }) => {
                if (currentRoom.value === payload.room)
                    usersInRoom.value = payload.users
            },
        )

        socket.value?.on("message", (newMessage: Chat) => {
            if (newMessage.room === currentRoom.value) {
                if (newMessage.senderId === userId) {
                    setShouldScrollToBottom(true)
                    chatList.value.unshift(newMessage)
                } else {
                    setShouldScrollToBottom(false)
                    if (
                        (newMessage.senderId !== "0" ||
                            showAdminMessage.value) &&
                        (!isChatModalOpen || !isScrollAtBottom.value)
                    ) {
                        console.log(isScrollAtBottom)
                        incrementUnreadMessageCount()
                    }
                    if (newMessage.senderId !== "0" || showAdminMessage.value) {
                        chatList.value.unshift(newMessage)
                    }
                }
                updateCursor()
            }
        })

        // response to user active check
        socket.value?.on("ping", () => {
            socket.value?.emit("pong")
        })

        socket.value?.on("disconnect", () => {
            console.log("ws disconnected")
        })

        socket.value?.on("connect_error", (err) => {
            console.log("ws connection error = ", err)
        })
    }

    const fetchMoreHistory = () => {
        if (historyCursor.value)
            socket.value?.emit("moreHistory", historyCursor.value)
    }

    const sendMessage = (message: string) => {
        setShouldScrollToBottom(false)
        socket.value?.emit("chatMessage", message)
    }

    const resetStates = () => {
        chatList.value = []
        currentRoom.value = ""
        usersInRoom.value = []
        historyCursor.value = 0
        unreadMessageCount.value = 0
        isScrollAtBottom.value = false
        canLoadMore.value = true
        showAdminMessage.value = false
        shouldScrollToBottom.value = false
    }

    const disconnectSocket = () => {
        if (socket.value?.connected) {
            socket.value = cleanUpClient()
            resetStates()
        }
    }

    return {
        chatList,
        currentRoom,
        usersInRoom,
        historyCursor,
        unreadMessageCount,
        isScrollAtBottom,
        canLoadMore,
        showAdminMessage,
        shouldScrollToBottom,
        setCurrentRoom,
        changeRoom,
        updateCursor,
        resetUnreadMessageCount,
        incrementUnreadMessageCount,
        setIsScrollAtBottom,
        setCanLoadMore,
        setShowAdminMessage,
        setShouldScrollToBottom,
        establishSocketConnection,
        fetchMoreHistory,
        sendMessage,
        disconnectSocket,
    }
})
