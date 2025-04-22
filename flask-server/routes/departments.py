from flask import jsonify, request
from app import app, db
from loadDB import loadDepartments
from tables.department import Department, UNDECLARED_DEPARTMENT_ID
from routes.routeutils import *
from LogClass import LogMessage

@app.post("/api/v1/departments/")
@authorize
@LogMessage
def get_departments():

    allDept: list[Department] = Department.query.order_by(Department.DepartmentName).all()
    
    return jsonify({
        "count": len(allDept),
        "departments": [dept.to_json() for dept in allDept]
    })

@app.post("/api/v1/department/loadDepts")
@authorize
@LogMessage
def load_dept():
    loadDepartments()
    

@app.post("/api/v1/department/<int:id>/")
@authorize
@LogMessage
def get_department(id):
    dept: Department = Department.query.get(id)
    if not dept:
        return api_id_error(id, "Department")
    
    return jsonify(dept.to_json())

@app.post("/api/v1/department/add/")
@authorize
@LogMessage
def add_department():
    try:
        department : Department = Department.from_json(request.json)
    except:
        return api_construct_error("Department")
    
    db.session.add(department)
    db.session.commit()
    return jsonify(department.to_json())


@app.delete("/api/v1/department/delete/<int:id>/")
@authorize
@LogMessage
def delete_department(id):
    department : Department = Department.query.get(id)
    if not department:
        return api_id_error(id, "Department")

    #Move all majors, faculty, and classes that are in this department
    #to the catch all N/A department in order to avoid FK constraint issues
    for major in department.majorsInDepartment:
        major.BelongsToDepartmentID = UNDECLARED_DEPARTMENT_ID

    for faculty in department.facultyInDepartment:
        faculty.BelongsToDeptID = UNDECLARED_DEPARTMENT_ID

    for clazz in department.classesInDepartment:
        clazz.BelongsToDeptID = UNDECLARED_DEPARTMENT_ID
    db.session.commit()

    #Then delete the department
    db.session.delete(department)
    db.session.commit()
    return api_confirm_delete(id, "Department")

@app.post("/api/v1/department/edit/<int:id>/")
@authorize
@LogMessage
def edit_department(id):
    department = Department.query.get(id)
    if not department:
        return api_id_error(id, "Department")

    try:
        department.DepartmentName = request.json['DepartmentName']
        department.DepartmentAbbrev = request.json['DepartmentAbbrev']
    except Exception as e:
        return api_error(str(e))

    db.session.commit()
    return jsonify(department.to_json())