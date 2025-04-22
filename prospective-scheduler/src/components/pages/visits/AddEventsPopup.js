import APISelectList, {LIST_OF_DEPARTMENTS} from 'components/APISelectList';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from 'components/table/Table';
import TableCell from "components/table/TableCell";
import TableRow from "components/table/TableRow";
import Typography from '@mui/material/Typography';
import ReplayIcon from '@mui/icons-material/Replay';
import CloseIcon from '@mui/icons-material/Close';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import * as API from "api/api.js";
import { useState, useEffect } from 'react';
import { fromDBTime, formatTimeRangeForDB, fromDBTimeForUser as ftime } from 'utils/DateTimeUtils';
import { ChainedPopupBuilder, LoadingPopup } from 'components/popups/Popups';
import { SingleInputTimeRangeField } from '@mui/x-date-pickers-pro/SingleInputTimeRangeField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const CANDIDATE_SCHEDULE_COLUMNS = [
    {name: "Faculty Visit", width: 25},
    {name: "Class Visit", width: 35},
    {name: "Student Lunch", width: 15},
    {name: "", width: 15}
]

const includeScheduleInSearch = (schedule, search) => {
    return facultyVisitInfo(schedule.facultyVisit).toLowerCase().includes(search) ||
           classVisitInfo(schedule.classVisit).toLowerCase().includes(search) ||
           studentLunchInfo(schedule.studentLunch).toLowerCase().includes(search);
}

const defaultLunchTime = (start, end) => {
    const noon = fromDBTime('12:00:00')
    const one = fromDBTime('13:00:00')

    let lunchStart = noon;
    let lunchEnd = one;

    if(start.isAfter(one) || end.isBefore(noon)) {
        console.log("completely outside");
        lunchStart = start;
        lunchEnd = end;
    } else {
        if(start.isAfter(noon)) {
            lunchStart = start;
        }
        if(end.isBefore(one)) {
            lunchEnd = end;
        }
    }

    //If we royally mess up..
    if(lunchStart.isSame(lunchEnd, "minute")) {
        //If we can extend by an hour, just do that
        lunchEnd = lunchEnd.add(1, 'hour');

        //Otherwise just use the whole range so it doesn't look dumb
        if(!lunchEnd.isBefore(end)) {
            lunchStart = start;
            lunchEnd = end;
        }
    }

    return [lunchStart, lunchEnd];
}

const isIntervalInvalid = (timeRange) => {
    return timeRange[1].diff(timeRange[0], 'minutes') < 15;
}

