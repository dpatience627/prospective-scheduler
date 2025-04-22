/*
This file will do the following:
1. Remove all current data in the following tables
	- Departments
	- Classes
    - Faculty
    - ClassMeetingTimes
2. Reset the auto-increment for ID's back down to 1
*/
delete from ClassMeetingTimes;
delete from Classes;
delete from Faculty;
delete from Departments;

alter table Departments auto_increment = 1;
alter table Classes auto_increment = 1;
alter table Faculty auto_increment = 1;
alter table ClassMeetingTimes auto_increment = 1;
