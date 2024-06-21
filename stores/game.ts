import type { Socket } from "socket.io-client"
import type { ResultPerRound } from "../types"

const GAME_SOCKET_PATH = "/game-socket/"
const { createClient, cleanUpClient } = useSocketClient(GAME_SOCKET_PATH)
const socket = ref<Socket | null>(null)

export const useGameStore = defineStore("game", () => {
    const xValues = ref<number[]>([])
    const yValues = ref<number[]>([])
    const newestYValue = ref<number>(1)
    const cashOutMultiplier = ref<number>(0)
    const resultPerRound = ref<ResultPerRound[]>([])
    const startOrStop = ref<boolean>(false)
    const countDown = ref<number | null>(null)

    const loginStore = useLoginStore()
    const { userId, loggedIn } = storeToRefs(loginStore)

    const establishSocketConnection = () => {
        if (loggedIn.value) {
            socket.value = createClient()

            socket.value?.on("connect", () => {
                console.log("game ws connected")
            })

            socket.value?.emit("userJoin", userId.value)

            socket.value?.on(
                "gameData",
                (payload: {
                    xValues: number[]
                    yValues: number[]
                    newestYValue: number
                    resultPerRound: ResultPerRound[]
                }) => {
                    xValues.value = payload.xValues
                    yValues.value = payload.yValues
                    newestYValue.value = payload.newestYValue
                    resultPerRound.value = payload.resultPerRound
                },
            )

            socket.value?.on("countDown", (payload: { countDown: number }) => {
                countDown.value = payload.countDown
            })

            socket.value?.on("stop", () => {
                startOrStop.value = false
            })

            socket.value?.on("start", () => {
                startOrStop.value = true
                countDown.value = null
            })

            socket.value?.on(
                "resultPerRound",
                (payload: {
                    multiplier: number
                    resultPerRound: ResultPerRound[]
                }) => {
                    cashOutMultiplier.value = payload.multiplier
                    resultPerRound.value = payload.resultPerRound
                },
            )

            socket.value?.on("disconnect", () => {
                console.log("game ws disconnected")
            })

            socket.value?.on("connect_error", (err) => {
                console.log("game ws connection error = ", err)
            })
        }
    }

    const cashOut = async () => {
        socket.value?.emit("cashOut", userId.value)
    }

    const resetStates = () => {
        xValues.value = []
        yValues.value = []
        newestYValue.value = 1
        cashOutMultiplier.value = 0
        resultPerRound.value = []
        startOrStop.value = false
        countDown.value = null
    }

    const disconnectSocket = () => {
        if (socket.value?.connected) {
            socket.value = cleanUpClient()
            resetStates()
        }
    }

    return {
        xValues,
        yValues,
        newestYValue,
        cashOutMultiplier,
        resultPerRound,
        startOrStop,
        countDown,
        establishSocketConnection,
        cashOut,
        disconnectSocket,
    }
})
