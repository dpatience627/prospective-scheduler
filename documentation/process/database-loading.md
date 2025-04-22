# Database Loading Process


## Recreating the database
To recreate the database, run the file CreateAllTables.sql inside of the mysql instance using mysql source command: https://dev.mysql.com/doc/refman/8.0/en/mysql-batch-commands.html

This will create all of the tables and add all members of the group as users

## Loading Class + Department data

To load the class / departments data first run the file removeDataV1.sql using source command. This will remove all data in relevent tables and reset the autoincrement for the tables.

Next, use the loadDB.py file to load class and department data, this will fill all relevant tables with class and departments data.

