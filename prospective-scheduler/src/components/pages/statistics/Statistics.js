import React, { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Navigation from 'components/navigation/Navigation';
import NoShowsChart from './NoShowsChart';
import { useAllVisits, useVisits } from 'api/api';
import APISelectList, { LIST_OF_DEPARTMENTS } from 'components/APISelectList';
import { oneYearAgo, today } from 'utils/DateTimeUtils';
import ValidatedDatePicker from 'components/forms/fields/ValidatedDatePicker';
import dayjs from 'dayjs';
import VisitsByDeptChart from './VisitsByDeptChart';
import VisitsByFacultyTable from './VisitsByFacultyTable';
import Button from '@mui/material/Button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const filterVisits = (visits, departmentID, startDate, endDate) => {
    return visits.filter((visit) => {
        const visitDeptID = visit.IntendedMajor.BelongsToDepartmentID;
        const correctDeptID = (departmentID === -1) || (visitDeptID === departmentID);

        const visitDate = dayjs(visit.VisitDate);
        const comesAfterStart = startDate.isBefore(visitDate, 'day') || startDate.isSame(visitDate, 'day');
        const comesBeforeEnd = endDate.isAfter(visitDate, 'day') || endDate.isSame(visitDate, 'day');

        return correctDeptID && comesAfterStart && comesBeforeEnd;
    });
}

const Statistics = () => {
    const visits = useAllVisits([]);
    const [departmentID, setDepartmentID] = useState(-1);
    const [startDate, setStartDate] = useState(oneYearAgo());
    const [endDate, setEndDate] = useState(today());

    const filteredVisits = useMemo(() => {
        return filterVisits(visits, departmentID, startDate, endDate);
    }, [visits, departmentID, startDate, endDate])

    const ExportStatCSV = () => {
        //Create the contents of the stats CSV
        const columns = "Visit ID, Intended Major, Intended Major Department, Student Was No Show, Visited With Faculty, Faculty Department\n"
        const rows = [];
        for(const visit of filteredVisits) {
            const prefix = `${visit.VisitID}, ${visit.IntendedMajor.MajorName}, ${visit.IntendedMajor.MajorDepartment.DepartmentName}, ${visit.WasNoShow}`;
            if(visit.FacultyVisits.length === 0) {
                rows.push(`${prefix}, , `);
            } else {
                for(const fvisit of visit.FacultyVisits) {
                    const f = fvisit.WithFaculty;
                    rows.push(`${prefix}, ${f.Title} ${f.FirstName} ${f.MiddleInitial} ${f.LastName}, ${f.BelongsToDept.DepartmentName}`);
                }
            }
        }
        const stats = columns + rows.join("\n");

        //Setup and start the download
        const element = document.createElement("a");
        const file = new Blob([stats], {type: 'text/csv'});
        element.href = URL.createObjectURL(file);
        element.download = "prospective-scheduler-stats.csv";
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
      }

    const [paginated, setPaginated] = useState(true);
    
    const ExportStatPDF = async () => {
        const element = document.getElementById('stats-content');
        const canvas = await html2canvas(element);
        const data = canvas.toDataURL('image/png');

        const pdf = new jsPDF();
        const imgProperties = pdf.getImageProperties(data);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight =
        (imgProperties.height * pdfWidth) / imgProperties.width;

        pdf.addImage(data, 'PNG', 0, 0.25*pdfHeight, pdfWidth, pdfHeight);
        pdf.save('prospective-scheduler-stats.pdf');
    }

    useEffect(() => {
        if(!paginated) {
            ExportStatPDF();
            setPaginated(true);
        }
    }, [paginated]);

    let content = (
        <Grid item>
            <Alert severity="info">
                There are no visits that match the filter criteria provided.
                Try selecting a different department or all departments.
            </Alert>
        </Grid>
    )
    
    if(filteredVisits.length > 0) {
        content = (
            <>
            <Grid container direction="row" justifyContent="center" marginBottom={2}>
                <Grid item>
                    <NoShowsChart visits={filteredVisits}/>
                </Grid>
                <Grid item>
                    <VisitsByDeptChart visits={filteredVisits}/>
                </Grid>
            </Grid>
            <Grid container direction="row" justifyContent="center" >
                <Grid item xs={8}>
                    <VisitsByFacultyTable visits={filteredVisits} paginated={paginated}/>
                </Grid>
            </Grid>
            </>
        )
    }

    return (
        <Navigation>
            <Grid container spacing={2}>
                <Grid item xs={4}>
                    <APISelectList
                        label="Department Related to Visit" includeNone noneName="All"
                        type={LIST_OF_DEPARTMENTS} defaultValue={departmentID}
                        onChange={(event) => {setDepartmentID(event.target.value)}}
                        fullWidth
                    />
                </Grid>
                <Grid item width={200}>
                    <ValidatedDatePicker
                        label="Visits Occurred After" value={startDate} disableFuture fullWidth
                        onChange={(event)=>{setStartDate(event.target.value);}}
                        maxDate={endDate}
                    />
                </Grid>
                <Grid item width={200}>
                    <ValidatedDatePicker
                        label="Visits Occurred Before" value={endDate} disableFuture
                        onChange={(event)=>{setEndDate(event.target.value);}}
                        minDate={startDate}
                    />
                </Grid>
            </Grid>
            <Grid id="stats-content" container spacing={2} marginY={2}>
                {content}
            </Grid>

            {filteredVisits.length > 0 ?
                <Stack direction="row" spacing={2} sx={{ p : 2}} justifyContent="flex-end">
                    <Button variant="contained" component="label" onClick={ExportStatCSV}>
                        Export Stats to CSV
                    </Button>
                    <Button variant="contained" component="label" onClick={()=>{setPaginated(false)}}>
                        Export Stats to PDF
                    </Button>
                </Stack> : <></>
            }
        </Navigation>
    )
}

export default Statistics;