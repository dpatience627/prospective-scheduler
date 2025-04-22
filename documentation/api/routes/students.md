# Students API Routes

The following documentation is for routes found in [`students.py`](/flask-server/routes/students.py)
* [`/api/v1/students/`](#get-all-students)
* [`/api/v1/student/get/<int:id>/`](#get-student)
* [`/api/v1/student/add/`](#add-student)
* [`/api/v1/student/delete/<int:id>/`](#delete-student)

## Get All Students

### URL

`/api/v1/students/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns JSON with fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| `count` | int | Number of students in `students` field |
| `students` | list of [`Student`](../types/Student.md) | List of all students in the database |

## Get Student

### URL

`/api/v1/student/get/<int:id>/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `id` | URL | ID of the major in the database | int |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns the corresponding [`Student`](../types/Student.md) or an [`Error`](../types/Error.md) if no student of the given `id` exists.

## Add Student

### URL

`/api/v1/student/add/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `Email` | JSON Body | Email of the student to add | string |
| `FirstName` | JSON Body | First name of the student to add | string |
| `LastName` | JSON Body | Last name of the student to add | string |
| `MiddleInitial` | JSON Body | Middle initial of the student to add | string (optional) |
| `PursuingMajorID` | JSON Body | ID of the major the student to add is pursuing | string (optional) |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns the newly added [`Student`](../types/Student.md) or an [`Error`](../types/Error.md) if an error occured while creating the new student.

## Delete Student

### URL

`/api/v1/student/delete/<int:id>/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `id` | URL | ID of the student in the database | int |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns a [`Success`](../types/Success.md) if the specified student was deleted or an [`Error`](../types/Error.md) if an error occured while deleting the student.