# Student

The JSON structure returned by the `to_json()` function for a [`Student`](/flask-server/tables/student.py) in the database.

| Field Name | Type | Description |
| ---------- | ---- | ----------- |
| StudentID | int | Unique ID of the student in the database |
| Email | string | Email of the student |
| FirstName | string | The student's first name |
| LastName | string | The student's last name |
| MiddleInitial | string or null | (Optional) The student's middle initial |
| PursuingMajor | [`Major`](./Major.md) | The major the student is pursuing |