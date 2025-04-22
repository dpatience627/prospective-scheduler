import os
from flask import jsonify, request
from app import app, db
from tables.student import Student
from tables.major import Major
from routes.routeutils import *
from LogClass import LogMessage
import pandas as pd
import routes.majors as majors
import utils.emailutils

class Student_csv:
     def __init__(self, Email:str, FirstName:str, LastName:str, MiddleInitial:str, PursuingMajorName:str):
        self.Email = Email
        self.FirstName = FirstName
        self.LastName = LastName
        self.MiddleInitial = MiddleInitial
        self.PursuingMajorName = PursuingMajorName


@app.post("/api/v1/students/")
@authorize
@LogMessage
def get_all_students():
    allStudents: list[Student] = Student.query.all()
    return jsonify({
        "count" : len(allStudents),
        "students" : [student_entry.to_json() for student_entry in allStudents]
    })

@app.post("/api/v1/student/get/<int:id>/")
@authorize
@LogMessage
def get_student(id):
    student_entry: Student = Student.query.get(id)
    if not student_entry:
        return api_id_error(id, "Student")
    return jsonify(student_entry.to_json())

@app.post("/api/v1/student/add/")
@authorize
@LogMessage
def post_add_student():
    try:
        student: Student = Student.from_json(request.json)
    except:
        return api_construct_error("Student")

    db.session.add(student)
    db.session.commit()
    return jsonify(student.to_json())

@app.post("/api/v1/student/edit/")
@authorize
@LogMessage
def post_edit_student():
    try:
        studentID = request.json['StudentID']

        student : Student = Student.query.get(studentID)

        student.Email = request.json['Email']
        student.FirstName = request.json['FirstName']
        student.MiddleInitial = request.json['MiddleInitial']
        student.LastName = request.json['LastName']
        student.PursuingMajorID = request.json['PursuingMajorID']
    except Exception as e:
        print("something happened here")
        return api_error(str(e))

    try:
        db.session.add(student)
        db.session.commit()
    except Exception as e:
        return api_error(str(e))

    return jsonify(student.to_json())

@app.post("/api/v1/students/emails/")
@authorize
def get_student_emails():
    return jsonify(utils.emailutils.student_emails)

@app.delete("/api/v1/student/delete/<int:id>/")
@authorize
@LogMessage
def delete_student(id):
    student : Student = Student.query.get(id)
    if not student:
        return api_id_error(id, "Student")
    
    #Delete all visits this 
    for visit in student.studentVisitsIn:
        visit.delete()
    
    db.session.delete(student)
    db.session.commit()
    return api_confirm_delete(id, "Student")

"""
Description: <Takes in a pandas frame, returns a list of students>
Input: Dataframe containing student information
Ourput: List of students in the csv file
"""
def extract_student_csv(df:pd.DataFrame)->list[Student_csv]:
    return [Student_csv(row.Email, row.FirstName, row.LastName, row.MiddleInitial, row.PursuingMajorName) for row in df.itertuples()]

"""
Description: <Takes in a list of students, load them into the database>
Input: list of Student_csv objects
Output:none; Simply loads the students into the database
"""
def load_student_csv(lst:list[Student_csv])->None:
    i = 0
    majors : list[Major] = Major.query.order_by(Major.MajorName).all()
    for stud in lst:
        i=i+1
        for major in majors:
            # Read the name from the csv and find the ID to inset in the db as the foreign key
            if major.MajorName == stud.PursuingMajorName:
                studPursuingID = major.MajorID

        # inserting in the db
        db.session.add(Student(
            Email = stud.Email,
            FirstName = stud.FirstName,
            LastName = stud.LastName,
            MiddleInitial = stud.MiddleInitial[0] if stud.MiddleInitial!=None else 'x',
            PursuingMajorID = studPursuingID)
            )
        
        db.session.commit()

'''
Description: <Flask route that recieves a file to put into the CSV scrapper and saves it in the uploads folder>
Input: File submitted through JSON request
Output: code 200 if valid, 400 / 505 if not valid
'''
@app.post("/api/v1/student/file/")
@LogMessage
def receive_file_upload_student():
    # Defines a valid format for the file (Either CSV or Excel files)
    valid_format = ['csv', 'xlsx']
    print("First step")
    # Gets the file from the request
    file = request.files['file']
    #splits based on periods (to get extensions)
    file_array= file.filename.split('.')

    try:
        # if the array does not contain the right format raise an exception
        if file_array[1] not in valid_format:
            raise Exception("Give a correct format") 
        
        # saving the file
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], file.filename))
        print('path', app.config['UPLOAD_FOLDER'],file.filename)
        # #If the extension is in the split array and the filename has some mention of faculty it's okay for now
        data = open(os.path.join(app.config['UPLOAD_FOLDER'],file.filename))
        # Read the data in a dataframe
        try:
            df = pd.read_csv(data)
        except Exception as e:
            print("File error here")
        #Load the file in the database
        try:
            load_student_csv(extract_student_csv(df))
        except Exception as e:
            return api_error("Malformed student lunch csv")
        return jsonify({
        "success": True,
        "code": 200
        })
    except Exception as e:
        print(e)
        return jsonify({
        "success": False,
        "code": 400
        })
