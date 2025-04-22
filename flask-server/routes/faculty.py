from flask import jsonify, request
from app import app, db, graph_client
from tables.faculty import Faculty
from tables.classes import Class
from tables.department import Department
from werkzeug.utils import secure_filename
from routes.routeutils import *
import utils.emailutils
import json
import os
from scrapper import *
from utils.fileutils import root_directory_path
from LogClass import LogMessage
from graphVerification import test_run

#### FLASK ROUTES ####

'''
Description: Route to delete faculty member given the faculty ID
Input: FacultyID
Output: API confirmation
'''
@app.post("/api/v1/faculty/delete/<int:id>/")
@authorize
@LogMessage
def delete_faculty(id):
    faculty_to_archive : Faculty = Faculty.query.get(id)

    if faculty_to_archive is None:
        return api_id_error(id, "Faculty")
    
    #Archive the faculty
    faculty_to_archive.Archived = True

    #Archive the classes taught by the faculty
    for clazz in faculty_to_archive.classesTeaching:
        clazz.Archived = True
    
    db.session.commit()
    return api_success(f"Archived faculty with id {id}")

'''
Description: Route that gets all faculty members in the database 
Input: None
Output: List of all faculty in the database
'''
@app.post("/api/v1/faculty/")
@authorize
@LogMessage
def get_all_faculty():
    allFaculty: list[Faculty] = Faculty.query.filter(Faculty.Archived == 0).all()
    return jsonify({
        "count" : len(allFaculty),
        "faculty" : [member.to_json() for member in allFaculty]
    })

'''
Description: Route to get individual faculty member by faculty ID
Input: takes in a faculty ID 
Output: individual faculty member
'''
@app.post("/api/v1/faculty_member/<int:id>/")
@authorize
@LogMessage
def get_faculty(id):
    facultyMember: Faculty = Faculty.query.get(id)
    if not facultyMember:
        return api_id_error(id, "Faculty")
    return jsonify(facultyMember.to_json())

'''
Description: Adds a faculty member from JSON sent from frontend
Input: Request from frontend
Output: New faculty member add 
'''
@app.post("/api/v1/faculty/add/")
@authorize
@LogMessage
def add_faculty():
    try:
        faculty: Faculty = Faculty.from_json(request.json)
    except:
        return api_construct_error("Faculty")
    
    #If there already exists a faculty with the same email,
    #just replace them with the updated information.
    faculty_with_same_email : Faculty = Faculty.query.filter(Faculty.Email == faculty.Email).first()
    if faculty_with_same_email:
        faculty_with_same_email.Archived = faculty.Archived
        faculty_with_same_email.AllowInVisits = faculty.AllowInVisits
        faculty_with_same_email.BelongsToDeptID = faculty.BelongsToDeptID
        faculty_with_same_email.FirstName = faculty.FirstName
        faculty_with_same_email.LastName = faculty.LastName
        faculty_with_same_email.MiddleInitial = faculty.MiddleInitial
        faculty_with_same_email.OfficeBuilding = faculty.OfficeBuilding
        faculty_with_same_email.OfficeNumber = faculty.OfficeNumber
        db.session.commit()
        return (faculty_with_same_email.to_json())

    faculty.EmailValid = utils.emailutils.is_faculty_email(faculty.Email)
    db.session.add(faculty)
    db.session.commit()
    return jsonify(faculty.to_json())

'''
Description: Updates a faculty member based on JSON recieved from the frontend
Input: Faculty ID number
Output: JSON containing the faculty information
'''
@app.post("/api/v1/faculty/edit/<int:id>/")
@authorize
@LogMessage
def edit_faculty(id):
    try:
        incomingFac : Faculty = Faculty.from_json(request.json)
        oldFac = Faculty.query.get(id)
        oldFac.FirstName = incomingFac.FirstName
        oldFac.LastName = incomingFac.LastName
        oldFac.Title = incomingFac.Title
        oldFac.MiddleInitial = incomingFac.MiddleInitial
        oldFac.OfficeNumber = incomingFac.OfficeNumber
        oldFac.OfficeBuilding = incomingFac.OfficeBuilding
        oldFac.AllowInVisits = incomingFac.AllowInVisits
        oldFac.Archived = incomingFac.Archived
        oldFac.EmailValid = utils.emailutils.is_faculty_email(incomingFac.Email)
        oldFac.BelongsToDeptID = incomingFac.BelongsToDeptID
        oldFac.Email = incomingFac.Email
    except Exception as e:
        return api_error(str(e))
    
    db.session.commit()
    return jsonify(oldFac.to_json())

# 
'''
Description: Flask route that recieves a file to put into the PDF scrapper and saves it in the uploads folder
Input: File submitted through JSON request
Output: code 200 if valid, 400 / 505 if not valid
'''
@app.post("/api/v1/faculty/file/")
@LogMessage
def recieve_file_upload():
    #Defines a valid format for the file (right now only PDF)
    valid_format = "pdf"
    #Gets the file from the request
    file = request.files['file']
    print(file)
    #splits based on periods (to get extensions)
    to_test = file.filename.split('.')
    #If the extension is in the split array and the filename has some mention of faculty it's okay for now
    if( valid_format in to_test):
        #This is needed for saving the file
        test = secure_filename(file.filename.replace("_", " "))
        file_save_path = os.path.join(app.config['UPLOAD_FOLDER'], test)
        try:
            #print("SAVING IS CURRENTLY DISABLED")
            #File is saved in UPLOADS folder
            file.save(file_save_path)
            file.close()
        except Exception as e:
            return api_error("Cannot save upload")
        try:
            export_json(test)
        except:
            print("GOT TO EXCEPTION ON EXPORT_JSON")
            return api_error("Incorrect file format")
        json_file_loc = os.path.join(root_directory_path(), "faculty_data.json")
        try:
            faculty_loaded_list : list[Faculty] = loadFaculty(json_file_loc)
            faculty_with_invalid_emails = [f for f in faculty_loaded_list if not f.EmailValid]
            unarchived_faculty = [f for f in faculty_loaded_list if not f.Archived]
            if(len(faculty_with_invalid_emails) == 0 and len(unarchived_faculty) == 0):
                print("THIS IS WHERE INVALID THINGS WOULD GO")
                return api_error("No new Faculty found")
            elif(len(faculty_with_invalid_emails) > 0):
                return jsonify([f.to_json() for f in faculty_with_invalid_emails])
            else:
                return jsonify({"success": 200})
        except Exception as e:
            return api_error(f"Malformed faculty data: {str(e)}")
    else:
        return api_error("Incorrect file format")

