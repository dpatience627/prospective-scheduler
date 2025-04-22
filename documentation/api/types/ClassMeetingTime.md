# ClassMeetingTIme

The JSON structure returned by the `to_json()` function for a [`ClassMeetingTIme`](/flask-server/tables/classes.py) in the database.

| Field Name | Type | Description |
| ---------- | ---- | ----------- |
| MeetingTimeID | int | Unique ID of the class meeting time in the database |
| MeetingDays | string | A string containing the days for which this meeting time pertains (ex. 'MWF' indicates this meeting time occurs only on Mondays, Wednesdays, and Fridays) |
| StartTime | string | Start of this meeting time in `HH:MM:SS` format (in military time) |
| EndTime | string | End of this meeting time in `HH:MM:SS` format (in military time) |
| ForClassID | int | The ID of the class for which this meeting time pertains |