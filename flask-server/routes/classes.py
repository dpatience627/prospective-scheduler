from flask import jsonify
from app import app, db
from tables.classes import Class, ClassMeetingTime
from tables.faculty import Faculty
from tables.department import Department
from routes.routeutils import *
import loadDB
import re
import requests
from LogClass import LogMessage

@app.post("/api/v1/classes/")
@authorize
@LogMessage
def get_all_classes():
    allClasses: list[Class] = Class.query.filter(Class.Archived == False).all()
    return jsonify({
        "count" : len(allClasses),
        "classes" : [class_entry.to_json() for class_entry in allClasses]
    })

@app.post("/api/v1/class/<int:id>/")
@authorize
@LogMessage
def get_class(id):
    class_entry: Class = Class.query.get(id)
    if not class_entry:
        return api_id_error(id, "Class")
    return jsonify(class_entry.to_json())

@app.post("/api/v1/class/add/")
@authorize
@LogMessage
def add_class():
    try:
        class_to_add : Class = Class.from_json(request.json)
    except:
        return api_construct_error("Class")

    try:
        db.session.add(class_to_add)
        db.session.commit()
    except Exception as e:
        return api_error(str(e))
    
    return jsonify(class_to_add.to_json())

@app.post("/api/v1/class/meetingtime/add/")
@authorize
@LogMessage
def add_class_meeting_time():
    try:
        meeting_time : ClassMeetingTime = ClassMeetingTime.from_json(request.json)
    except:
        return api_construct_error("ClassMeetingTime")
    
    try:
        db.session.add(meeting_time)
        db.session.commit()
    except Exception as e:
        return api_error(str(e))
    
    return jsonify(meeting_time.to_json())

@app.post("/api/v1/class/edit/")
@authorize
@LogMessage
def edit_class():
    try:
        classID = request.json['ClassID']
        classToEdit : Class = Class.query.get(classID)
        if not classToEdit:
            return api_id_error(classID, "Class")
        
        classToEdit.Location = request.json["Location"]
        classToEdit.YearIn = int(request.json["YearIn"])
        classToEdit.Semester = request.json["Semester"]
        classToEdit.CourseNo = request.json["CourseNo"]
        classToEdit.Section = request.json["Section"]
        classToEdit.ClassName = request.json["ClassName"]
        classToEdit.BelongsToDeptID = int(request.json["BelongsToDeptID"])
        classToEdit.TaughtByID = int(request.json["TaughtByID"])
        classToEdit.IsOnline = bool(request.json["IsOnline"])
        classToEdit.AllowInVisits = bool(request.json["AllowInVisits"])
    except Exception as e:
        return api_error(str(e))
    
    db.session.add(classToEdit)
    db.session.commit()

    return jsonify(classToEdit.to_json())

@app.delete("/api/v1/class/delete/<int:id>/")
@authorize
@LogMessage
def delete_class(id):
    classToDelete : Class = Class.query.get(id)

    if not classToDelete:
        return api_id_error(id, "Class")
    
    #Delete all related class visits & meeting times
    for meetingTime in classToDelete.meetingTimes:
        db.session.delete(meetingTime)
    
    for classVisit in classToDelete.classVisitsIn:
        db.session.delete(classVisit)
    db.session.commit()

    #Then delete the class now that all FK relations are gone
    db.session.delete(classToDelete)
    db.session.commit()

    return api_confirm_delete(id, "Class")

'''
    Note that this function is meant to mock the MyGCC API for the time being,
    returning static json from the classes.json file currently in prospective-scheduler.
'''
@app.get("/api/v1/mygcc/classes/")
@LogMessage
def mygcc_api_get_all_classes():
    with open("classes.json") as classes_json:
        try:
            response = app.response_class(
                response=classes_json.read(),
                status=200,
                mimetype='application/json'
            )
            return response
        except Exception as e:
            return api_error("Couldn't get classes from MyGCC API")

