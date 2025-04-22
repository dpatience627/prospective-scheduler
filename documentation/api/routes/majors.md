# Majors API Routes

The following documentation is for routes found in [`majors.py`](/flask-server/routes/majors.py)
* [`/api/v1/majors/`](#get-all-majors)
* [`/api/v1/major/<int:id>/`](#get-major)
* [`/api/v1/major/add/`](#add-major)
* [`/api/v1/major/delete/<int:id>/`](#delete-major)

## Get All Majors

### URL

`/api/v1/majors/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns JSON with fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| `count` | int | Number of majors in `majors` field |
| `majors` | list of [`Major`](../types/Major.md) | List of all majors in the database |

## Get Major

### URL

`/api/v1/major/<int:id>/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `id` | URL | ID of the major in the database | int |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns the corresponding [`Major`](../types/Major.md) or an [`Error`](../types/Error.md) if no class of the given `id` exists.

## Add Major

### URL

`/api/v1/major/add/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `MajorName` | JSON Body | Name of the major to add | string |
| `BelongsToDepartmentID` | JSON Body | ID of the department to which the major belongs | int |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns the newly added [`Major`](../types/Major.md) or an [`Error`](../types/Error.md) if an error occured while creating the new major.

## Delete Major

### URL

`/api/v1/major/delete/<int:id>/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `id` | URL | ID of the major in the database | int |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns a [`Success`](../types/Success.md) if the specified major was deleted or an [`Error`](../types/Error.md) if an error occured while deleting the major.