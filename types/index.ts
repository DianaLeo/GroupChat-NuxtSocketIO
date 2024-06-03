export type User = {
    userId: string
    socketId?: string
    username: string
    countryCode: string
    online?: boolean
    room?: string
    avatar: string
}

export type Chat = {
    id: string
    room: string
    senderId: string
    text: string
    sentTime: string
}