@app.post("/api/v1/classes/refresh/")
@authorize
@LogMessage
def refresh_classes():
    '''
        This method will effectively "archive" the current classes,
        making them no longer selectable for new class visits. However,
        related visits / class visits will not be modified.
    '''

    #Archive the current classes
    classes_to_archive : list[Class] = Class.query.filter(Class.Archived == False).all()
    for c in classes_to_archive:
        c.Archived = True
    db.session.add_all(classes_to_archive)
    db.session.commit()

    #Call the MyGCC API for the current classes json
    MY_GCC_API_URL = "http://10.18.110.187/api/classes.json"
    classes_to_load = requests.get(MY_GCC_API_URL).json()

    #Load the current classes from the MyGCC API into the database
    loaded_classes = loadClasses(classes_to_load)

    return jsonify({
        "count" : len(loaded_classes),
        "classes" : [class_entry.to_json() for class_entry in loaded_classes]
    })

@app.post("/api/v1/class/archive/<int:id>/")
@authorize
@LogMessage
def archive_classes(id):
    #Archive the current classes
    classes_to_archive : list[Class] = Class.query.filter(Class.TaughtByID == id).all()
    for c in classes_to_archive:
        c.Archived = True
    db.session.add_all(classes_to_archive)
    db.session.commit()
    return api_success("Archived class with id ")

###################################
# CLASS LOADING CODE FROM LOAD DB #
###################################
def cleanClassLocation(location: str) -> str:
    '''
    Cleans locations generated by mygcc that are disgusting.
    '''

    #First see if it has a normal building location. If so, return that
    bldg_location_regex = re.compile("^[A-Z]{4} [0-9]+")
    bldg_location = bldg_location_regex.match(location)
    if bldg_location:
        return bldg_location[0]
    
    #Then try to normalize building names 
    if location == 	"Staley Hall of Arts & Letters":
        return "SHAL"
    elif location == "Pew Fine Arts Center":
        return "PFAC"
    elif location == "Ketler Technological Learning Center, Auditorium":
        return "TLC Auditorium"
    elif location == "Science Technology Engineering":
        return "STEM"
    elif location == "PFAC Pew Fine Arts Center - Auditorium":
        return "PFAC Auditorium"
    elif location == "Hoyt Hall of Engineering":
        return "HOYT"
    elif location == "":
        return "Unknown"

    #Then try to normalize things that contain building names
    if "On Line Course" in location:
        return "On Line Course"
    if "Staley Hall of Arts & Letters" in location:
        return "SHAL"
    if "GCC Main Campus" in location:
        return "GCC Main Campus"

    #Otherwise, just return the raw location
    return location


def loadClasses(class_data_json) -> list[Class]:
    print("-----------LOADING CLASS DATA-----------")
    
    #Adds class data
    classList = []
    classTimes = []
    for entry in class_data_json['classes']:
        if entry['subject'] == "ZLOAD" :
            continue
        else:
            classYear = entry['semester'][0:4]
            classSem = entry['semester'][5:11]
            classLoc = cleanClassLocation(entry['location'])
            yearInt = int(classYear)
            nameTuple = []
            for fac in entry['faculty']:
                nameSplit = fac.split(' ')
              
                if len(nameSplit) > 1:
                    first = nameSplit[0].replace(",", "")
                    nameTuple.append(first)
                    nameTuple.append(nameSplit[1])
            deptID = Department.query.filter_by(DepartmentAbbrev=entry['subject']).first()
            print(nameTuple)
            if len(nameTuple) >= 2:
                facID = Faculty.query.filter_by(LastName=nameTuple[0],FirstName=nameTuple[1]).first()
            else:
                facID = None
            if facID is not None:
                classToadd = Class(
                    Location=classLoc,
                    YearIn=yearInt,
                    Semester=classSem,
                    CourseNo=entry['number'],
                    Section=entry['section'],
                    ClassName=entry['name'],
                    BelongsToDeptID=deptID.DepartmentID,
                    TaughtByID=facID.FacultyID,
                    IsOnline=False,
                    AllowInVisits=True
                )
                classList.append(classToadd)
                classTimes.append(entry['times'])
    db.session.add_all(classList)
    db.session.commit()

    #Add class meeting times for classes
    meetingEntries = []
    for i in range(0,len(classList)):
        ClassID = classList[i].ClassID
        for times in classTimes[i]:
            toAdd= ClassMeetingTime(MeetingDays=times['day'],
                                    StartTime=times['start_time'],
                                    EndTime=times['end_time'],
                                    ForClassID=ClassID)
            meetingEntries.append(toAdd)

    db.session.add_all(meetingEntries)
    db.session.commit()
    print("-----------CLASS DATA LOADED-----------")

    return classList