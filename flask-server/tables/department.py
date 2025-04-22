from app import db

UNDECLARED_DEPARTMENT_ID = 1

class Department(db.Model):
    __tablename__ = 'Departments'
    DepartmentID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    DepartmentName = db.Column(db.Unicode, nullable=False)
    DepartmentAbbrev = db.Column(db.Unicode, nullable=False)

    majorsInDepartment = db.relationship("Major", backref="MajorDepartment")
    facultyInDepartment = db.relationship("Faculty", backref="BelongsToDept")
    classesInDepartment = db.relationship("Class", backref="BelongsToDept")

    def to_json(self):
        return {
            "DepartmentID": self.DepartmentID,
            "DepartmentName": self.DepartmentName,
            "DepartmentAbbrev": self.DepartmentAbbrev
        }
    
    @staticmethod
    def from_json(json):
        return Department(
            DepartmentName = json['DepartmentName'],
            DepartmentAbbrev = json["DepartmentAbbrev"]
        )