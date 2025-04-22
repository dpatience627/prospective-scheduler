from app import app, db, graph_client
from flask import request, jsonify
from tables.visit import Visit
from tables.student import Student
from tables.faculty import Faculty
from tables.events import FacultyVisit, ClassVisit, StudentVisit
from tables.classes import Class, ClassMeetingTime
from datetime import time, datetime
from utils.dateutils import time_ranges_overlap, datetime_range_from_string
from routes.routeutils import authorize, api_arg_error, api_id_error

class CandidateVisit:
    def __init__(self, start_time : time, end_time : time, in_visit: Visit):
        self.start_time = start_time
        self.end_time = end_time
        self.in_visit = in_visit

    @property
    def start_date_time(self) -> datetime:
        date : datetime = self.in_visit.VisitDate
        start : time = self.start_time
        return datetime(date.year, date.month, date.day, start.hour, start.minute, start.second)

    @property
    def end_date_time(self) -> datetime:
        date : datetime = self.in_visit.VisitDate
        end : time = self.end_time
        return datetime(date.year, date.month, date.day, end.hour, end.minute, end.second)

    def to_json(self) -> dict:
        return {
            "inVisit": self.in_visit.to_json(),
            "startTime": self.start_time.__str__(),
            "endTime": self.end_time.__str__()
        }

class CandidateClassVisit(CandidateVisit):
    def __init__(self, in_class: Class, in_visit: Visit):
        self.in_class = in_class
        meetingTime : ClassMeetingTime = in_class.get_meeting_time_during_visit(in_visit)
        CandidateVisit.__init__(self, meetingTime.StartTime, meetingTime.EndTime, in_visit)

    def to_visit(self) -> ClassVisit:
        return ClassVisit(
            InClassID = self.in_class.ClassID,
            InVisitID = self.in_visit.VisitID
        )

    def to_json(self):
        return {
            **CandidateVisit.to_json(self),
            "inClass": self.in_class.to_json()
        }
    
    @staticmethod
    def from_json(json):
        classID = int(json['inClass']['ClassID'])
        visitID = int(json['inVisit']['VisitID'])
        return CandidateClassVisit(Class.query.get(classID), Visit.query.get(visitID))

class CandidateFacultyVisit(CandidateVisit):
    def __init__(self, faculty: Faculty, start_time: time, end_time: time, in_visit: Visit):
        self.faculty = faculty
        CandidateVisit.__init__(self, start_time, end_time, in_visit)

    def to_visit(self) -> FacultyVisit:
        return FacultyVisit(
            WithFacultyID = self.faculty.FacultyID,
            InVisitID = self.in_visit.VisitID,
            StartTime = self.start_time,
            EndTime = self.end_time
        )

    def to_json(self):
        return {
            **CandidateVisit.to_json(self),
            "withFaculty": self.faculty.to_json(),
        }
    
    @staticmethod
    def from_json(json):
        facultyID = int(json['withFaculty']['FacultyID'])
        visitID = int(json['inVisit']['VisitID'])
        return CandidateFacultyVisit(
            Faculty.query.get(facultyID),
            time.fromisoformat(json['startTime']),
            time.fromisoformat(json['endTime']),
            Visit.query.get(visitID),
        )

class CandidateStudentLunch(CandidateVisit):
    def __init__(self, student: Student, start_time: time, end_time: time, in_visit: Visit):
        self.student = student
        CandidateVisit.__init__(self, start_time, end_time, in_visit)

    def to_visit(self) -> StudentVisit:
        return StudentVisit(
            StartTime = self.start_time,
            EndTime = self.end_time,
            WithStudentID = self.student.StudentID,
            InVisitID = self.in_visit.VisitID
        )

    def to_json(self):
        return {
            **CandidateVisit.to_json(self),
            "withStudent": self.student.to_json()
        }
    
    @staticmethod
    def from_json(json):
        studentID = int(json['withStudent']['StudentID'])
        visitID = int(json['inVisit']['VisitID'])
        return CandidateStudentLunch(
            Student.query.get(studentID),
            time.fromisoformat(json['startTime']),
            time.fromisoformat(json['endTime']),
            Visit.query.get(visitID)
        )

