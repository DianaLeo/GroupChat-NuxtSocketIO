import { io, type Socket } from "socket.io-client"

let client: Socket | null = null

export function useChatSocketClient(opt?: { path: string }): Socket {
    if (client) return client
    client = opt ? io(opt.path) : io()
    return client
}
