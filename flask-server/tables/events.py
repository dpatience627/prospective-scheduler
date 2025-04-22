from app import db, graph_client
from datetime import time
from utils.dateutils import day_of_week
from enum import Enum

class EventStatus(Enum):
    PENDING="PENDING"
    DECLINED="DECLINED"
    ACCEPTED="ACCEPTED"

class FacultyVisit(db.Model):
    __tablename__ = "FacultyVisits"
    FacultyVisitID= db.Column(db.Integer, primary_key=True, autoincrement=True)
    MeetingStatus= db.Column(db.Unicode, server_default=EventStatus.PENDING.value, nullable=False)
    StartTime= db.Column(db.Time, nullable=False)
    EndTime= db.Column(db.Time, nullable=False)
    InVisitID= db.Column(db.Integer, db.ForeignKey("Visits.VisitID")) #Visit
    WithFacultyID= db.Column(db.Integer, db.ForeignKey("Faculty.FacultyID")) #WithFaculty
    OutlookMeetingID = db.Column(db.Unicode, nullable=True)

    def delete(self):
        if self.OutlookMeetingID is not None:
            graph_client.cancel_meeting(self.OutlookMeetingID)
        db.session.delete(self)
        db.session.commit()

    def refresh_status(self):
        self.MeetingStatus = graph_client.get_meeting_status(self.OutlookMeetingID).value
        db.session.commit()

    @property
    def coordinator_email(self) -> str:
        return self.WithFaculty.Email

    def to_json(self):
        return {
            "FacultyVisitID": self.FacultyVisitID,
            "MeetingStatus": self.MeetingStatus,
            "StartTime": self.StartTime.__str__(),
            "EndTime": self.EndTime.__str__(),
            "WithFaculty": self.WithFaculty.to_json(),
            "InVisitID": self.InVisitID
        }

    @staticmethod
    def from_json(json):
        return FacultyVisit(
            StartTime = time.fromisoformat(json['StartTime']),
            EndTime = time.fromisoformat(json['EndTime']),
            WithFacultyID = json['WithFacultyID'],
            InVisitID = json['InVisitID']
        )

class ClassVisit(db.Model):
    __tablename__ = 'ClassVisits'
    ClassVisitID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MeetingStatus= db.Column(db.Unicode, server_default=EventStatus.PENDING.value, nullable=False)
    InClassID= db.Column(db.Integer, db.ForeignKey("Classes.ClassID")) #Class
    InVisitID= db.Column(db.Integer, db.ForeignKey("Visits.VisitID")) #Visit
    OutlookMeetingID = db.Column(db.Unicode, nullable=True)

    @property
    def StartTime(self):
        meetingTime = self.get_meeting_time()
        return meetingTime.StartTime if meetingTime else None
    
    @property
    def EndTime(self):
        meetingTime = self.get_meeting_time()
        return meetingTime.EndTime if meetingTime else None

    @property
    def coordinator_email(self) -> str:
        return self.Class.TaughtBy.Email

    def get_meeting_time(self):
        day = day_of_week(self.Visit.VisitDate)
        for meetingTime in self.Class.meetingTimes:
            if day in meetingTime.MeetingDays:
                return meetingTime
        return None

    def delete(self):
        if self.OutlookMeetingID is not None:
            graph_client.cancel_meeting(self.OutlookMeetingID)
        db.session.delete(self)
        db.session.commit()

    def refresh_status(self):
        self.MeetingStatus = graph_client.get_meeting_status(self.OutlookMeetingID).value
        db.session.commit()

    def to_json(self):
        return {
            "ClassVisitID": self.ClassVisitID,
            "MeetingStatus": self.MeetingStatus,
            "Class": self.Class.to_json(),
            "StartTime": self.StartTime.__str__() if self.StartTime else "UNKNOWN",
            "EndTime": self.EndTime.__str__() if self.EndTime else "UNKNOWN",
            "InVisitID": self.InVisitID
        }

    @staticmethod
    def from_json(json):
        return ClassVisit(
            InClassID = json['InClassID'],
            InVisitID = json['InVisitID']
        )

class StudentVisit(db.Model):
    __tablename__ = 'StudentVisits'
    StudentVisitID= db.Column(db.Integer, primary_key=True, autoincrement=True)
    MeetingStatus = db.Column(db.Unicode, server_default=EventStatus.PENDING.value, nullable=False)
    StartTime= db.Column(db.Time, nullable=False)
    EndTime= db.Column(db.Time, nullable=False)
    WithStudentID= db.Column(db.Integer, db.ForeignKey("Students.StudentID")) #WithStudent
    InVisitID= db.Column(db.Integer, db.ForeignKey("Visits.VisitID")) #Visit
    OutlookMeetingID = db.Column(db.Unicode, nullable=True)

    def delete(self):
        if self.OutlookMeetingID is not None:
            graph_client.cancel_meeting(self.OutlookMeetingID)
        db.session.delete(self)
        db.session.commit()

    def refresh_status(self):
        self.MeetingStatus = graph_client.get_meeting_status(self.OutlookMeetingID).value
        db.session.commit()

    @property
    def coordinator_email(self) -> str:
        return self.WithStudent.Email

    def to_json(self):
        return {
            "StudentVisitID": self.StudentVisitID,
            "MeetingStatus": self.MeetingStatus,
            "StartTime": self.StartTime.__str__(),
            "EndTime": self.EndTime.__str__(),
            "WithStudent": self.WithStudent.to_json(),
            "InVisitID": self.InVisitID
        }

    @staticmethod
    def from_json(json):
        return StudentVisit(
            StartTime = time.fromisoformat(json['StartTime']),
            EndTime = time.fromisoformat(json['EndTime']),
            WithStudentID = json['WithStudentID'],
            InVisitID = json['InVisitID']
        )