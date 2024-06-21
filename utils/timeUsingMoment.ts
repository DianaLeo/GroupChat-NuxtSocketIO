import moment from "moment/moment"

export const timeDiffIn = (
    currentTime: string,
    lastTime: string,
    unit: "minutes",
) => {
    const last = moment(lastTime, "DD/MM/YY hh:mm a")
    const current = moment(currentTime, "DD/MM/YY hh:mm a")
    return current.diff(last, unit)
}
