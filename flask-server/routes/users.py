from flask import jsonify, request
from app import app, db
from tables.visit import Visit
from tables.user import User
from routes.routeutils import *
from LogClass import LogMessage

@app.post("/api/v1/users/")
@authorize
@LogMessage
def get_all_users():
    users: list[User] = User.query.all()
    return jsonify({
        "count" : len(users),
        "users" : [user.to_json() for user in users]
    })

@app.post("/api/v1/user/<int:id>/")
@authorize
@LogMessage
def get_user(id):
    user: User = User.query.get(id)
    if not user:
        return api_id_error(id, "User")
    
    return jsonify(user.to_json())

@app.post("/api/v1/user/getPermissions/")
def get_user_permissions():
    try:
        email = request.json['email']
        user: User = User.query.filter(User.Email.ilike(email)).first()

        permissions = -1

        if user is not None:
            permissions = user.UserPriveleges

        return jsonify({
            "permissions": permissions
        })

    except Exception as e:
        print(str(e))
        return api_error(str(e))

@app.post("/api/v1/user/add/")
@authorize
@LogMessage
def post_add_user():
    try:
        user: User = User.from_json(request.json)
        
        userWithSameEmail = User.query.filter(User.Email == user.Email).first()
        if userWithSameEmail:
            return api_error(f"Cannot create user with email {user.Email}. A user with this email already exists!")
    except:
        return api_construct_error("User")

    try:
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        return api_error(str(e))

    return jsonify(user.to_json())

@app.post("/api/v1/user/edit/")
@authorize
@LogMessage
def post_edit_user():
    try:
        userID = request.json['UserID']
        user : User = User.query.get(userID)
        if not user:
            return api_id_error(userID, "Users")

        user.Email = request.json['Email']
        user.FirstName = request.json['FirstName']
        user.MiddleInitial = request.json['MiddleInitial']
        user.LastName = request.json['LastName']
        user.UserPriveleges = request.json['UserPriveleges']
    except Exception as e:
        return api_error(str(e))

    try:
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        return api_error(str(e))

    return jsonify(user.to_json())

@app.delete("/api/v1/user/delete/<int:id>/")
@authorize
@LogMessage
def delete_user(id):
    #You can NEVER delete the service account user
    if id == 1:
        return api_error(f"Cannot delete system user")
    
    #If the user doesn't exist, don't delete them
    user = User.query.get(id)
    if not user:
        return api_id_error(id, "User")
    
    #Otherwise, update every visit created by this user to be
    #'created' by the system user
    visitsCreatedByUser = Visit.query.filter_by(CreatedByUserID=id).all()
    for visit in visitsCreatedByUser:
        visit.CreatedByUserID = 1

    #Then delete the user    
    db.session.delete(user)
    db.session.commit()
    return api_confirm_delete(id, "User")