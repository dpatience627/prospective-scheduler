# Departments API Routes

The following documentation is for routes found in [`departments.py`](/flask-server/routes/departments.py)
* [`/api/v1/departments/`](#get-all-deparments)
* [`/api/v1/department/<int:id>/`](#get-department)
* [`/api/v1/department/add/`](#add-department)
* [`/api/v1/department/delete/<int:id>/"`](#delete-department)

## Get All Departments

### URL

`/api/v1/departments/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns JSON with fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| `count` | int | Number of departments in `departments` field |
| `departments` | list of [`Department`](../types/Department.md) | List of all departments in the database |

## Get Department

### URL

`/api/v1/department/<int:id>/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `id` | URL | ID of the class in the database | int |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns the corresponding [`Department`](../types/Department.md) or an [`Error`](../types/Error.md) if no department of the given `id` exists.

## Add Department

### URL

`/api/v1/department/add/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `DepartmentName` | JSON Body | Full name of the department to add | string |
| `DepartmentAbbrev` | JSON Body | Full name of the department to add | string |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO |

### Response

Returns the newly added [`Department`](../types/Department.md) or an [`Error`](../types/Error.md) if an error occured while creating the new department.

## Delete Department

### URL

`/api/v1/department/delete/<int:id>/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `id` | URL | ID of the department in the database | int |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns a [`Success`](../types/Success.md) if the specified department was deleted or an [`Error`](../types/Error.md) if an error occured while deleting the department.