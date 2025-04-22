from app import db, graph_client
from flask import render_template
from datetime import datetime, date, time
from enum import Enum
from tables.events import EventStatus, FacultyVisit, ClassVisit, StudentVisit
from utils.dateutils import time_ranges_overlap

class VisitStatus(Enum):
    HAS_NO_EVENTS = 0
    HAS_PENDING_EVENTS = 1
    HAS_DECLINED_EVENTS = 2
    SCHEDULE_COMPLETE = 3

class Visit(db.Model):
    __tablename__ = 'Visits'
    VisitID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    VisitDate = db.Column(db.Date, nullable=False)
    StartTime = db.Column(db.Time, nullable=False)
    EndTime = db.Column(db.Time, nullable=False)
    StudentFirstName = db.Column(db.Unicode, nullable=False)
    StudentLastName = db.Column(db.Unicode, nullable=False)
    StudentMiddleInitial = db.Column(db.Unicode, nullable=False)
    IntendedMajorID = db.Column(db.Integer, db.ForeignKey('Majors.MajorID')) # IntendedMajor
    CreatedByUserID = db.Column(db.Integer, db.ForeignKey('Users.UserID'))

    FacultyVisits = db.relationship("FacultyVisit", backref="Visit")
    ClassVisits = db.relationship("ClassVisit", backref="Visit")
    StudentVisits = db.relationship("StudentVisit", backref="Visit")
    NoShowSurveys = db.relationship("NoShowSurvey", backref="Visit")

    def is_time_range_available(self, start : time, end: time) -> bool:
        for v in (self.FacultyVisits + self.ClassVisits + self.StudentVisits):
            #Weird bug where these are timedeltas rather than times... need to convert :(
            vStart = (datetime.min + v.StartTime).time() if type(v.StartTime) is not time else v.StartTime
            vEnd = (datetime.min + v.EndTime).time() if type(v.EndTime) is not time else v.EndTime
            if time_ranges_overlap((vStart, vEnd), (start, end)):
                return False
        
        return True
    
    def refresh_status(self):
        for event in self.events:
            event.refresh_status()

    def get_reminder_email_body(self) -> str:
        time_format = "%I:%M %p"
        date_format = "%B %d, %Y"
        return (
            "This is a reminder that you have not responded to an outlook meeting invitation "
            f"regarding a meeting with {self.StudentFirstName} {self.StudentLastName} during their visit on "
            f"{self.VisitDate.strftime(date_format)}. "
            "Please respond as soon as you are able."
        )

    @property
    def events(self):
        return self.FacultyVisits+self.ClassVisits+self.StudentVisits

    @property
    def visit_status(self):
        events = self.events

        statuses = []
        if len(events) == 0:
            statuses.append(VisitStatus.HAS_NO_EVENTS.value)

        anyPending = False
        anyDeclined = False
        allAccepted = (len(events) > 0)
        for event in events:
            anyPending  |= (event.MeetingStatus == EventStatus.PENDING.value)
            anyDeclined |= (event.MeetingStatus == EventStatus.DECLINED.value)
            allAccepted &= (event.MeetingStatus == EventStatus.ACCEPTED.value)
        
        if anyPending:
            statuses.append(VisitStatus.HAS_PENDING_EVENTS.value)
            
        if anyDeclined:
            statuses.append(VisitStatus.HAS_DECLINED_EVENTS.value)
            
        if allAccepted:
            statuses.append(VisitStatus.SCHEDULE_COMPLETE.value)

        return statuses

    @property
    def were_no_show_surveys_sent(self) -> bool:
        return len(self.events) == 0 or len(self.NoShowSurveys) > 0

    @property
    def was_no_show(self) -> bool:
        surveys : list[NoShowSurvey] = self.NoShowSurveys

        #Assume by default the student showed up
        if len(surveys) == 0:
            return False

        no_show_responses = 0
        for survey in surveys:
            if survey.WasNoShow:
                no_show_responses += 1
        
        #Otherwise, only a no show if the student failed to attend
        #all of their scheduled events
        return no_show_responses == len(surveys)

    def to_json(self) -> str:
        return {
            "VisitID": self.VisitID,
            "VisitDate": self.VisitDate.isoformat(),
            "StartTime": self.StartTime.__str__(),
            "EndTime": self.EndTime.__str__(),
            "StudentFirstName": self.StudentFirstName,
            "StudentLastName": self.StudentLastName,
            "StudentMiddleInitial": self.StudentMiddleInitial,
            "WasNoShow": self.was_no_show,
            "IntendedMajor": self.IntendedMajor.to_json(),
            "CreatedByUserID": self.CreatedByUserID,
            "FacultyVisits": [event.to_json() for event in self.FacultyVisits],
            "ClassVisits": [event.to_json() for event in self.ClassVisits],
            "StudentVisits": [event.to_json() for event in self.StudentVisits],
            "VisitStatus": self.visit_status
        }
    
    @staticmethod
    def from_json(json):
        return Visit(
            VisitDate = date.fromisoformat(json["VisitDate"]),
            StartTime = time.fromisoformat(json["StartTime"]),
            EndTime = time.fromisoformat(json["EndTime"]),
            StudentFirstName = json["StudentFirstName"],
            StudentLastName = json["StudentLastName"],
            StudentMiddleInitial = json["StudentMiddleInitial"],
            IntendedMajorID = int(json["IntendedMajorID"]),
            CreatedByUserID = int(json["CreatedByUserID"])
        )

from msgraph.generated.models.body_type import BodyType
class NoShowSurvey(db.Model):
    __tablename__ = 'NoShowSurveys'
    SurveyID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    RecipientEmail = db.Column(db.Unicode, nullable=False)
    WasNoShow = db.Column(db.Boolean, nullable=False)
    ForVisitID = db.Column(db.Integer, db.ForeignKey('Visits.VisitID')) # Visit

    def send_to_recipient(self):
        visit : Visit = self.Visit
        body = render_template(
            'noshow-survey.html',
            student=f"{visit.StudentFirstName} {visit.StudentLastName}",
            survey_id=self.SurveyID
        )

        graph_client.send_email(
            "Follow-Up on Prospective Student Visit",
            body,
            self.RecipientEmail,
            content_type=BodyType.Html
        )

    def to_json(self):
        return {
            "SurveyID": self.SurveyID,
            "RecipientEmail": self.RecipientEmail,
            "WasNoShow": self.WasNoShow,
            "ForVisit": self.Visit.to_json()
        }