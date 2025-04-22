/* Drop all tables in correct order */
DROP TABLE IF EXISTS NoShowSurveys;
DROP TABLE IF EXISTS StudentVisits;
DROP TABLE IF EXISTS ClassMeetingTimes;
DROP TABLE IF EXISTS ClassVisits;
DROP TABLE IF EXISTS Classes;
DROP TABLE IF EXISTS FacultyVisits;
DROP TABLE IF EXISTS Faculty;
DROP TABLE IF EXISTS Students;
DROP TABLE IF EXISTS Visits;
DROP TABLE IF EXISTS Majors;
DROP TABLE IF EXISTS Departments;
DROP TABLE IF EXISTS Users;

/* Add all tables in correct order */
CREATE TABLE Users (
	UserID int NOT NULL AUTO_INCREMENT,
    Email varchar(63) NOT NULL UNIQUE,
    UserPriveleges int NOT NULL,
    FirstName varchar(63) NOT NULL,
    LastName varchar(63) NOT NULL,
    MiddleInitial CHAR(1),
    PRIMARY KEY(UserID)
);

CREATE TABLE Departments (
	DepartmentID int NOT NULL AUTO_INCREMENT,
    DepartmentName varchar(127) NOT NULL,
    DepartmentAbbrev char(4) NOT NULL,
    PRIMARY KEY (DepartmentID)
);

CREATE TABLE Majors (
	MajorID int NOT NULL AUTO_INCREMENT,
    MajorName varchar(127) NOT NULL,
    BelongsToDepartmentID int NOT NULL,
    PRIMARY KEY (MajorID),
    FOREIGN KEY (BelongsToDepartmentID) REFERENCES Departments(DepartmentID)
);

CREATE TABLE Visits (
	VisitID int NOT NULL AUTO_INCREMENT,
    VisitDate date NOT NULL,
	StartTime time NOT NULL,
    EndTime time NOT NULL,
    StudentFirstName varchar(63) NOT NULL,
    StudentLastName varchar(63) NOT NULL,
    StudentMiddleInitial char(1),
    IntendedMajorID int NOT NULL,
    CreatedByUserID int NOT NULL,
    PRIMARY KEY (VisitID),
    FOREIGN KEY (IntendedMajorID) REFERENCES Majors(MajorID),
    FOREIGN KEY (CreatedByUserID) REFERENCES Users(UserID)
);

CREATE TABLE Students(
	StudentID int NOT NULL AUTO_INCREMENT,
    Email varchar(63) NOT NULL UNIQUE,
    FirstName varchar(63) NOT NULL,
    LastName varchar(63) NOT NULL,
    MiddleInitial char(1),
    PursuingMajorID int NOT NULL,
    PRIMARY KEY (StudentID),
    FOREIGN KEY (PursuingMajorID) REFERENCES Majors(MajorID)
);

CREATE TABLE Faculty (
	FacultyID int NOT NULL AUTO_INCREMENT,
    Email varchar(63) NOT NULL UNIQUE,
    FirstName varchar(63) NOT NULL,
    LastName varchar(63) NOT NULL,
    MiddleInitial char(1),
    Title varchar(4) NOT NULL,
    OfficeBuilding varchar(8) NOT NULL,
    OfficeNumber varchar(8) NOT NULL,
    AllowInVisits bool NOT NULL DEFAULT(1),
    Archived bool NOT NULL DEFAULT(0),
    EmailValid bool NOT NULL DEFAULT(1),
    BelongsToDeptID int NOT NULL,
    PRIMARY KEY (FacultyID),
    FOREIGN KEY (BelongsToDeptID) REFERENCES Departments(DepartmentID)
);

CREATE TABLE FacultyVisits (
	FacultyVisitID int NOT NULL AUTO_INCREMENT,
    MeetingStatus varchar(8) NOT NULL DEFAULT("PENDING"),
    StartTime time NOT NULL,
    EndTime time NOT NULL,
    InVisitID int NOT NULL,
    WithFacultyID int NOT NULL,
    OutlookMeetingID varchar(1024),
    PRIMARY KEY (FacultyVisitID),
    FOREIGN KEY (InVisitID) REFERENCES Visits(VisitID),
    FOREIGN KEY (WithFacultyID) REFERENCES Faculty(FacultyID)
);

CREATE TABLE Classes(
	ClassID int NOT NULL AUTO_INCREMENT,
    Location varchar(200),
    YearIn int NOT NULL,
    Semester varchar(8) NOT NULL,
    CourseNo char(3) NOT NULL,
    Section char(1),
    ClassName varchar(127) NOT NULL,
    BelongsToDeptID int NOT NULL,
    TaughtByID int NOT NULL,
    IsOnline bool NOT NULL DEFAULT(0),
    AllowInVisits bool NOT NULL DEFAULT(0),
    Archived bool NOT NULL DEFAULT(0),
    PRIMARY KEY (ClassID),
    FOREIGN KEY (BelongsToDeptID) REFERENCES Departments(DepartmentID),
	FOREIGN KEY (TaughtByID) REFERENCES Faculty(FacultyID)
);

