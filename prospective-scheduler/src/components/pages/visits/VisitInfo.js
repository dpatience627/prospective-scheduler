import React, { useState } from "react";
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography';
import ReplayIcon from '@mui/icons-material/Replay';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Table from "components/table/Table";
import TableCell from "components/table/TableCell";
import TableRow from "components/table/TableRow";
import AddEventsPopup from "./AddEventsPopup";

import * as API from 'api/api';
import { fromDBTimeForUser as ftime, fromDBDateForUser as fdate, fromDBTime } from "utils/DateTimeUtils";
import { AlertPopup, ChainedPopupBuilder, ConfirmationPopup, LoadingPopup } from 'components/popups/Popups';

const EVENT_FACULTY_VISIT = "Faculty Visit";
const EVENT_STUDENT_LUNCH = "Student Lunch";
const EVENT_CLASS_VISIT = "Class Visit";

const EVENT_TABLE_COLUMNS = [
    {name: "Event" , width: 10},
    {name: "Info" , width: 30},
    {name: "Time" , width: 20},
    {name: "Location" , width: 15},
    {name: "Status" , width: 5},
    {name: "" , width: 20},
]

const fvisitstatus = (status) => {
    const descriptions = []
    for(const s of status) {
        switch(s) {
            case API.VISIT_STATUS_NO_EVENTS: descriptions.push("No Events Scheduled"); break;
            case API.VISIT_STATUS_PENDING: descriptions.push("Event Invitation Pending"); break;
            case API.VISIT_STATUS_DECLINED: descriptions.push("Event Invitation Declined"); break;
            case API.VISIT_STATUS_COMPLETE: descriptions.push("All Event Invitations Accepted"); break;
        }
    }
    return descriptions.join(", ");
}

const VisitInfo = ({visit=null, onEditVisit=(editedVisit)=>{}}) => {
    const [addEventsOpen, setAddEventsOpen] = useState(false);
    const [outlookLoadingMessage, setOutlookLoadingMessage] = useState(null);

    const openAddEvents = () => {
        setAddEventsOpen(true);
    }

    const closeAddEvents = async (eventsToAdd) => {
        if(eventsToAdd) {
            setOutlookLoadingMessage("Creating relevant outlook meetings...");
            API.addEventsToVisit(eventsToAdd, visit.VisitID).then(onEditVisit).then(() => {
                setOutlookLoadingMessage(null);
            });
        }
        setAddEventsOpen(false);
    }

    const cancelEvent = async (eventToCancel) => {
        setOutlookLoadingMessage("Canceling relevant outlook meetings...");
        const editVisit = (editedVisit) => {
            onEditVisit(editedVisit);
            setOutlookLoadingMessage(null);
        }

        switch(eventToCancel.type) {
            case EVENT_FACULTY_VISIT: API.cancelFacultyVisit(eventToCancel.id).then(editVisit); return;
            case EVENT_CLASS_VISIT: API.cancelClassVisit(eventToCancel.id).then(editVisit); return;
            case EVENT_STUDENT_LUNCH: API.cancelStudentLunch(eventToCancel.id).then(editVisit); return;
            default: return;
        }
    }

    const [eventToResend, setEventToResend] = useState(null);
    const resendInvite = async () => {
        switch(eventToResend.type) {
            case EVENT_FACULTY_VISIT: return API.resendFacultyVisitInvite(eventToResend.id);
            case EVENT_STUDENT_LUNCH: return API.resendStudentVisitInvite(eventToResend.id);
            case EVENT_CLASS_VISIT: return API.resendClassVisitInvite(eventToResend.id);
        }
    }
    
    const [resendPopup, startResend, endResend, setResendPopupIdxOpen] = 
        new ChainedPopupBuilder().addPopup(
            <ConfirmationPopup
                title="Send Outlook Meeting Reminder"
                confirmation="An email will be sent to the faculty/student involved with this event reminding of them their outstanding outlook meeting invite. Would you like to proceed?"
            />
        ).addPopup(
            <LoadingPopup title="Sending Meeting Reminder..." startLoad={resendInvite}/>
        ).addPopup(
            <AlertPopup title="Meeting Reminder Sent" severity="success" alert="Meeting reminder successfully sent."/>
        ).UseChainedPopup([eventToResend]);

    if(!visit) {
        return <>{resendPopup}</>
    }

    const events = prepareEvents(visit);

    const renderEvent = (event, index) => {
        return (
            <TableRow key={event.key}>
                <TableCell>{event.type}</TableCell>
                <TableCell>{event.info}</TableCell>
                <TableCell>{event.time}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>{event.status}</TableCell>
                <TableCell>
                    <Stack direction="row" spacing={2}>
                        <Button color="error" variant="contained" onClick={() => {cancelEvent(event)}}>Cancel</Button>
                        {event.status === "PENDING" ? <Tooltip title="Resend Outlook Invitation"><Button variant="contained" onClick={
                            () => {
                                setEventToResend(event);
                                startResend();
                            }
                        }><ReplayIcon/></Button></Tooltip> : <></>}
                    </Stack>
                </TableCell>
            </TableRow>
        )
    }
    
    return (
        <>
            <Typography variant="h4" gutterBottom>{visit.StudentFirstName} {visit.StudentMiddleInitial} {visit.StudentLastName}'s Visit</Typography>
            <Typography variant="h6" gutterBottom><b>Prospective Major:</b> {visit.IntendedMajor.MajorName}</Typography>
            <Typography variant="h6" gutterBottom><b>Visit Date:</b> {fdate(visit.VisitDate)} from {ftime(visit.StartTime)} to {ftime(visit.EndTime)}</Typography>
            <Typography variant="h6" gutterBottom mb={10}><b>Visit Status:</b> {fvisitstatus(visit.VisitStatus)}</Typography>
            <Table
                title="Visit Schedule" columns={EVENT_TABLE_COLUMNS} rows={events}
                renderRow={renderEvent} onAddClicked={openAddEvents}
                alertWhenEmpty="This visit has no scheduled events. Click on 'Add' to schedule some!"
            />
            <AddEventsPopup open={addEventsOpen} onClose={closeAddEvents} visit={visit}/>
            <LoadingPopup open={!!outlookLoadingMessage} title={outlookLoadingMessage}/>
            {resendPopup}
        </>
    )
}

