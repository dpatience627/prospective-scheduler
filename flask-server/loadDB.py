import json
import time
from app import app, db
from tables.faculty import Faculty
from tables.classes import Class, ClassMeetingTime
from tables.department import Department
from LogClass import LogMessage

'''
    loadDepartments
    - Creates all departments using the map contained within the function
    - Creates department objects
    - Adds all to database and inserts into DB
'''
def loadDepartments():
    print("-----------LOADING DEPARTMENT DATA-----------")
    nameDict = {
    "WRIT" : "Writing",
    "THEA" : "Theatre",
    "STAT" : "Statistics",
    "SSFT" : "Science, Faith & Technology",
    "SPAN" : "Spanish",
    "SOCW" : "Social Work",
    "SOCI" : "Sociology",
    "SEDU" : "Special Education",
    "SCIC" : "Natural Sciences",
    "ROBO" : "Robotics",
    "RELI" : "Religion",
    "PUBH" : "Public Health",
    "PSYC" : "Psychology",
    "POLS" : "Political Science",
    "PHYS" : "Physics",
    "PHYE" : "Physical Education",
    "PHIL" : "Philosophy",
    "NURS" : "Nursing",
    "MUSI" : "Music",
    "MUSE" : "Music Education",
    "MNGT" : "Management",
    "MODL" : "Modern Languages",
    "MECE" : "Mechanical Engineering",
    "MATH" : "Mathematics",
    "MARK" : "Marketing",
    "LATN" : "Latin",
    "INBS" : "International Business",
    "HUMA" : "Humanities",
    "HIST" : "History",
    "HEBR" : "Hebrew",
    "GEOL" : "Geology",
    "GOBL" : "Global Studies",
    "GREK" : "Greek",
    "FREN" : "French",
    "FNCE" : "Finance",
    "EXER" : "Exercise Science",
    "ENTR" : "Entrepreneurship",
    "ENGR" : "Engineering",
    "ENGL" : "English",
    "ELEE" : "Electrical Engineering",
    "EDUC" : "Education",
    "ECON" : "Economics",
    "DSCI" : "Data Science",
    "DESI" : "Design",
    "COMP" : "Computer Science",
    "COMM" : "Communication",
    "CMIN" : "Christian Ministries",
    "CHEM" : "Chemistry",
    "BIOL" : "Biology",
    "ASTR" : "Astronomy",
    "ART" : "Art",
    "ACCT" : "Accounting",
    "ABRD" : "Abroad",
    "BARS" : "Biblical & Religious Studies",
    "n/a" : "N/A"
}
    departmentList  = []
    for abbr, full in nameDict.items():
        with app.app_context():
            check_if_exists = Department.query.filter(Department.DepartmentAbbrev == abbr).first()
            print(check_if_exists)
            if(check_if_exists is None):
                toAdd = Department(DepartmentName=full, DepartmentAbbrev = abbr)
                departmentList.append(toAdd)
            else:
                print("EXISTS")
    with app.app_context():
        try:
            db.session.add_all(departmentList)
            db.session.commit()
        except:
            print("ERROR ADDING DEPARTMENTS")
    print("-----------DEPARTMENT DATA LOADED-----------")
    
#Looks at faculty.json file and opens and adds all faculty to db *NEEDS DEPARTMENTS FIRST*
'''
    loadFaculty
    - Looks through faculty JSON file and adds all to DB
'''
@LogMessage
def loadFaculty(file_location):
    print("-----------LOADING FACULTY DATA-----------")
    f = open(file_location, encoding="utf8")
    facData = json.load(f)
    facultyList = []
    for member in facData['faculty']:
        with app.app_context():  
            deptID = Department.query.filter_by(DepartmentAbbrev=member['dept']).first()
        toAdd = Faculty(Email=member['email'], FirstName=member['firstName'], LastName=member['lastName'],MiddleInitial=member['middleInitial'],Title=member['title'],OfficeBuilding=member['officeBuilding'],OfficeNumber=member['officeNumber'],AllowInVisits=True,Archived=False,BelongsToDeptID=deptID.DepartmentID)
        facultyList.append(toAdd)
    with app.app_context():
        try:
            db.session.add_all(facultyList)
            db.session.commit()
        except Exception as e:
            print("ERROR ADDING FACULTY")
            print(e)
            exit(0)
    print("-----------FACULTY DATA LOADED-----------")

'''
    main
    - Runs functions in correct order:
    1. Departments
    2. Faculty
    3. Classes
    4. Meetings
    Note: Also keeps track of how long the program runs for in seconds (I think seconds)
'''
def main(): 
    print("-----------START OF PROGRAM-----------")
    startTime = time.time()
    loadDepartments()
    #loadFaculty('faculty.json')

    #with open('classes.json') as class_json_file:
    #    class_data_json = json.loads(class_json_file.read())
    #    loadClasses(class_data_json)
    print("-----------END OF PROGRAM-----------")
    print(f"Program Runtime: {time.time() - startTime} Seconds")

loadDepartments()