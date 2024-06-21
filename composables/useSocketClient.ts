import { io, type Socket } from "socket.io-client"

export interface useSocketClientResult {
    createClient: () => Socket | null
    cleanUpClient: () => Socket | null
}

export function useSocketClient(path: string): useSocketClientResult {
    const client = ref<Socket | null>(null)

    function createClient(): Socket | null {
        if (client.value) {
            return client.value as Socket
        }
        client.value = io({ path })
        return client.value as Socket
    }

    function cleanUpClient(): Socket | null {
        if (client.value) {
            client.value.disconnect()
            client.value = null
        }
        return client.value
    }
    return {
        createClient,
        cleanUpClient,
    }
}
