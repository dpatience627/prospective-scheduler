import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import APISelectList, { LIST_OF_DEPARTMENTS } from 'components/APISelectList';
import Table from 'components/table/Table';
import TableCell from 'components/table/TableCell';
import TableRow from 'components/table/TableRow';
import { useState } from 'react';

const classCode = (c) => {
    return `${c.BelongsToDept.DepartmentAbbrev} ${c.CourseNo} ${c.Section}`;
}

const classTeacher = (c) => {
    const prof = c.TaughtBy;
    return `${prof.Title} ${prof.FirstName} ${prof.MiddleInitial} ${prof.LastName}`;
}

const includeInSearch = (c, search, departmentID) => {
    if(departmentID !== -1 && c.BelongsToDept.DepartmentID !== departmentID) {
        return false;
    }

    return (
        c.ClassName.toLowerCase().includes(search) ||
        classCode(c).toLowerCase().includes(search) ||
        classTeacher(c).toLowerCase().includes(search) ||
        c.Location.toLowerCase().includes(search)
    );
}

const columns = [
    { name:"Code", width: 10 },
    { name:"Name", width: 30 },
    { name:"Teacher", width: 20 },
    { name:"Location", width: 30 },
    { name:"Allowed In Visits", width: 10 }
];

const ClassesTable = ({classes=[], loading, onClassEdit, onRefresh=()=>{}}) => {
    const [departmentID, setDepartmentID] = useState(-1);

    const toggleAllowInVisit = (c, index) => {
        c.AllowInVisits = !c.AllowInVisits;
        onClassEdit(index, c);
    }

    const renderClass = (c, index) => {
        return (
            <TableRow key={c.ClassID}>
                <TableCell>{classCode(c)}</TableCell>
                <TableCell>{c.ClassName}</TableCell>
                <TableCell>{classTeacher(c)}</TableCell>
                <TableCell>{c.Location}</TableCell>
                <TableCell><Checkbox checked={c.AllowInVisits} onClick={(e) => {toggleAllowInVisit(c, index)}}/></TableCell>
            </TableRow>
        )
    }

    return (
        <Table
            title="Classes Offered" columns={columns} rows={classes} loading={loading}
            renderRow={renderClass} paginated
            searchable includeInSearch={(c, search) => includeInSearch(c, search, departmentID)}
            alertWhenSearchFails="No class matches your search."
            alertWhenEmpty="There are currently no classes. Try refreshing from MyGCC. Note that this requires faculty to be present."
        >
            <Grid item xs={4}>
                <APISelectList type={LIST_OF_DEPARTMENTS} label="Filter by Department" noneName="All" defaultValue={-1} onChange={(e)=>{setDepartmentID(e.target.value)}} includeNone fullWidth/>
            </Grid>
            <Grid item xs>
                <Grid container justifyContent="flex-end">
                    <Button variant="contained" startIcon={<RefreshIcon/>} onClick={onRefresh}>Refresh From MyGCC</Button>
                </Grid>
            </Grid>
        </Table>
    )
}

export default ClassesTable;