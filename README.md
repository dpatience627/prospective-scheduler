### Developer Setup

A few preliminary items are required to run / test Prospective Scheduler in your development environment.
First, the following python packages must be installed using pip:

- Flask
- Flask-SQLAlchemy
- Flask-CORS
- PyMySQL
- cryptography
- msal
- asyncio
- azure-identity
- msgraph-sdk
- tabula
- pdfplumber
- APScheduler

Additionally, one must have a local instance of the MySQL database running as a service on port 3306 (default MySQL port).
To properly connect to this local instance, you must add a `config.json` to the `flask-server` directory.

### Config File

In the `flask-server` directory, add a file named `config.json` with the following structure

```
{
    "db_config": {
        "user": <user to login to the MySQL server as>,
        "password": <password for the above user>,
        "address": <address to the MySQL server (can be localhost)>,
        "database": <name of the Prospective Scheduler database on the MySQL server>
    },
    "app_config": {
        "cors_origins": <"*" for dev, the VM has the correct origins set :)>
    },
    "graph_config": {
        "clientID": <inquire for this string>,
        "tenantID": <inquire for this string>,
        "clientSecret": <inquire for this string>,
        "email": "svc_CS_Scheduler@gcc.edu",
        "password": <inquire for this string>, 
        "scopes": "User.Read Mail.Send Calendars.ReadBasic"
    }
}
```

Note that all values in `config.json` are strings, and that `config.json` is not tracked by git.