from datetime import date, time, timedelta, datetime

def day_of_week(date: date) -> str:
    """Returns a single character corresponding to the day of the week `date`.
    In particular, this function will return the following values given the
    day that `date` corresponds to:
    | Day of `date` | `day_of_week(date)` |
    | ------------- | ------------------- |
    | Monday    | M |
    | Tuesday   | T |
    | Wednesday | W |
    | Thursday  | R |
    | Friday    | F |
    | Saturday  | S |
    | Sunday    | N |
    """
    weekdays = ['M', 'T', 'W', 'R', 'F', 'S', 'N']
    return weekdays[date.weekday()]

def times_ranges_between(start: time, end: time, increment: timedelta, length: timedelta) -> list[(time,time)]:
    startTime : timedelta = datetime.combine(date.min, start) - datetime.min
    endTime : timedelta = datetime.combine(date.min, end) - datetime.min

    times : list[(time,time)] = []
    while startTime+length <= endTime:
        thisEnd = startTime+length
        times.append((
            time_from_string(str(startTime)),
            time_from_string(str(thisEnd))
        ))
        startTime = startTime+increment
    
    return times

def time_ranges_overlap(a: tuple[time,time], b: tuple[time,time]) -> bool:
    #If either begins during the other, they overlap
    if a[0] <= b[0] <= a[1] or b[0] <= a[0] <= b[1]:
        return True
    
    #If either ends during the other, they overlap
    if a[0] <= b[1] <= a[1] or b[0] <= a[1] <= b[1]:
        return True

    #If neither of these things happen, they don't overlap
    return False

def datetime_from_time_string(time_string: str) -> datetime:
    return datetime.strptime(time_string, "%H:%M:%S")

def time_from_string(time_string: str) -> time:
    return datetime_from_time_string(time_string).time()

def datetime_range_from_string(time_range_string: str) -> tuple[datetime, datetime]:
    if time_range_string is None:
        return None
    times : list[str] = time_range_string.split('-')
    return (datetime_from_time_string(times[0]), datetime_from_time_string(times[1]))