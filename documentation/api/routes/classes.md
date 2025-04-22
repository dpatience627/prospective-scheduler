# Class API Routes

The following documentation is for routes found in [`classes.py`](/flask-server/routes/classes.py)
* [`/api/v1/classes/`](#get-all-classes)
* [`/api/v1/class/<int:id>/`](#get-class)

## Get All Classes

### URL

`/api/v1/classes/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns JSON with fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| `count` | int | Number of classes in `classes` field |
| `classes` | list of [`Class`](../types/Class.md) | List of all classes in the database |

## Get Class

### URL

`/api/v1/class/<int:id>/`

### Inputs

| Input | Location | Description | Type |
| ----- | -------- | ----------- | ---- |
| `id` | URL | ID of the class in the database | int |
| `idToken` | JSON Body | ID Token for user from Microsoft SSO | string |

### Response

Returns the corresponding [`Class`](../types/Class.md) or an [`Error`](../types/Error.md) if no class of the given `id` exists.