@app.post("/api/v1/faculty/verify-emails/")
@authorize
@LogMessage
def verify_faculty_emails():
    #Get all faculty that aren't archived
    faculty : list[Faculty] = Faculty.query.filter(Faculty.Archived == 0).all()

    #Mark their emails as valid / invalid
    for f in faculty:
        f.EmailValid = utils.emailutils.is_faculty_email(f.Email)
    db.session.commit()

    #Filter to those which have invalid emails
    faculty = [f for f in faculty if not f.EmailValid]

    #Return a list of the faculty with invalid emails
    return jsonify([f.to_json() for f in faculty])
     
@app.post("/api/v1/faculty/emails/")
@authorize
def get_faculty_emails():
    return jsonify(utils.emailutils.faculty_emails)
    

###LOADING METHODS#####
'''
Description: Loads faculty members into database based on JSON produced by the PDF scrapper
Input: Location of JSON file to read into database
'''
@LogMessage
def loadFaculty(file_location):
    print("-----------LOADING FACULTY DATA-----------")
    f = open(file_location, encoding="utf8")
    facData = json.load(f)
    
    facultyList : list[Faculty] = []
    emailList = []
    archivedList : list[Faculty] = []
    for member in facData['faculty']:
        deptSplit = member['department'].replace(",", "").split(" ")
        cleanFName = member['firstname'].replace(',', "")
        cleanLName = member['lastname'].replace(',', "")
        addressSplit=member['address'].split(" ")
        fullOffice = ""
        if(len(addressSplit) > 2):
            if(len(addressSplit[1]) == 1):
               fullOffice = addressSplit[0] + addressSplit[1]
            else:
                fullOffice = addressSplit[0] 
        if("STEM" in addressSplit):
            fullOffice = "STEM" + " " + fullOffice
        elif("Staley" in addressSplit):
            fullOffice = "SHAL" + " " + fullOffice
        elif("Pew" in addressSplit):
            fullOffice = "PEW" + " " + fullOffice
        elif("Hoyt" in addressSplit):
            fullOffice = "HOYT" + " " + fullOffice
        else:
            fullOffice = "N/A"
        fullOffice = fullOffice.split(" ")
        offBuilding = ""
        offNumber = ""
        if(len(fullOffice) == 1):
            offBuilding = fullOffice[0]
        else:
            offBuilding = fullOffice[0]
            offNumber = fullOffice[1]
        toSearch = f"%{deptSplit[0]}%"
        with app.app_context():  
            print("got to dept")
            deptID = Department.query.filter(Department.DepartmentName.like(toSearch)).first()
        if deptID is None:
            print(f"Failed search: " + toSearch)
            continue
        else:
            
            email_to_add = cleanLName
            modified_mid_init = ""
            modified_first_init= ""
            if(len(member['middlename']) != 0):
                if(member['middlename'][0] != "x"):
                    modified_mid_init = member['middlename'][0]
            if(len(member['firstname']) != 0):
                modified_first_init = member['firstname'][0]
            email_to_add = email_to_add  + modified_first_init + modified_mid_init+ "@GCC.EDU"
            toAdd = Faculty(Email=email_to_add, 
                        FirstName=cleanFName, 
                        LastName=cleanLName,
                        MiddleInitial=modified_mid_init,
                        Title=member['title'],
                        BelongsToDeptID=deptID.DepartmentID,
                        OfficeBuilding= offBuilding,
                        OfficeNumber = offNumber,
                        EmailValid = utils.emailutils.is_faculty_email(email_to_add),
                        AllowInVisits = True,
                        Archived = False
                           )
            print(toAdd)
            try:
                testIfExist = Faculty.query.filter(Faculty.Email == email_to_add).first()
            except Exception as e:
                print(e)
           
            if testIfExist is not None:
                '''testIfExist.FirstName = toAdd.FirstName
                testIfExist.LastName = toAdd.LastName
                testIfExist.MiddleInitial = toAdd.MiddleInitial
                testIfExist.Title = toAdd.Title
                testIfExist.OfficeBuilding = toAdd.OfficeBuilding
                testIfExist.OfficeNumber = toAdd.OfficeNumber
                testIfExist.EmailValid = toAdd.EmailValid
                testIfExist.AllowInVisits = toAdd.AllowInVisits'''
                if(testIfExist.Archived):
                    testIfExist.Archived = False
                    archivedList.append(testIfExist)
                #print(archivedList)
            elif(testIfExist is None and toAdd not in facultyList and email_to_add not in emailList):
                facultyList.append(toAdd)
                emailList.append(email_to_add)
    
    db.session.add_all(facultyList)
    db.session.commit()
    for archived in archivedList:
        facultyList.append(archived)
    print("FAC LIST")
    print(facultyList)
    print("-----------FACULTY DATA LOADED-----------")
    
    return facultyList