import type { NitroApp } from "nitropack"
import { Server as Engine } from "engine.io"
import { Server } from "socket.io"
import { ResultPerRound } from "../../types"

const GAME_SOCKET_PATH = "/game-socket/"
const GAME_NAME = "Crash"
const SUSPEND_INTERVAL = 6000

let x = 0
let exp = "Math.pow(x,1.8)/50+1"
let xValues: number[] = []
let yValues: number[] = []
let newestYValue = 1
let countDown = SUSPEND_INTERVAL / 1000
let gameTimer: ReturnType<typeof setInterval> | undefined = undefined
let resultPerRound: ResultPerRound[] = []

export default defineNitroPlugin((nitroApp: NitroApp) => {
    const engine = new Engine()
    const io = new Server()
    io.bind(engine)

    startRandomIntervalTimer(io)

    io.on("connection", (socket) => {
        console.info(
            "[Server/Plugin]: Game web socket connected, socket.id=",
            socket.id,
        )

        // USER JOIN
        socket.on("userJoin", async (userId: string) => {
            console.log("userJoin", userId)
            socket.join(GAME_NAME)
            io.to(GAME_NAME).emit("resultPerRound", {
                multiplier: 0,
                resultPerRound,
            })
        })

        // CASH OUT
        socket.on("cashOut", (userId: string) => {
            console.log(
                "[Server/Plugin]: Game web socket cashOut event received, newestYValue = ",
                newestYValue,
            )
            resultPerRound.push({
                userId,
                cashOutX: x.toFixed(2) as unknown as number,
                multiplier: newestYValue,
            })
            io.to(GAME_NAME).emit("resultPerRound", {
                multiplier: newestYValue,
                resultPerRound,
            })
        })
    })

    io.on("disconnect", () => {
        console.info("[Server/Plugin]: Game web socket disconnected")
    })

    io.engine.on("connection_error", (err) => {
        console.log(
            "[Server/Plugin]: Game web socket connection error",
            err.message,
        )
    })

    nitroApp.router.use(
        GAME_SOCKET_PATH,
        defineEventHandler({
            handler(event) {
                engine.handleRequest(event.node.req, event.node.res)
                event._handled = true
            },
        }),
    )
})

function startRandomIntervalTimer(io: Server) {
    function setNextTimer() {
        const randomTimeInterval = getRandomTimeInterval()
        const timer = setTimeout(() => {
            stopGame(io)
            startCountDown(io)
            const suspendTimer = setTimeout(() => {
                restartGame(io)
                setNextTimer() // Calculate a new interval and set the timer again
                clearTimeout(suspendTimer)
            }, SUSPEND_INTERVAL)
            clearTimeout(timer)
        }, randomTimeInterval)
    }
    restartGame(io)
    setNextTimer() // Start the first timer
}

function getRandomTimeInterval() {
    const interval = Math.random() * 20 * 1000
    console.log(`Next timer set for: ${interval.toFixed(2)} ms`)
    return interval
}

function restartGame(io: Server) {
    console.log("STARTING GAME")
    io.to(GAME_NAME).emit("start", { message: "restart" })

    x = 0
    xValues = []
    yValues = []
    newestYValue = 1
    resultPerRound = []

    gameTimer = setInterval(() => {
        const y = eval(exp)
        xValues.push(x)
        yValues.push(y)
        newestYValue = y.toFixed(2)
        io.to(GAME_NAME).emit("gameData", {
            xValues,
            yValues,
            newestYValue,
            resultPerRound,
        })
        x += 0.05
    }, 50)
}

function stopGame(io: Server) {
    console.log("STOPPING GAME")
    gameTimer && clearInterval(gameTimer)
    io.to(GAME_NAME).emit("stop", { message: "stop" })
}

function startCountDown(io: Server) {
    countDown = SUSPEND_INTERVAL / 1000
    const countDownTimer = setInterval(() => {
        countDown--
        console.log("Counting Down", countDown)
        io.to(GAME_NAME).emit("countDown", { countDown })
        if (countDown === 1) clearInterval(countDownTimer)
    }, 1000)
}