CREATE TABLE ClassVisits (
	ClassVisitID int NOT NULL AUTO_INCREMENT,
    MeetingStatus varchar(8) NOT NULL DEFAULT("PENDING"),
    InClassID int NOT NULL,
    InVisitID int NOT NULL,
    OutlookMeetingID varchar(1024),
    PRIMARY KEY (ClassVisitID),
    FOREIGN KEY (InClassID) REFERENCES Classes(ClassID),
    FOREIGN KEY (InVisitID) REFERENCES Visits(VisitID)
);

CREATE TABLE ClassMeetingTimes (
	MeetingTimeID int NOT NULL AUTO_INCREMENT,
    MeetingDays varchar(5) NOT NULL,
    StartTime time NOT NULL,
    EndTime time NOT NULL,
    ForClassID int NOT NULL,
    PRIMARY KEY (MeetingTimeID),
    FOREIGN KEY (ForClassID) REFERENCES Classes(ClassID)
);

CREATE TABLE StudentVisits (
	StudentVisitID int NOT NULL AUTO_INCREMENT,
    MeetingStatus varchar(8) NOT NULL DEFAULT("PENDING"),
    StartTime time NOT NULL,
    EndTime time NOT NULL,
    WithStudentID int NOT NULL,
    InVisitID int NOT NULL,
    OutlookMeetingID varchar(1024),
    PRIMARY KEY (StudentVisitID),
    FOREIGN KEY (WithStudentID) REFERENCES Students(StudentID),
    FOREIGN KEY (InVisitID) REFERENCES Visits(VisitID)
);

CREATE TABLE NoShowSurveys (
    SurveyID int NOT NULL AUTO_INCREMENT,
    WasNoShow bool NOT NULL DEFAULT(0),
    RecipientEmail varchar(63) NOT NULL,
    ForVisitID int NOT NULL,
    PRIMARY KEY (SurveyID),
    FOREIGN KEY (ForVisitID) REFERENCES Visits(VisitID)
);

/* Add dummy data */
INSERT INTO Users VALUES (1, "SERVICEACCT@GCC.EDU", 1, "SYSTEM", "SYSTEM", "S");
INSERT INTO Users VALUES (2, "BELLDW20@GCC.EDU", 1, "Douglas", "Bell", "W");
INSERT INTO Users VALUES (3, "HOMAJG19@GCC.EDU", 1, "Jonny", "Homa", "G");
INSERT INTO Users VALUES (4, "ALLARASSEMJJ20@GCC.EDU", 1, "Jonathan", "Allarassem", "J");
INSERT INTO Users VALUES (5, "PATIENCEDP19@GCC.EDU", 1, "Daniel", "Patience", "P");

/* Add REQUIRED undeclared department / major */
INSERT INTO Departments VALUES (1, "N/A", "N/A");
INSERT INTO Majors VALUES (1, "Undeclared", 1);

-- INSERT INTO Departments VALUES (1, "Computer Science", "COMP");
-- INSERT INTO Departments VALUES (2, "Mechanical Engineering", "MECE");

-- INSERT INTO Majors VALUES (1, "Computer Science (BS)", 1);
-- INSERT INTO Majors VALUES (2, "Mechanical Engineering (BS)", 2);

-- INSERT INTO Faculty VALUES (1, "DELLINGERBJ@gcc.edu", "Brian", "Dellinger", "J", "Dr.", "STEM", 321, TRUE, 1);

-- INSERT INTO Visits VALUES (1, '2024-05-06', '13:00:00', '16:00:00', "Philip", "Collins", "W", FALSE, 1, 2);
-- INSERT INTO Visits VALUES (2, '2026-01-02', '13:00:00', '14:00:00', "John", "Williams", "A", FALSE, 2, 2);
-- INSERT INTO Visits VALUES (3, '2026-01-03', '13:00:00', '14:00:00', "Bingus", "Bongus", "A", FALSE, 1, 3);
-- INSERT INTO Visits VALUES (4, '2026-01-04', '13:00:00', '14:00:00', "Charles", "Carlson", "B", FALSE, 2, 3);

-- INSERT INTO Classes VALUES (1, "STEM", "376", 2024, "SPRING", "422", "A", "Parallel and Distributed Computing", 1, 1, 0, 1);
-- INSERT INTO Classes VALUES (2, "STEM", "376", 2024, "SPRING", "422", "A", "Intro to AI", 1, 1, 0, 1);
-- INSERT INTO Classes VALUES (3, "STEM", "106", 2024, "SPRING", "109", "A", "Intro to Solid Modeling", 2, 1, 0, 1);
-- INSERT INTO ClassMeetingTimes VALUES (1, "MWF", "14:00:00", "15:00:00", 1);
-- INSERT INTO ClassMeetingTimes VALUES (2, "TR", "11:00:00", "12:15:00", 2);
-- INSERT INTO ClassMeetingTimes VALUES (3, "MWF", "14:00:00", "15:00:00", 3);

-- INSERT INTO ClassVisits (InClassID, InVisitID) VALUES (1, 1);

-- INSERT INTO FacultyVisits VALUES (1, "PENDING", time("13:00:00"), time("13:30:00"), 1, 1);

-- INSERT INTO Students VALUES (1, "DINGLEAB24@GCC.EDU", "Arnold", "Dingle", "B", 1);
-- INSERT INTO StudentVisits VALUES (1, "PENDING", time("13:30:00"), time("14:00:00"), 1, 1);