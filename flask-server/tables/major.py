from app import db

UNDECLARED_MAJOR_ID = 1

class Major(db.Model):
    __tablename__ = 'Majors'
    MajorID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MajorName = db.Column(db.Unicode, nullable=False)
    BelongsToDepartmentID = db.Column(db.Integer, db.ForeignKey('Departments.DepartmentID')) #MajorDepartment

    visitsWithMajor = db.relationship("Visit", backref="IntendedMajor")
    studentsWithMajor = db.relationship("Student", backref="PursuingMajor")

    def to_json(self):
        return {
            "MajorID": self.MajorID,
            "MajorName": self.MajorName,
            "BelongsToDepartmentID": self.BelongsToDepartmentID,
            "MajorDepartment": self.MajorDepartment.to_json()
        }
    @staticmethod
    def from_json(json):
        return Major(
            MajorName = json['MajorName'],
            BelongsToDepartmentID = int(json['BelongsToDepartmentID'])
        )
