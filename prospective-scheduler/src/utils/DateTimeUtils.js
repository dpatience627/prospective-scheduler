import dayjs from 'dayjs';

export const oneYearAgo = () => { return dayjs().subtract(1, 'year');}
export const today = () => { return dayjs(); }
export const tomorrow = () => { return dayjs().add(1, 'day'); }
export const hour = (hr) => { return dayjs().hour(hr).minute(0).second(0); }

export const formatDateForDB = (dayjsObject) => {
    return dayjsObject.format("YYYY-MM-DD");
}

export const formatDateForUser = (dayjsObject) => {
    return dayjsObject.format("MM/DD/YYYY");
}


export const formatTimeForDB = (dayjsObject) => {
    return dayjsObject.format("HH:mm:ss");
}

export const formatTimeRangeForDB = (daysjsList) => {
    return `${formatTimeForDB(daysjsList[0])}-${formatTimeForDB(daysjsList[1])}`;
}

export const formatTimeForUser = (dayjsObject) => {
    return dayjsObject.format("h:mm A");
}

export const fromDBTime = (timeStr) => {
    const parts = timeStr.split(":").map((str) => parseInt(str));
    return dayjs().hour(parts[0]).minute(parts[1]).second(0);
}

export const fromDBTimeForUser = (timeStr) => {
    return formatTimeForUser(fromDBTime(timeStr));
}

export const fromDBDateForUser = (timeStr) => {
    const parts = timeStr.split("-").map((str) => parseInt(str));
    return formatDateForUser(dayjs(new Date(parts[0], parts[1]-1, parts[2])));
}