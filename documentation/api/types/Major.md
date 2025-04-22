# Major

The JSON structure returned by the `to_json()` function for a [`Major`](/flask-server/tables/major.py) in the database.

| Field Name | Type | Description |
| ---------- | ---- | ----------- |
| MajorID | int | Unique ID of the major in the database |
| MajorName | string | Full name of the major (ex. 'Computer Science (BS)', 'Computer Science (BA)') |
| MajorDepartment | [`Department`](./Department.md) | Department to which the major belongs |