const prepareEvents = (visit) => {
    //Merge all events together
    const events = visit.FacultyVisits
                        .concat(visit.ClassVisits)
                        .concat(visit.StudentVisits)
                        .map((event) => simplifyEvent(event)); 

    //Return sorted by time
    return events.sort((a,b) => (a.start.isBefore(b.start) ? -1 : 1));
}

const simplifyEvent = (event) => {
    const e = {
        status: event.MeetingStatus,
        time: `${ftime(event.StartTime)} - ${ftime(event.EndTime)}`,
        start: fromDBTime(event.StartTime)
    };

    if(event.FacultyVisitID){
        const faculty = event.WithFaculty;
        e.id = event.FacultyVisitID;
        e.key = `faculty-visit-${event.FacultyVisitID}`;
        e.type = EVENT_FACULTY_VISIT;
        e.info = `With ${faculty.Title} ${faculty.FirstName} ${faculty.MiddleInitial} ${faculty.LastName}`;
        e.location = `${faculty.OfficeBuilding} ${faculty.OfficeNumber}`;
    } else if(event.StudentVisitID) {
        const student = event.WithStudent;
        e.id = event.StudentVisitID;
        e.key = `student-visit-${event.StudentVisitID}`;
        e.type = EVENT_STUDENT_LUNCH;
        e.info = `With ${student.FirstName} ${student.MiddleInitial} ${student.LastName}`;
        e.location = "Hicks Cafeteria";
    } else {
        const _class = event.Class;
        e.id = event.ClassVisitID;
        e.key = `class-visit-${event.ClassVisitID}`;
        e.type = EVENT_CLASS_VISIT;
        e.info = `In "${_class.ClassName}"`;
        e.location = _class.Location;
    }

    return e;
}

export default VisitInfo;