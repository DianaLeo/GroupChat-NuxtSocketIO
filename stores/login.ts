import { users as registeredUsers } from '~/server/utils/users'

export const useLoginStore = defineStore('login', () => {
    const userId = ref('')
    const socketId = ref<string | null>(null)
    const username = ref('')
    const countryCode = ref('')
    const online = ref(false)
    const room = ref('')
    const avatar = ref('')
    const loggedIn = ref(false)
    const errorMessage = ref('')

    const login = async (usernameInput: string) => {
        const user = registeredUsers.find((u) => u.username === usernameInput)
        if (user) {
            loggedIn.value = true
            userId.value = user.userId
            username.value = user.username
            countryCode.value = user.countryCode
            avatar.value = user.avatar
            errorMessage.value = ''
        } else {
            errorMessage.value = 'User not found'
        }
    }

    const logout = async () => {
        loggedIn.value = false
        useGroupChatStore().disconnectSocket()
    }

    return {
        userId,
        socketId,
        username,
        countryCode,
        online,
        room,
        avatar,
        loggedIn,
        errorMessage,
        login,
        logout,
    }
})
