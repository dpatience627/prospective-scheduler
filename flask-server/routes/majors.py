from flask import jsonify, request
from difflib import SequenceMatcher 
from app import app, db
from tables.major import Major, UNDECLARED_MAJOR_ID
from tables.department import Department
from routes.routeutils import *
from LogClass import LogMessage
from werkzeug.utils import secure_filename
import pandas as pd
import os
import csv


@app.post("/api/v1/majors/")
@authorize
@LogMessage
def get_majors():
    majors : list[Major] = Major.query.order_by(Major.MajorName).all()
    return jsonify({
        "count": len(majors),
        "majors": [major.to_json() for major in majors]
    })

@app.post("/api/v1/major/<int:id>/")
@authorize
@LogMessage
def get_major(id):
    major : Major = Major.query.get(id)
    if not major:
        return api_id_error(id, "Major")
    
    return jsonify(major.to_json())

@app.post("/api/v1/major/add/")
@authorize
@LogMessage
def add_major():
    try:
        major: Major = Major.from_json(request.json)
    except:
        return api_construct_error("Major")
    
    db.session.add(major)
    db.session.commit()
    return jsonify(major.to_json())

@app.post("/api/v1/major/edit/<int:id>/")
@authorize
@LogMessage
def edit_major(id):
    major : Major = Major.query.get(id)
    if not major:
        return api_id_error(id, "Major")
    
    try:
        major.MajorName = request.json['MajorName']
        major.BelongsToDepartmentID = request.json['BelongsToDepartmentID']
    except Exception as e:
        return api_error(str(e))
    
    db.session.commit()
    return jsonify(major.to_json())

@app.delete("/api/v1/major/delete/<int:id>/")
@authorize
@LogMessage
def delete_major(id):
    major : Major = Major.query.get(id)
    if not major:
        return api_id_error(id, "Major")
    
    #Get every student (prospective & current) who is marked as
    #being in this major. Give them a default major so no FK constraints
    #are violated.
    for student in major.studentsWithMajor:
        student.PursuingMajorID = UNDECLARED_MAJOR_ID
    
    for student in major.visitsWithMajor:
        student.IntendedMajorID = UNDECLARED_MAJOR_ID
    db.session.commit()

    db.session.delete(major)
    db.session.commit()
    return api_confirm_delete(id, "Major")

@app.delete("/api/v1/major/deleteDept/<int:id>/")
@authorize
@LogMessage
def delete_majors_department(id):
    print("Got here")
    major_list: list[Major] = Major.query.filter(Major.BelongsToDepartmentID == id)
    for major_to_delete in major_list:
        for student in major_to_delete.studentsWithMajor:
            student.PursuingMajorID = UNDECLARED_MAJOR_ID
        for student in major_to_delete.visitsWithMajor:
            student.IntendedMajorID = UNDECLARED_MAJOR_ID
        db.session.commit()
        db.session.delete(major_to_delete)
        db.session.commit()
    return api_confirm_delete(id, "Major")


'''
Notes:
Checks either via abbreviation or department name first
Next checks for an exact match (i.e. major exists) and a rough match (using sql format %MAJOR NAME%) 
If it's an exact match it continues, if rough match it checks if it has a ratio less than 0.96 and then will add
if no rough or exact match then it just adds it 

Output: List of majors that were added.

'''
def load_majors_csv(filename):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    new_majors = []
    if(".csv" in filename):
        with open(file_path, newline="") as csv_file:
            reader = csv.reader(csv_file, delimiter=',')
            for row in reader:  
                if(len(row) == 2):
                    dept_check_name = Department.query.filter(Department.DepartmentName.like(row[0])).first()
                    dept_check_abbr = Department.query.filter(Department.DepartmentAbbrev.like(row[0])).first()
                    if(dept_check_name or dept_check_abbr):
                        if(dept_check_name):
                            deptID = dept_check_name.DepartmentID
                        else:
                            deptID = dept_check_abbr.DepartmentID
                        major_name = row[1]
                        try:
                            query_input = "%{}%".format(major_name)
                            test_for_major_rough = Major.query.filter(Major.MajorName.like(query_input)).first()
                            test_for_major_exact = Major.query.filter(Major.MajorName.like(major_name)).first()
                        except Exception as e:
                            print(e)
                        if(test_for_major_exact):
                            continue
                        elif test_for_major_rough and not test_for_major_exact:
                            name_ratio = SequenceMatcher(None, major_name.lower(), test_for_major_rough.MajorName.lower()).ratio()
                            if name_ratio < 0.96:
                                if(len(major_name) > 1):
                                    major_to_add = Major(MajorName = major_name, BelongsToDepartmentID=deptID)
                                    new_majors.append(major_to_add)
                                    db.session.add(major_to_add)
                                    db.session.commit()
                        else:
                            if(len(major_name) > 1):
                                major_to_add = Major(MajorName = major_name, BelongsToDepartmentID=deptID)
                                new_majors.append(major_to_add)
                                db.session.add(major_to_add)
                                db.session.commit()        
                    db.session.commit()          
                else:
                    print("Wrong data")
                    return api_error("Incorrect file format")
        return new_majors
    else:
        print("Incorrect file")
        return api_error("Incorrect file format")

@app.post("/api/v1/majors/file/")
@LogMessage
def receive_majors_file():
    valid_extensions = ["csv"]
    file = request.files['file']
    test_extension = file.filename.split(".")
    print(test_extension)
    if(test_extension[1] in valid_extensions):
        print("valid file")
        file_name = secure_filename(file.filename.replace("_", ""))
        try:
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], file_name))
            file.close()
        except Exception as e:
            print(e)
        try:
            majors_list = load_majors_csv(file_name)
            print(majors_list)
            if(len(majors_list) == 0):
                return api_success("No new majors were found.")
            else:
                return api_success(f"Added {len(majors_list)} new major{'s' if len(majors_list) > 1 else ''}!")
            
        except Exception as e:
            return api_error("The file you uploaded may be incorrectly formatted.")
    else:
        return api_error("The extension of the file uploaded is not supported. Only CSV files are supported.") 
