from app import db, graph_client
from tables.visit import Visit
from datetime import time, date, timedelta, datetime
from utils.dateutils import times_ranges_between, time_ranges_overlap, time_from_string
from tables.events import FacultyVisit

class Faculty(db.Model):
    __tablename__ = 'Faculty'
    FacultyID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Email = db.Column(db.Unicode, nullable=False)
    FirstName = db.Column(db.Unicode, nullable=False)
    LastName = db.Column(db.Unicode, nullable=False)
    MiddleInitial= db.Column(db.Unicode, nullable=False)
    Title= db.Column(db.Unicode, nullable=False)
    OfficeBuilding= db.Column(db.Unicode, nullable=False)
    OfficeNumber= db.Column(db.Unicode, nullable=False)
    AllowInVisits= db.Column(db.Boolean, nullable=False)
    Archived= db.Column(db.Boolean, nullable=False)
    EmailValid = db.Column(db.Boolean, nullable=False)
    BelongsToDeptID= db.Column(db.Integer, db.ForeignKey("Departments.DepartmentID")) #BelongsToDept

    facultyVisitsIn = db.relationship("FacultyVisit", backref="WithFaculty")
    classesTeaching = db.relationship("Class", backref="TaughtBy")

    def teaches_during(self, time_range: tuple[time, time], visit: Visit) -> bool:
        from tables.classes import ClassMeetingTime, Class
        classes : list[Class] = self.classesTeaching
        for clazz in classes:
            meeting_time : ClassMeetingTime = clazz.get_meeting_time_during_visit(visit)
            if not meeting_time:
                continue
            if time_ranges_overlap(time_range, (meeting_time.StartTime, meeting_time.EndTime)):
                return True
        return False

    @property
    def faculty_workload(self) -> float:
        '''
        A metric to represent the work oad a faculty is bearing at the current
        moment in time. Faculty with lower faculty workload should be preferred for visits.

        Workload is calculated based off of faculty visits within the last 28 days,
        and those scheduled for the future. More recent visits count more towards the workload,
        and many visits in a week compound together.
        '''

        #Get all faculty visits scheduled in the past 28 days
        #and in the future.
        today = date.today()
        monthAgo = today - timedelta(days=28)

        visits : list[FacultyVisit] = FacultyVisit.query \
            .filter(FacultyVisit.WithFacultyID == self.FacultyID) \
            .join(Visit, FacultyVisit.InVisitID == Visit.VisitID) \
            .filter(monthAgo <= Visit.VisitDate) \
            .all()
        
        #The calculated faculty workload is the following:
        # 4x^4 + 3y^3 + 2z^2 + 0.25*w
        # Where:
        #   * x is the number of faculty visits in the last week or future
        #   * y is the number of faculty visits in the week two weeks ago
        #   * z is the number of faculty visits in the week three weeks ago
        #   * w is the number of faculty visits in the week four weeks ago

        weeksAgo : list[date] = [today - weeks*timedelta(days=7) for weeks in range(0,5)]

        mostRecentVisits = sum(1 for v in visits if weeksAgo[1] <= v.Visit.VisitDate)
        twoWeeksAgo = sum(1 for v in visits if weeksAgo[2] <= v.Visit.VisitDate < weeksAgo[1])
        threeWeeksAgo = sum(1 for v in visits if weeksAgo[3] <= v.Visit.VisitDate < weeksAgo[2])
        fourWeeksAgo = sum(1 for v in visits if weeksAgo[4] <= v.Visit.VisitDate < weeksAgo[3])

        return 4*pow(mostRecentVisits, 4) \
            +3*pow(twoWeeksAgo, 3) \
            +2*pow(threeWeeksAgo, 2) \
            +fourWeeksAgo

    def to_json(self):
        return {
            "FacultyID" : self.FacultyID,
            "Email" : self.Email,
            "FirstName" : self.FirstName,
            "LastName" : self.LastName,
            "MiddleInitial" : self.MiddleInitial,
            "Title" : self.Title,
            "OfficeBuilding" : self.OfficeBuilding,
            "OfficeNumber" : self.OfficeNumber,
            "AllowInVisits" : self.AllowInVisits,
            "Archived" : self.Archived,
            "EmailValid" : self.EmailValid,
            "BelongsToDept" : self.BelongsToDept.to_json(),
            "FacultyWorkload": self.faculty_workload
        }
    
    @staticmethod
    def from_json(json):
        return Faculty(
            Email = json['Email'],
            FirstName = json['FirstName'],
            LastName =json['LastName'],
            MiddleInitial= json['MiddleInitial'],
            Title= json['Title'],
            OfficeBuilding= json['OfficeBuilding'],
            OfficeNumber= json['OfficeNumber'],
            AllowInVisits= bool(json['AllowInVisits']),
            Archived= bool(json['Archived']),
            EmailValid = bool(json['EmailValid']),
            BelongsToDeptID= int(json['BelongsToDeptID'])
        )

    @staticmethod
    def get_available_faculty_visits(departmentID : int, visit: Visit, startsBetween: tuple[datetime,datetime]):
        #Construct query for all faculty in the selected department that are allowed
        faculty : list[Faculty] = Faculty.query.filter_by(BelongsToDeptID = departmentID, AllowInVisits = True, Archived = False).all()

        #Correspond all faculty with the meeting times during this visit they are available for
        faculty_availability = get_faculty_availability(faculty, visit, startsBetween)

        #Filter off all faculty who aren't available (don't have any available times left)
        faculty_availability = [f for f in faculty_availability if len(f[1]) > 0]

        from schedule import CandidateFacultyVisit
        #Return all candidate visits for each available faculty
        candidate_faculty_visits = []
        for (faculty, times) in faculty_availability:
            candidate_faculty_visits.append([
                CandidateFacultyVisit(faculty, start, end, visit) for (start, end) in times
            ])
        return candidate_faculty_visits

def get_faculty_availability(faculty: list[Faculty], visit : Visit, startsBetween: tuple[datetime,datetime]) -> list[tuple[Faculty, list[tuple[time,time]]]]:
    faculty_availability = list(zip(faculty, graph_client.get_availability([f.Email for f in faculty], visit.VisitDate, startsBetween[0], startsBetween[1])))

    #Remove any time ranges that overlap with a class the faculty member teaches
    faculty_availability = [
        (faculty, [time_range for time_range in availability if not faculty.teaches_during(time_range, visit)])
        for (faculty, availability) in faculty_availability
    ]

    return faculty_availability