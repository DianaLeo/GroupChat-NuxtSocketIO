import type { NitroApp } from "nitropack"
import { Server as Engine } from "engine.io"
import { Server, type Socket } from "socket.io"
import { defineEventHandler } from "h3"
import { defineNitroPlugin } from "nitropack/dist/runtime/plugin"
import type { Chat } from "~/types"
import moment from "moment/moment"
import {
    getRoomUsers,
    getUserBySocketId,
    userJoin,
    userLeave,
} from "../utils/users"

export default defineNitroPlugin((nitroApp: NitroApp) => {
    const engine = new Engine()
    const io = new Server({connectionStateRecovery:{maxDisconnectionDuration:1000}})
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
            console.info("[Server/Plugin]: Group chat web socket disconnected",socket.id)
            userLeaveRoom(io, socket.id)
        })

        // Fetch More History
        socket.on("moreHistory", async (endCursor: number) => {
            await fetchMoreHistory(socket,endCursor)
        })
    })

    nitroApp.router.use(
        "/socket.io/",
        defineEventHandler({
            handler(event) {
                engine.handleRequest(event.node.req, event.node.res)
                event._handled = true
            },
        }),
    )
})

function formatMessage(senderId: string, text: string, room: string): Chat {
    return {
        id: "0",
        room,
        senderId: senderId,
        text,
        sentTime: moment().format("DD/MM/YY hh:mm a"),
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
        const parsedHistory = await getChatHistoryByRoom(room)
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

async function fetchMoreHistory(
    socket: Socket,
    endCursor: number,
) {
    const { getChatHistoryByRoom } = await useAsyncRedis()
    const user = getUserBySocketId(socket.id)
    if (!user?.room) return
    const moreHistory = await getChatHistoryByRoom(user.room, endCursor)
    socket.emit("history", moreHistory)
}