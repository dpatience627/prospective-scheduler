from app import db
from tables.visit import Visit
from datetime import time, datetime
from utils.dateutils import day_of_week, time_ranges_overlap

class Class(db.Model):
    __tablename__ = 'Classes'
    ClassID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Location = db.Column(db.Unicode, nullable=True)
    YearIn = db.Column(db.Integer, nullable=False)
    Semester = db.Column(db.Unicode, nullable=False)
    CourseNo = db.Column(db.Unicode, nullable=False)
    Section= db.Column(db.Unicode, nullable=False)
    ClassName= db.Column(db.Unicode, nullable=False)
    BelongsToDeptID= db.Column(db.Integer, db.ForeignKey('Departments.DepartmentID')) #BelongsToDept
    TaughtByID= db.Column(db.Integer, db.ForeignKey('Faculty.FacultyID')) #TaughtBy
    IsOnline= db.Column(db.Boolean, nullable = False)
    AllowInVisits= db.Column(db.Boolean, nullable = False)
    Archived = db.Column(db.Boolean, nullable = False, default = False)

    classVisitsIn = db.relationship("ClassVisit", backref="Class")
    meetingTimes = db.relationship("ClassMeetingTime", backref="ForClass")

    def get_meeting_time_during_visit(self, visit: Visit):
        for meetingTime in self.meetingTimes:
            if meetingTime.occurs_during_visit(visit):
                return meetingTime
        return None
    
    def meets_during_visit(self, visit: Visit) -> bool:
        return (self.get_meeting_time_during_visit(visit) is not None)

    def to_json(self):
        return {
            "ClassID" : self.ClassID,
            "Location": self.Location,
            "YearIn" : self.YearIn,
            "Semester" : self.Semester,
            "CourseNo" : self.CourseNo,
            "Section" : self.Section,
            "ClassName" : self.ClassName,
            "BelongsToDept" : self.BelongsToDept.to_json(),
            "TaughtBy" : self.TaughtBy.to_json(),
            "IsOnline" : self.IsOnline,
            "AllowInVisits" : self.AllowInVisits,
            "Archived": self.Archived,
            "MeetingTimes" : [meetingTime.to_json() for meetingTime in self.meetingTimes]
        }
    
    @staticmethod
    def from_json(json):
        return Class(
            Location = json["Location"],
            YearIn = int(json["YearIn"]),
            Semester = json["Semester"],
            CourseNo = json["CourseNo"],
            Section = json["Section"],
            ClassName = json["ClassName"],
            BelongsToDeptID = int(json["BelongsToDeptID"]),
            TaughtByID = int(json["TaughtByID"]),
            IsOnline = bool(json["IsOnline"]),
            Archived = bool(json["Archived"]),
            AllowInVisits = bool(json["AllowInVisits"])
        )
    
    @staticmethod
    def get_available_class_visits(departmentID: int, visit: Visit, startsBetween: tuple[datetime,datetime]):
        from schedule import CandidateClassVisit

        #Construct query for all classes in the selected department
        #that are both allowed, and current (not archived)
        classes : list[Class] = Class.query.filter_by(BelongsToDeptID = departmentID, AllowInVisits = True, Archived = False).all()

        #Filter classes to those that have a meeting time during the visit
        def class_in_visit_and_between(c: Class) -> bool:
            meeting_time : ClassMeetingTime = c.get_meeting_time_during_visit(visit)
            if meeting_time is None:
                return False
            return time_ranges_overlap((meeting_time.StartTime, meeting_time.EndTime), (startsBetween[0].time(), startsBetween[1].time()))

        return [[CandidateClassVisit(c,visit)] for c in classes if class_in_visit_and_between(c)]
    
class ClassMeetingTime(db.Model):
    __tablename__ = 'ClassMeetingTimes'
    MeetingTimeID= db.Column(db.Integer, primary_key=True, autoincrement=True)
    MeetingDays= db.Column(db.Unicode, nullable = False)
    StartTime = db.Column(db.Time, nullable=False)
    EndTime= db.Column(db.Time, nullable=False)
    ForClassID= db.Column(db.Integer, db.ForeignKey("Classes.ClassID")) #ForClass

    def occurs_during_visit(self, visit):
        dayOfVisit = day_of_week(visit.VisitDate)
        startsDuringVisit = visit.StartTime <= self.StartTime
        endsDuringVisit = self.StartTime <= visit.EndTime
        return (dayOfVisit in self.MeetingDays) and startsDuringVisit and endsDuringVisit

    def to_json(self):
        return {
            "MeetingTimeID": self.MeetingTimeID,
            "MeetingDays": self.MeetingDays,
            "StartTime": self.StartTime.__str__(),
            "EndTime": self.EndTime.__str__(),
            "ForClassID": self.ForClassID
        }
    
    @staticmethod
    def from_json(json):
        return ClassMeetingTime(
            MeetingDays = json["MeetingDays"],
            StartTime = time.fromisoformat(json["StartTime"]),
            EndTime = time.fromisoformat(json["EndTime"]),
            ForClassID = int(json["ForClassID"])
        )