from app import db, graph_client
from tables.visit import Visit
from tables.major import Major
from datetime import time, datetime

class Student(db.Model):
    __tablename__ = 'Students'
    StudentID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Email = db.Column(db.Unicode, nullable=False)
    FirstName = db.Column(db.Unicode, nullable=False)
    LastName = db.Column(db.Unicode, nullable=False)
    MiddleInitial = db.Column(db.Unicode, nullable=False)
    PursuingMajorID = db.Column(db.Integer, db.ForeignKey('Majors.MajorID')) # PursuingMajor

    studentVisitsIn = db.relationship("StudentVisit", backref="WithStudent")

    def to_json(self):
        return {
            "StudentID": self.StudentID,
            "Email": self.Email,
            "FirstName": self.FirstName,
            "LastName": self.LastName,
            "MiddleInitial": self.MiddleInitial,
            "PursuingMajor": self.PursuingMajor.to_json()
        }
    
    @staticmethod
    def from_json(json):
        return Student(
            Email = json['Email'],
            FirstName = json['FirstName'],
            LastName = json['LastName'],
            MiddleInitial = json['MiddleInitial'],
            PursuingMajorID = int(json['PursuingMajorID'])
        )
    
    @staticmethod
    def get_available_student_lunches(departmentID: int, visit: Visit, startsBetween: tuple[datetime,datetime]):
        from schedule import CandidateStudentLunch
        #Get all students whose major belongs to the specified department
        students : list[Student] = Student.query \
                          .join(Major, Student.PursuingMajorID == Major.MajorID) \
                          .filter(Major.BelongsToDepartmentID == departmentID).all()
        
        #Correspond all students with the meeting times during this visit they are available for
        student_availability = get_student_availability(students, visit, startsBetween)

        #Filter off all students who aren't available (don't have any available times)
        student_availability = [s for s in student_availability if len(s[1]) > 0]

        #Return all candidate student lunches for each available student
        candidate_student_lunches = []
        for (student, times) in student_availability:
            candidate_student_lunches.append([
                CandidateStudentLunch(student, start, end, visit) for (start, end) in times
            ])
        return candidate_student_lunches

def get_student_availability(students: list[Student], visit : Visit, startsBetween: tuple[datetime,datetime]) -> list[tuple[Student, list[tuple[time,time]]]]:
    return zip(
        students,
        graph_client.get_availability([s.Email for s in students], visit.VisitDate, startsBetween[0], startsBetween[1])
    )