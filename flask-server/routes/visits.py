from flask import jsonify, request
from app import app, db, scheduler, graph_client
from datetime import datetime
from tables.visit import Visit, NoShowSurvey
from tables.events import FacultyVisit, ClassVisit, StudentVisit, EventStatus
from schedule import CandidateSchedule
from routes.routeutils import *
from LogClass import LogMessage

@app.post("/api/v1/visits/")
@authorize
@LogMessage
def get_visits():
    visitQuery = Visit.query
    if not request.json['includePastVisits']:
        now : datetime = datetime.today()
        today : datetime = datetime(now.year, now.month, now.day, 0, 0, 0)
        visitQuery = visitQuery.filter(Visit.VisitDate >= today)

    visits : list[Visit] = visitQuery.all()
    return jsonify({
        "count": len(visits),
        "visits": [visit.to_json() for visit in visits]
    })

@app.post("/api/v1/visit/get/<int:id>/")
@authorize
@LogMessage
def get_visit(id):
    visit : Visit = Visit.query.get(id)
    if not visit:
        return api_id_error(id, "Visit")
    
    return jsonify(visit.to_json())

@app.delete("/api/v1/visit/delete/<int:id>/")
@authorize
@LogMessage
def delete_visit(id):
    visit : Visit = Visit.query.get(id)
    if not visit:
        return api_id_error(id, "Visit")

    #Get rid of all events related to the visit
    for event in visit.events:
        event.delete()

    #Delete the visit now that it has no related events
    db.session.delete(visit)
    db.session.commit()
    return api_confirm_delete(id, "Visit")

@app.post("/api/v1/visit/add/")
@authorize
@LogMessage
def post_add_visit():
    try:
        visit : Visit = Visit.from_json(request.json)
    except:
        return api_construct_error("Visit")
    
    db.session.add(visit)
    db.session.commit()
    return jsonify(visit.to_json())

@app.post("/api/v1/visit/events/add/<int:id>/")
@authorize
@LogMessage
def post_add_events_to_visit(id):
    visit : Visit = Visit.query.get(id)
    if not visit:
        return api_id_error(id,"Visit")
    
    try:
        candidateSchedule = CandidateSchedule.from_json(request.json['candidateSchedule'], visit)
    except Exception as e:
        return api_error(f"Could not construct candidate schedule from request json: {str(e)}")

    candidateSchedule.add_events_to_visit()

    return jsonify(visit.to_json())

@app.delete("/api/v1/visit/events/cancel/faculty/<int:id>/")
@authorize
@LogMessage
def delete_cancel_faculty_visit(id):
    facultyVisit : FacultyVisit = FacultyVisit.query.get(id)
    if not facultyVisit:
        return api_id_error(id, "FacultyVisit")

    visit : Visit = facultyVisit.Visit
    facultyVisit.delete()

    return jsonify(visit.to_json())

@app.delete("/api/v1/visit/events/cancel/class/<int:id>/")
@authorize
@LogMessage
def delete_cancel_class_visit(id):
    classVisit : ClassVisit = ClassVisit.query.get(id)
    if not classVisit:
        return api_id_error(id, "ClassVisit")
    
    visit : Visit = classVisit.Visit
    classVisit.delete()
    
    return jsonify(visit.to_json())

@app.delete("/api/v1/visit/events/cancel/student/<int:id>/")
@authorize
@LogMessage
def delete_cancel_student_visit(id):
    studentVisit : StudentVisit = StudentVisit.query.get(id)
    if not studentVisit:
        return api_id_error(id, "StudentVisit")

    visit : Visit = studentVisit.Visit
    studentVisit.delete()
    
    return jsonify(visit.to_json())

@app.post("/api/v1/visit/events/resend-invite/faculty/<int:id>/")
@authorize
@LogMessage
def post_resend_faculty_visit_invite(id):
    facultyVisit : FacultyVisit = FacultyVisit.query.get(id)
    if not facultyVisit:
        return api_id_error(id, "FacultyVisit")

    graph_client.send_email(
        "RE: Visit With Prospective Student",
        facultyVisit.Visit.get_reminder_email_body(),
        facultyVisit.WithFaculty.Email
    )
    
    return api_success("Reminder email sent")