const AddEventsPopup = ({open, onClose, visit}) => {
    const [departmentID, setDepartmentID] = useState(1);
    const [includeClassVisits, setIncludeClassVisits] = useState(true);
    const [includeFacultyVisits, setIncludeFacultyVisits] = useState(true);
    const [includeStudentLunches, setIncludeStudentLunches] = useState(true);
    const [outOfSync, setOutOfSync] = useState(false);

    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        setOutOfSync(true);
    }, [departmentID, includeClassVisits, includeFacultyVisits, includeStudentLunches]);

    useEffect(() => {
        setDepartmentID(visit.IntendedMajor.BelongsToDepartmentID);
    }, [visit.VisitID]);

    const addAll = (schedule) => {
        onClose(schedule);
    }

    const renderSchedule = (schedule, index) => {
        return (
            <TableRow key={`candidate-schedule-${index}`}>
                <TableCell>{facultyVisitInfo(schedule.facultyVisit)}</TableCell>
                <TableCell>{classVisitInfo(schedule.classVisit)}</TableCell>
                <TableCell>{studentLunchInfo(schedule.studentLunch)}</TableCell>
                <TableCell><Button variant="contained" onClick={()=>{addAll(schedule)}}>Add All</Button></TableCell>
            </TableRow>
        )
    }

    const visitStart = fromDBTime(visit.StartTime);
    const visitEnd = fromDBTime(visit.EndTime);
    const [timeRanges, setTimeRanges] = useState({
        studentLunch: defaultLunchTime(visitStart, visitEnd),
        classVisit: [visitStart, visitEnd],
        facultyVisit: [visitStart, visitEnd],
    });
    useEffect(() => {
        setTimeRanges({
            studentLunch: defaultLunchTime(visitStart, visitEnd),
            classVisit: [visitStart, visitEnd],
            facultyVisit: [visitStart, visitEnd],
        });
        setLengthErrors({
            studentLunch: isIntervalInvalid(timeRanges.studentLunch),
            classVisit: isIntervalInvalid(timeRanges.classVisit),
            facultyVisit: isIntervalInvalid(timeRanges.facultyVisit)
        })
    }, [visit]);

    const [timeRangeErrors, setTimeRangeErrors] = useState({
        studentLunch: null,
        classVisit: null,
        facultyVisit: null
    });
    const [lengthErrors, setLengthErrors] = useState({
        studentLunch: false,
        classVisit: false,
        facultyVisit: false
    });
    const updateTimeRanges = (name, value) => {
        const updated = {...timeRanges};
        updated[name] = value;
        
        const newLengthErrors = {...lengthErrors};
        newLengthErrors[name] = isIntervalInvalid(updated[name]);
        setLengthErrors(newLengthErrors);

        setTimeRanges(updated);
        setOutOfSync(true);
    }
    const updateTimeRangeErrors = (name, value) => {
        const updated = {...timeRangeErrors};

        if(value[0] === "invalidRange" || value[1] === "invalidRange") {
            updated[name] = "Start must come before end!";
        } else if(value[0] === "minTime" || value[1] === "minTime" ) {
            updated[name] = "Must be during the visit!";
        } else if(value[0] === "maxTime" || value[1] === "maxTime" ) {
            updated[name] = "Must be during the visit!";
        } else if (!!value[0] || !!value[1]) {
            updated[name] = "Invalid input!";
        } else {
            updated[name] = null;
        }

        setTimeRangeErrors(updated);
    }
    const hasTimeRangeErrors = !!timeRangeErrors.studentLunch || !!timeRangeErrors.classVisit || !!timeRangeErrors.facultyVisit || lengthErrors.studentLunch || lengthErrors.classVisit || lengthErrors.facultyVisit;

    const generateSchedules = async () => {
        const classVisitTimeRange = includeClassVisits ? formatTimeRangeForDB(timeRanges.classVisit) : null;
        const facultyVisitTimeRange = includeFacultyVisits ? formatTimeRangeForDB(timeRanges.facultyVisit) : null;
        const studentLunchTimeRange = includeStudentLunches ? formatTimeRangeForDB(timeRanges.studentLunch) : null;

        const schedules = await API.getCandidateSchedules(visit.VisitID, departmentID, classVisitTimeRange, facultyVisitTimeRange, studentLunchTimeRange)
        setSchedules(schedules);
        setOutOfSync(false);
    }

    const [genLoadingPopup, startGen, endGen, setGenPopupIdxOpen] = 
        new ChainedPopupBuilder().addPopup(
            <LoadingPopup title="Generating candidate schedules..." startLoad={generateSchedules}/>
        ).UseChainedPopup([generateSchedules]);

    useEffect(() => {
        if(open) {
            startGen();
        }
    }, [open]);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Dialog open={open} onClose={(event)=>{onClose(null)}} fullWidth maxWidth="xl">
            <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                    <DialogTitle>Add Events</DialogTitle>
                </Grid>
                <Grid item xs>
                    <Grid container justifyContent={"flex-end"}> 
                        <Button variant="contained" justifyContent="center" color="error" onClick={(event)=>{onClose(null)}} sx={{margin: 2, height:1/2}}><CloseIcon/></Button>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container spacing={2} justifyContent="center">
                <Grid item width={460}>
                    <Stack spacing={3} direction="column" sx={{ p: 2 }}>
                        <Stack direction="column" spacing={2} sx={{ p: 2, border: 1}}>
                            <Typography variant="h6" gutterBottom><i>Events to Add</i></Typography>
                            <Grid container>
                                <Grid item>
                                    <FormControlLabel
                                        control={
                                            <Checkbox checked={includeFacultyVisits} onChange={(event)=>{setIncludeFacultyVisits(event.target.checked)}}/>
                                        }
                                        label="Faculty Visit"
                                    />
                                </Grid>                          
                                <Grid item xs>                                 
                                    <Grid container direction="row-reverse">      
                                    <Grid item>
                                        <SingleInputTimeRangeField
                                            label="Starts Between"
                                            value={timeRanges.facultyVisit}
                                            minTime={visitStart}
                                            maxTime={visitEnd}
                                            onChange={(range) => {updateTimeRanges("facultyVisit", range)}}
                                            onError={(error) => {updateTimeRangeErrors("facultyVisit", error)}}
                                            slotProps={{
                                                textField: {
                                                    error: !!timeRangeErrors.facultyVisit || lengthErrors.facultyVisit,
                                                    helperText: (lengthErrors.facultyVisit && !timeRangeErrors.facultyVisit) ? "Range must be at least 15 min!" : timeRangeErrors.facultyVisit,
                                                },
                                            }}
                                        />
                                    </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid container>
                                <Grid item>
                                    <FormControlLabel
                                        control={
                                            <Checkbox checked={includeClassVisits} onChange={(event)=>{setIncludeClassVisits(event.target.checked)}}/>
                                        }
                                        label="Class Visit"
                                    />
                                </Grid>
                                <Grid item xs>
                                    <Grid container direction="row-reverse">
                                    <Grid item>  
                                        <SingleInputTimeRangeField
                                            label="Starts Between"
                                            value={timeRanges.classVisit}
                                            minTime={visitStart}
                                            maxTime={visitEnd}
                                            onChange={(range) => {updateTimeRanges("classVisit", range)}}
                                            onError={(error) => {updateTimeRangeErrors("classVisit", error)}}
                                            slotProps={{
                                                textField: {
                                                    error: !!timeRangeErrors.classVisit || lengthErrors.classVisit,
                                                    helperText: (lengthErrors.classVisit && !timeRangeErrors.classVisit) ? "Range must be at least 15 min!" : timeRangeErrors.classVisit,
                                                },
                                            }}
                                        />
                                    </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <Grid container>
                                <Grid item>
                                    <FormControlLabel
                                        control={
                                            <Checkbox checked={includeStudentLunches} onChange={(event)=>{setIncludeStudentLunches(event.target.checked)}}/>
                                        }
                                        label="Student Lunch"
                                    />
                                </Grid>
                                <Grid item xs>
                                    <Grid container direction="row-reverse">
                                    <Grid item>
                                        <SingleInputTimeRangeField
                                            label="Starts Between"
                                            value={timeRanges.studentLunch}
                                            minTime={visitStart}
                                            maxTime={visitEnd}
                                            onChange={(range) => {updateTimeRanges("studentLunch", range)}}
                                            onError={(error) => {updateTimeRangeErrors("studentLunch", error)}}
                                            slotProps={{
                                                textField: {
                                                    error: !!timeRangeErrors.studentLunch || lengthErrors.studentLunch,
                                                    helperText: (lengthErrors.studentLunch  && !timeRangeErrors.studentLunch) ? "Range must be at least 15 min!" : timeRangeErrors.studentLunch,
                                                },
                                            }}
                                        />
                                    </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Stack>
                        <APISelectList label="Department" type={LIST_OF_DEPARTMENTS} defaultValue={departmentID} onChange={(event) => {setDepartmentID(event.target.value)}}/>
                    </Stack>
                </Grid>
                <Grid item width={800} sx={{ p: 2 }} m={2}>
                    
                    {outOfSync ? 
                        <Alert severity="warning">
                            <Stack alignItems="center" justifyContent="center" direction="row" spacing={2}>
                                <Typography>Your options changed. Regenerate schedules to get an updated list of schedules.</Typography>
                                <Button variant="contained" color="error" endIcon={<ReplayIcon/>} onClick={startGen} disabled={hasTimeRangeErrors}>Regenerate Schedules</Button>
                            </Stack>
                        </Alert>
                    :
                        <Table
                            title="Candidate Schedules"
                            alertWhenEmpty="No such candidate schedules are possible. Try modifying which events are included in the schedule!"
                            maxHeight={300}
                            columns={CANDIDATE_SCHEDULE_COLUMNS}
                            rows={schedules}
                            renderRow={renderSchedule}
                            searchable includeInSearch={includeScheduleInSearch}
                            paginated
                        />
                    }
                </Grid>
            </Grid>
        </Dialog>
        {genLoadingPopup}
        </LocalizationProvider>
    );
}

const facultyVisitInfo = (visit) => {
    if(!visit) {
        return "N/A";
    }
    const faculty = visit.withFaculty;
    return `w/ ${faculty.Title} ${faculty.FirstName} ${faculty.LastName} @ ${ftime(visit.startTime)}`;
}

const classVisitInfo = (visit) => {
    if(!visit) {
        return "N/A";
    }
    return `${visit.inClass.ClassName} @ ${ftime(visit.startTime)}`;
}

const studentLunchInfo = (lunch) => {
    if(!lunch) {
        return "N/A";
    }
    const student = lunch.withStudent;
    return `w/ ${student.FirstName} ${student.LastName} ${ftime(lunch.startTime)}`;
}

export default AddEventsPopup;