# Class

The JSON structure returned by the `to_json()` function for a [`Class`](/flask-server/tables/classes.py) in the database.

| Field Name | Type | Description |
| ---------- | ---- | ----------- |
| ClassID | int | Unique ID of the class in the database |
| InBuilding | string | Name of the building where the class meets |
| InRoomNumber | string | Name of the room where the class meets |
| YearIn | int | Year during which this class meets |
| Semester | string | Semester during which this class meets |
| CourseNo | string | Course number of the class |
| Section | string | Section of the class |
| ClassName | string | Full title of the class |
| BelongsToDeptID | int | ID of the department under which this class falls |
| TaughtByID | int | ID of faculty member who teaches this class |
| IsOnline | boolean | Whether or not this class is held virtually |
| AllowInVisits | boolean | Whether or not this class should be included in prospective student visits |
| MeetingTimes | list of [`ClassMeetingTime`](./ClassMeetingTime.md)s | List of all of the days / times during the week this class is held |