@app.post("/api/v1/visit/events/resend-invite/student/<int:id>/")
@authorize
@LogMessage
def post_resend_student_visit_invite(id):
    studentVisit : StudentVisit = StudentVisit.query.get(id)
    if not studentVisit:
        return api_id_error(id, "StudentVisit")

    graph_client.send_email(
        "RE: Visit With Prospective Student",
        studentVisit.Visit.get_reminder_email_body(),
        studentVisit.WithStudent.Email
    )
    
    return api_success("Reminder email sent")

@app.post("/api/v1/visit/events/resend-invite/class/<int:id>/")
@authorize
@LogMessage
def post_resend_class_visit_invite(id):
    classVisit : ClassVisit = ClassVisit.query.get(id)
    if not classVisit:
        return api_id_error(id, "ClassVisit")

    graph_client.send_email(
        "RE: Visit With Prospective Student",
        classVisit.Visit.get_reminder_email_body(),
        classVisit.Class.TaughtBy.Email
    )
    
    return api_success("Reminder email sent")

#LEAVE THIS UNAUTHORIZED! THIS IS FOR EVENT PARTICIPANTS WHO MAY NOT BE SYSTEM USERS!
@app.get("/api/v1/visit/noshow-survey/<int:id>/")
def get_no_show_survey(id):
    survey : NoShowSurvey = NoShowSurvey.query.get(id)
    if not survey:
        return api_id_error(id, "NoShowSurvey")
    
    return jsonify(survey.to_json())

#LEAVE THIS UNAUTHORIZED! THIS IS FOR EVENT PARTICIPANTS WHO MAY NOT BE SYSTEM USERS!
@app.post("/api/v1/visit/noshow-survey/respond/<int:id>/")
def respond_to_noshow_survey(id):
    survey : NoShowSurvey = NoShowSurvey.query.get(id)
    if not survey:
        return api_id_error(id, "NoShowSurvey")
    
    try:
        survey.WasNoShow = bool(request.json['wasNoShow'])
        db.session.commit()
    except Exception as e:
        return api_error(str(e))
    
    return api_success("Survey response recieved.")

#Scheduled jobs based on visits
def refresh_visit_statuses():
    with app.app_context():
        visits : list[Visit] = Visit.query.filter(Visit.VisitDate >= datetime.today()).all()
        
        for visit in visits:
            visit.refresh_status()
scheduler.add_job(func=refresh_visit_statuses, trigger="interval", minutes=15)

def send_noshow_surveys():
    '''
    Sends no-show survey emails to all event participants in all past visits
    that have not yet had survey emails sent. Scheduled to run once a day.
    '''
    with app.app_context():
        past_visits : list[Visit] = Visit.query.filter(Visit.VisitDate < datetime.today()).all()

        for visit in past_visits:
            send_noshow_surveys_for_visit(visit)
scheduler.add_job(func=send_noshow_surveys, trigger="interval", days=1)

def send_noshow_surveys_for_visit(visit: Visit):
    '''
    Sends no-show survey emails to all event participants in the passed in visit,
    as long as no-show surveys haven't already been sent out.
    '''
    if not visit.were_no_show_surveys_sent:
        #Create the surveys for all events that actually occurred
        accepted_events = list(filter(lambda event: event.MeetingStatus == EventStatus.ACCEPTED.value, visit.events))
        surveys : list[NoShowSurvey] = [NoShowSurvey(ForVisitID=visit.VisitID, RecipientEmail=event.coordinator_email, WasNoShow=False) for event in accepted_events]
        db.session.add_all(surveys)
        db.session.commit()
        
        #Send emails for the surveys
        for survey in surveys:
            survey.send_to_recipient()