class CandidateSchedule:
    def __init__(
        self,
        forVisit : Visit,
        classVisit : CandidateClassVisit = None,
        facultyVisit: CandidateFacultyVisit = None,
        studentLunch: CandidateStudentLunch = None
    ):
        self.forVisit = forVisit
        self.classVisit = classVisit
        self.facultyVisit = facultyVisit
        self.studentLunch = studentLunch
    
    def update_event(self, event):
        if event is None:
            return
        elif type(event) == CandidateClassVisit:
            self.classVisit = event
        elif type(event) == CandidateFacultyVisit:
            self.facultyVisit = event
        elif type(event) == CandidateStudentLunch:
            self.studentLunch = event

    def to_json(self):
        return {
            "classVisit": None if self.classVisit is None else self.classVisit.to_json(),
            "facultyVisit": None if self.facultyVisit is None else self.facultyVisit.to_json(),
            "studentLunch": None if self.studentLunch is None else self.studentLunch.to_json()
        }
    
    def add_events_to_visit(self):
        eventsToAdd = []

        #If the schedule had a class visit, add that to the visit
        if self.classVisit:
            classVisit : ClassVisit = self.classVisit.to_visit()

            visit : Visit = self.classVisit.in_visit
            clazz : Class = self.classVisit.in_class
            classVisit.OutlookMeetingID = graph_client.create_meeting(
                "Allowing Prospective Student in Class",
                f"Can {visit.StudentFirstName} {visit.StudentLastName} sit in on {clazz.ClassName} {clazz.Section} at this time?",
                self.classVisit.start_date_time,
                self.classVisit.end_date_time,
                [clazz.TaughtBy.Email]
            )

            eventsToAdd.append(classVisit)
        
        #If the schedule had a faculty visit, add that to the visit
        if self.facultyVisit:
            facultyVisit : FacultyVisit = self.facultyVisit.to_visit()

            visit : Visit = self.facultyVisit.in_visit
            faculty : Faculty = self.facultyVisit.faculty
            facultyVisit.OutlookMeetingID = graph_client.create_meeting(
                "Meeting w/ Prospective Student",
                f"Are you available to meet with {visit.StudentFirstName} {visit.StudentLastName} in your office at this time?",
                self.facultyVisit.start_date_time,
                self.facultyVisit.end_date_time,
                [faculty.Email]
            )

            eventsToAdd.append(facultyVisit)

        #If the schedule had a student lunch, add that to the visit
        if self.studentLunch:
            lunch : StudentVisit = self.studentLunch.to_visit()

            visit : Visit = self.studentLunch.in_visit
            student : Student = self.studentLunch.student
            lunch.OutlookMeetingID = graph_client.create_meeting(
                "Lunch w/ Prospective Student",
                f"Are you available to meet with {visit.StudentFirstName} {visit.StudentLastName} at Hicks Cafeteria for a meal at this time?",
                self.studentLunch.start_date_time,
                self.studentLunch.end_date_time,
                [student.Email]
            )
            
            eventsToAdd.append(lunch)

        if len(eventsToAdd) > 0:
            db.session.add_all(eventsToAdd)
            db.session.commit()

    def is_valid(self) -> bool:
        time_ranges : list[tuple[time,time]] = self.time_ranges_in_schedule()

        #If we have no events, this isn't a valid schedule
        if len(time_ranges) == 0:
            return False

        #Checks if the new events in this schedule
        #don't overlap with the events already in the schedule
        fitsWithCurrentEvents = True
        for time_range in time_ranges:
            fitsWithCurrentEvents &= self.forVisit.is_time_range_available(time_range[0], time_range[1])

        #Checks if any of the events in this
        #schedule overlap with each other
        conflictsWithSelf = False
        for i in range(0,len(time_ranges)):
            for j in range(i+1,len(time_ranges)):
                conflictsWithSelf |= time_ranges_overlap(time_ranges[i], time_ranges[j])

        return fitsWithCurrentEvents and not conflictsWithSelf

    def time_ranges_in_schedule(self) -> list[time,time]:
        time_ranges : list[tuple[time,time]] = [
            (visit.start_time, visit.end_time) for visit in
            filter(lambda v: v is not None, [self.classVisit, self.facultyVisit, self.studentLunch])
        ]

        return time_ranges

    @staticmethod
    def from_json(json, forVisit: Visit):
        return CandidateSchedule(
            forVisit = forVisit,
            classVisit = CandidateClassVisit.from_json(json['classVisit']) if json['classVisit'] else None,
            facultyVisit = CandidateFacultyVisit.from_json(json['facultyVisit']) if json['facultyVisit'] else None,
            studentLunch = CandidateStudentLunch.from_json(json['studentLunch']) if json['studentLunch'] else None
        )

