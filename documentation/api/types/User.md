# User

The JSON structure returned by the `to_json()` function for a [`User`](/flask-server/tables/user.py) in the database.

| Field Name | Type | Description |
| ---------- | ---- | ----------- |
| UserID | int | Unique ID of the user in the database |
| Email | string | Email of the user |
| UserPriveleges | "Base User" or "Admin User" | The priveleges the user has, as a string |
| FirstName | string | First name of the user |
| LastName | string | Last name of the user |
| MiddleInitial | string or null | Middle initial of the user |