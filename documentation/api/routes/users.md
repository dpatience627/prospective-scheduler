# Users API Routes

The following documentation is for routes found in [`users.py`](/flask-server/routes/users.py)
* [`/api/v1/users/`](#get-all-users)
* [`/api/v1/user/<int:id>/`](#get-user)
* [`/api/v1/user/add/`](#add-user)
* [`/api/v1/user/delete/<int:id>/`](#delete-user)

## Get All Users

### URL

`/api/v1/users/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns JSON with fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| `count` | int | Number of users in `users` field |
| `users` | list of [`User`](../types/User.md) | List of all users in the database |

## Get User

### URL

`/api/v1/user/<int:id>/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `id` | URL | ID of the user in the database | int |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns the corresponding [`User`](../types/User.md) or an [`Error`](../types/Error.md) if no user of the given `id` exists.

## Add User

### URL

`/api/v1/user/add/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `Email` | JSON Body | Email of the user to add | string |
| `FirstName` | JSON Body | First name of the user to add | string |
| `LastName` | JSON Body | Last name of the user to add | string |
| `MiddleInitial` | JSON Body | Middle initial of the user to add | string (optional) |
| `UserPriveleges` | JSON Body | The privelege level of the user to add | 0 or 1 (0 for base user, 1 for admin) |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns the newly added [`User`](../types/User.md) or an [`Error`](../types/Error.md) if an error occured while creating the new user.

## Delete User

### URL

`/api/v1/user/delete/<int:id>/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `id` | URL | ID of the user in the database | int |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns a [`Success`](../types/Success.md) if the specified user was deleted or an [`Error`](../types/Error.md) if an error occured while deleting the user.