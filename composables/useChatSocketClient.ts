import { io, type Socket } from "socket.io-client"

let client: Socket | null = null

export function useChatSocketClient(opt?: { path: string }): Socket {
    const socketClient = opt ? io(opt.path) : io()
    client = client ?? socketClient
    return client
}
