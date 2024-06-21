import type { NitroApp } from "nitropack"
import { Server as Engine } from "engine.io"
import { Server, type Socket } from "socket.io"
import type { Chat } from "~/types"
import {
    getOnlineUsers,
    getRoomUsers,
    getUserBySocketId,
    userJoin,
    userLeave,
    updateUserLastActiveTime,
} from "../utils/users"

const CHAT_SOCKET_PATH = "/chat-socket/"
const INACTIVITY_LIMIT = 30000 // 30 seconds
const CHECK_INTERVAL = 10000 // 10 seconds
const PING_INTERVAL = 3000 // 3 seconds

export default defineNitroPlugin((nitroApp: NitroApp) => {
    const engine = new Engine()
    const io = new Server()
    io.bind(engine)

    io.on("connection", (socket) => {
        console.info(
            "[Server/Plugin]: Group chat web socket connected, socket.id=",
            socket.id,
        )

        // USER JOIN
        socket.on("userJoin", async (userId: string, room: string) => {
            await userJoinRoom(io, socket, userId, room)
        })

        //RECEIVE MESSAGE
        socket.on("chatMessage", async (message: string) => {
            await saveAndBroadcast(io, message, socket.id)
        })

        //CHANGE ROOM
        socket.on("changeRoom", async (userId: string, newRoom: string) => {
            userLeaveRoom(io, socket.id)
            await userJoinRoom(io, socket, userId, newRoom)
        })

        //DISCONNECT
        socket.on("disconnect", () => {
            console.info(
                "[Server/Plugin]: Group chat web socket disconnected",
                socket.id,
            )
            userLeaveRoom(io, socket.id)
        })

        // Fetch More History
        socket.on("moreHistory", async (endCursor: number) => {
            await fetchMoreHistory(socket, endCursor)
        })

        // Update last active time
        socket.on("pong", () => {
            updateUserLastActiveTime(socket.id)
        })
    })

    io.on("disconnect", () => {
        console.info("[Server/Plugin]: Group chat web socket disconnected")
    })

    io.engine.on("connection_error", (err) => {
        console.log(
            "[Server/Plugin]: Group chat web socket connection error",
            err.message,
        )
    })

    // check active users
    setInterval(() => sendPingMessages(io), PING_INTERVAL)
    // setInterval(() => checkAndKillInactiveSockets(io), CHECK_INTERVAL)

    nitroApp.router.use(
        CHAT_SOCKET_PATH,
        defineEventHandler({
            handler(event) {
                engine.handleRequest(event.node.req, event.node.res)
                event._handled = true
            },
        }),
    )
})

function formatMessage(senderId: string, text: string, room: string): Chat {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const year = String(now.getFullYear()).slice(-2)
    let hours = now.getHours()
    const minutes = String(now.getMinutes()).padStart(2, "0")
    const ampm = hours >= 12 ? "pm" : "am"

    // Convert hours to 12-hour format
    hours = hours % 12
    hours = hours ? hours : 12
    // Combine the date and time parts into the final string
    const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`

    return {
        id: "0",
        room,
        senderId: senderId,
        text,
        sentTime: formattedDateTime,
    }
}

async function userJoinRoom(
    io: Server,
    socket: Socket,
    userId: string,
    room: string,
) {
    const { getChatHistoryByRoom } = await useAsyncRedis()
    const user = userJoin(userId, room, socket.id)
    if (user) {
        socket.join(room)
        socket.broadcast
            .to(room)
            .emit(
                "message",
                formatMessage(
                    "0",
                    `${user.username} has Joined the chat`,
                    room,
                ),
            )
        io.to(room).emit("roomUsers", {
            room,
            users: getRoomUsers(room),
        })
        const parsedHistory = await getChatHistoryByRoom(room, 0)
        socket.emit("history", parsedHistory)
    }
}

function userLeaveRoom(io: Server, socketId: string) {
    const user = getUserBySocketId(socketId)
    const room = user && user.room
    userLeave(socketId)
    if (user && room) {
        io.to(room).emit(
            "message",
            formatMessage("0", `${user.username} has left the chat`, room),
        )
        io.to(room).emit("roomUsers", {
            room,
            users: getRoomUsers(room),
        })
    }
}

async function saveAndBroadcast(io: Server, message: string, socketId: string) {
    const { saveChatToHistory } = await useAsyncRedis()
    const user = getUserBySocketId(socketId)
    if (user?.room) {
        const chat = formatMessage(user.userId, message, user.room)
        io.to(user.room).emit("message", chat)
        saveChatToHistory(chat)
    }
}

async function fetchMoreHistory(socket: Socket, endCursor: number) {
    const { getChatHistoryByRoom } = await useAsyncRedis()
    const user = getUserBySocketId(socket.id)
    if (!user?.room) return
    const moreHistory = await getChatHistoryByRoom(user.room, endCursor)
    socket.emit("history", moreHistory)
}

function checkAndKillInactiveSockets(io: Server) {
    console.log("Checking inactive sockets...")
    const now = Date.now()
    const timeout = INACTIVITY_LIMIT
    const onlineUsers = getOnlineUsers()

    onlineUsers.forEach((user) => {
        if (!user.lastActiveTime || !user.socketId) return
        if (now - user.lastActiveTime > timeout) {
            const socket = io.sockets.sockets.get(user.socketId)
            if (socket) {
                console.log(`Killing inactive socket: ${socket.id}`)
                userLeaveRoom(io, socket.id)
                socket.disconnect(true)
            }
        }
    })
}

function sendPingMessages(io: Server) {
    io.emit("ping")
}
