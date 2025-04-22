# Department

The JSON structure returned by the `to_json()` function for a [`Department`](/flask-server/tables/department.py) in the database.

| Field Name | Type | Description |
| ---------- | ---- | ----------- |
| DepartmentID | int | Unique ID of the department in the database |
| DepartmentName | string | Full name of the department (ex. 'Computer Science', 'Mechanical Engineering') |
| DepartmentAbbrev | string | Abbreviation for the name of the department, used for classes (ex. 'COMP', 'MECE') |