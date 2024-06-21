/* Example usage
const currentTime = "14/06/24 02:30 pm"
const lastTime = "14/06/24 01:15 pm"
const unit = "minutes"
timeDiffIn(currentTime, lastTime, unit)*/

const parseDateTime = (dateTimeStr: string) => {
    const [dateStr, hoursStr, minutesStr, ampm] = dateTimeStr.split(/[\s:]+/)
    const [dayStr, monthStr, yearStr] = dateStr.split("/")

    let hours = parseInt(hoursStr, 10)
    const minutes = parseInt(minutesStr, 10)
    const year = parseInt(`20${yearStr}`, 10)
    const month = parseInt(monthStr, 10)
    const day = parseInt(dayStr, 10)

    // Convert hours to 24-hour format
    if (ampm.toLowerCase() === "pm" && hours !== 12) {
        hours += 12
    }
    if (ampm.toLowerCase() === "am" && hours === 12) {
        hours = 0
    }

    return new Date(year, month - 1, day, hours, minutes)
}

export const timeDiffIn = (
    currentTime: string,
    lastTime: string,
    unit: "minutes",
) => {
    const last: Date = parseDateTime(lastTime)
    const current: Date = parseDateTime(currentTime)
    const diffInMs: number = current.getTime() - last.getTime()

    if (unit === "minutes") {
        return diffInMs / 1000 / 60
    }

    return diffInMs
}