def create_schedule_backtracking(event_lists: list[list], event_list_on: int, schedule: CandidateSchedule) -> bool:
    #If we've added an event from each event list by backtracking, return that the schedule was finalized
    if event_list_on >= len(event_lists):
        return True
    
    #Otherwise, try to add the remaining events.
    for event in event_lists[event_list_on]:
        schedule.update_event(event)

        #If the event selected doesn't work, keep searching
        if not schedule.is_valid():
            continue
            
        #Otherwise, try to add an event from the next event list via backtracking
        was_finalized = create_schedule_backtracking(event_lists, event_list_on+1, schedule)

        #If we found a successful schedule, return. Otherwise keep searching
        if was_finalized:
            return True
    
    #If we have exhausted all possibilities, this schedule cannot be created with the prior events
    return False

def generate_candidate_schedules(entity_lists : list[list], forVisit : Visit) -> list[CandidateSchedule]:
    candidate_schedules = []
    
    while len(entity_lists) < 3:
        entity_lists.append([[None]])
        
    for candidate_entity_0 in entity_lists[0]:
        for candidate_entity_1 in entity_lists[1]:
            for candidate_entity_2 in entity_lists[2]:
                event_list = [candidate_entity_0, candidate_entity_1, candidate_entity_2]
                schedule = CandidateSchedule(forVisit)
                if create_schedule_backtracking(event_list, 0, schedule):
                    candidate_schedules.append(schedule)

    return candidate_schedules

@app.post("/api/v1/generate-schedules/<int:visitID>/")
@authorize
def generate_schedules_for_visit(visitID):
    visit : Visit = Visit.query.get(visitID)
    if not visit:
        return api_id_error(visitID, "Visit")

    departmentID = request.json.get("departmentID")
    if not departmentID:
        return api_arg_error("departmentID")
    else:
        departmentID = int(departmentID)

    classVisitTimeRange = datetime_range_from_string(request.json["classVisitTimeRange"])
    facultyVisitTimeRange = datetime_range_from_string(request.json["facultyVisitTimeRange"])
    studentLunchTimeRange = datetime_range_from_string(request.json["studentLunchTimeRange"])

    #Get the available events during the visit as long as that type of event should be included
    event_lists = []
    if facultyVisitTimeRange:
        event_lists.append(Faculty.get_available_faculty_visits(departmentID, visit, facultyVisitTimeRange))
    if classVisitTimeRange:
        event_lists.append(Class.get_available_class_visits(departmentID, visit, classVisitTimeRange))
    if studentLunchTimeRange:
        event_lists.append(Student.get_available_student_lunches(departmentID, visit, studentLunchTimeRange))

    #Generate all valid schedules combining classes, faculty, & lunches
    schedules = generate_candidate_schedules(event_lists, visit)

    #Sort schedule by increasing faculty load (suggest ones with low load first)
    sorted(schedules, key = lambda schedule: schedule.facultyVisit.faculty.faculty_workload if schedule.facultyVisit is not None else 0)

    return jsonify([schedule.to_json() for schedule in schedules])