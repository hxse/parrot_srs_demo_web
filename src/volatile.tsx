
export function genVolatileRandom() {
    let res = Math.random()
    res = Math.random() > 0.5 ? res : -res
    res = Math.round(res * 100) / 100 //保留两位小数
    return res
}

export function DaysBetween(StartDate: Date, EndDate: Date) {
    // The number of milliseconds in all UTC days (no DST)
    const oneDay = 1000 * 60 * 60 * 24;

    // A day in UTC always lasts 24 hours (unlike in other time formats)
    const start = Date.UTC(EndDate.getFullYear(), EndDate.getMonth(), EndDate.getDate());
    const end = Date.UTC(StartDate.getFullYear(), StartDate.getMonth(), StartDate.getDate());

    // so it's safe to divide by 24 hours
    return (start - end) / oneDay;
}

export function generateVolatileDue(dueTime: Date, lastDueTime: Date, enableVolatile: boolean, volatile: number) {
    if (!enableVolatile) {
        // return dueTime
    }
    const dayDiff = DaysBetween(lastDueTime, dueTime)
    if (dayDiff <= 1) {
        return dueTime
    }
    const volatileRandom = genVolatileRandom()
    const vDays = Math.round(dayDiff * volatile * volatileRandom * 100) / 100
    const oneDay = 1000 * 60 * 60 * 24;
    const newDueTime = new Date(dueTime.getTime() + vDays * oneDay)

    const newDayDiff = DaysBetween(lastDueTime, newDueTime)
    if (newDayDiff <= 1) {
        return dueTime
    }
    console.log('dueTime', dueTime, 'newDueTime', newDueTime, 'dayDiff', dayDiff, 'vDays', vDays, 'newDayDiff', newDayDiff)

    return newDueTime
}
