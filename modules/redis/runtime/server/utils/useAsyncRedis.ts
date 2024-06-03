import consola from "consola"
import { createClient, type RedisClientType } from "redis"
import type { Chat } from "~/types"
import type { RedisConfig } from "../../../types"

const CHAT_HISTORY_KEY = "chatHistory"
let client: RedisClientType | null = null
let isReady: boolean = false
const logger = consola.withTag("redis")

interface AsyncRedisResult {
    client: RedisClientType | null
    getAllChatHistory: () => Promise<Chat[]>
    getChatHistoryByRoom: (room: string) => Promise<Chat[]>
    saveChatToHistory: (chat: Chat) => void
}

async function initRedis(redisConfig: RedisConfig): Promise<RedisClientType> {
    const redisClient = createClient({
        url: `redis://${redisConfig.host}:${redisConfig.port}`,
    })
    // logger.success("redisClient initialized = ", redisClient)
    redisClient.on("connect", () =>
        logger.success("Redis server TCP connection established"),
    )
    redisClient.on("reconnecting", () => logger.info("Redis reconnecting"))
    redisClient.on("error", (err) =>
        logger.error(
            "Redis client error. Make sure redis-server is running.",
            err,
        ),
    )
    redisClient.on("ready", () => {
        isReady = true
        logger.info("Redis client initialized")
    })
    await redisClient.connect()
    return redisClient as RedisClientType
}

async function getListByKey(key: string): Promise<string[]> {
    try {
        return client && isReady ? (await client.lRange(key, 0, -1)) ?? [] : []
    } catch (e) {
        console.error("Redis get history error.", e)
        return []
    }
}

async function pushToListByKey(key: string, value: string, toEnd: "L" | "R") {
    try {
        client &&
            isReady &&
            (toEnd === "L"
                ? await client.lPush(key, value)
                : await client.rPush(key, value))
    } catch (e) {
        console.error("Redis save new chat to history error.", e)
    }
}

async function useAsyncRedis(): Promise<AsyncRedisResult> {
    const runtimeConfig = useRuntimeConfig()
    client = client ?? (await initRedis(runtimeConfig.redis))
    const getAllChatHistory = async (): Promise<Chat[]> => {
        const chatHistory = await getListByKey(CHAT_HISTORY_KEY)
        return chatHistory?.map((chat: string) => JSON.parse(chat)) ?? []
    }
    const getChatHistoryByRoom = async (room: string): Promise<Chat[]> => {
        const parsedHistory = await getAllChatHistory()
        return parsedHistory.filter((chat: Chat) => chat.room === room)
    }
    const saveChatToHistory = async (chat: Chat) => {
        await pushToListByKey(CHAT_HISTORY_KEY, JSON.stringify(chat), "R")
    }
    return {
        client,
        getAllChatHistory,
        getChatHistoryByRoom,
        saveChatToHistory,
    }
}

export default useAsyncRedis
