import React, {useState, useMemo} from "react";
import * as API from "api/api.js";

import Button from '@mui/material/Button';
import Table from 'components/table/Table';
import TableCell from 'components/table/TableCell';
import TableRow from 'components/table/TableRow';
import AddVisitPopup from 'components/pages/visits/AddVisitPopup';
import { fromDBDateForUser as fdate } from "utils/DateTimeUtils";

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BlockIcon from '@mui/icons-material/Block';
import CheckIcon from '@mui/icons-material/Check';
import Tooltip from '@mui/material/Tooltip';

const VisitStatusIcons = ({visit}) => {

    const icons = useMemo(() => {
        const icons = []

        for(const statusID of visit.VisitStatus) {
            switch(statusID) {
                case API.VISIT_STATUS_NO_EVENTS: icons.push(<Tooltip key={statusID} title="NO EVENTS"> <ErrorOutlineIcon style={{pointerEvents: 'none'}}/> </Tooltip>); continue;
                case API.VISIT_STATUS_PENDING: icons.push(<Tooltip key={statusID} title="PENDING"> <AccessTimeIcon style={{pointerEvents: 'none'}}/> </Tooltip>); continue;
                case API.VISIT_STATUS_DECLINED: icons.push(<Tooltip key={statusID} title="EVENT DECLINED"> <BlockIcon style={{pointerEvents: 'none'}}/> </Tooltip>); continue;
                case API.VISIT_STATUS_COMPLETE: icons.push(<Tooltip key={statusID} title="COMPLETE"> <CheckIcon style={{pointerEvents: 'none'}}/> </Tooltip>); continue;
            }
        }

        return icons;
    }, [visit]);

    return <>{icons}</>
}

const columns = [
    {name: "Student", width: 25},
    {name: "Visit Date", width: 25},
    {name: "Visit Status", width: 25},
    {name: "Delete Visit", width: 25}
];

const VisitTable = ({visits, onVisitSelected = (visitID) => {}, onAdd, onDelete}) => {
    const [addVisitOpen, setAddVisitOpen] = useState(false);

    const openAddVisit = () => {
        setAddVisitOpen(true);
    }

    const closeAddVisit = () => {
        setAddVisitOpen(false);
    }

    const renderVisit = (visit, index) => {
        return (
            <TableRow key={visit.VisitID}>
                <TableCell>{visit.StudentFirstName} {visit.StudentMiddleInitial} {visit.StudentLastName}</TableCell>
                <TableCell>{fdate(visit.VisitDate)}</TableCell>
                <TableCell>
                    <VisitStatusIcons visit={visit}/>
                </TableCell>
                <TableCell sx={{pointerEvents: "none"}}><Button sx={{pointerEvents: "initial"}} variant="contained" color="error" onClick={() => {onDelete(index)}}>Delete</Button></TableCell>
            </TableRow>
        )
    }

    const includeInSearch = (visit, search) => {
        const name = `${visit.StudentFirstName} ${visit.StudentMiddleInitial} ${visit.StudentLastName}`.toLowerCase();
        const date = fdate(visit.VisitDate);
        return name.includes(search) || date.includes(search);
    }

    return (
        <>
        <Table
            title="Upcoming Visits" columns={columns} rows={visits}
            renderRow={renderVisit} onRowSelected={onVisitSelected}
            onAddClicked={openAddVisit}
            searchable includeInSearch={includeInSearch}
            alertWhenSearchFails="No visits match your search."
            alertWhenEmpty="There are no prospective student visits. Click on 'Add' to create one!"
            paginated
        />
        <AddVisitPopup open={addVisitOpen} onClose={closeAddVisit} onSubmit={onAdd}/>
        </>
    )
}

export default VisitTable;