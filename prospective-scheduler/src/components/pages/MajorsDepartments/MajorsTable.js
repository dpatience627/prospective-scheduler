import React, {useMemo, useState, useEffect} from "react";
import * as API from "api/api.js";
import { Button } from "@mui/material";
import Table from "components/table/Table";
import TableRow from "components/table/TableRow";
import TableCell from "components/table/TableCell";
import AddMajorPopup from "./AddMajorPopup";
import ConfirmationPopup from "components/confirmations/ConfirmationPopup";
import ValidatedTextField from "components/forms/fields/ValidatedTextField";

const columns = [
    {name: "Major", width: 75},
    {name: "Delete Major", width: 25}
];

const MajorsTable = ({department, fileUploadUpdate}) => {
    const [majorsDeleted, setMajorsDeleted] = useState(false);
    const [majors, editMajor, deleteMajor, addMajor] = API.useMajors([majorsDeleted, fileUploadUpdate]);
    const [deleteAllMajors, setDeleteAllMajors] = useState(false);

    const includeMajorInSearch = (major, search) => {
        return major.MajorName.toLowerCase().includes(search) && major.BelongsToDepartmentID === department.DepartmentID;
    }

    const deleteDeptMajors = (dept) => {
        API.deleteMajorsByDept(dept.DepartmentID).then(() => {
            setMajorsDeleted(!majorsDeleted);
        })
    }
    
    const [addMajorsOpen, setAddMajorsOpen] = useState(false);
    const openAddMajor = () => {setAddMajorsOpen(true);}
    const closeAddMajor = () => {setAddMajorsOpen(false);}

    const [deleteConfOpen, setDeleteConfOpen] = useState(false);
    const [majorIdxToDelete, setMajorIdxToDelete] = useState(-1);
    const handleDeleteMajor = (index) => {
        setMajorIdxToDelete(index);
        setDeleteConfOpen(true);
    }

    const [majorEditing, setMajorEditing] = useState();
    const [majorName, setMajorName] = useState("");

    const saveMajorEdits = (major) => {
        editMajor(major.MajorID, {
            majorName: majorName,
            majorDeptID: major.BelongsToDepartmentID
        });
    }

    const renderMajor = (major, index) => {
        return (
            <TableRow key={`${index}`}>
                <TableCell>
                    <ValidatedTextField 
                        value={majorEditing === major ? majorName : major.MajorName}
                        onClick={()=>{setMajorEditing(major); setMajorName(major.MajorName);}}
                        onChange={(e)=>{setMajorName(e.target.value)}}
                        onBlur={() => {saveMajorEdits(major)}}
                    />
                </TableCell>
                <TableCell>
                    <Button variant="contained" color="error" onClick={() => {handleDeleteMajor(index)}}>Delete</Button>
                </TableCell>
            </TableRow>
        )
    }

    return(
        <>
        <Table
            title="Majors in This Department"
            alertWhenSearchFails="No majors in this department match your search."
            alertWhenEmpty="There are no majors in this department. Try adding one with the button above or uploading a CSV!"
            columns={columns} rows={majors} renderRow={renderMajor}
            onAddClicked={openAddMajor}
            searchable includeInSearch={includeMajorInSearch}
            paginated
        />
        <AddMajorPopup
            department={department}
            open={addMajorsOpen} onClose={closeAddMajor} onSubmit={addMajor}
        />
        <ConfirmationPopup
            title="Confirm Major Deletion"
            open={deleteConfOpen} onClose={()=>{setDeleteConfOpen(false)}}
            onConfirm={()=>{deleteMajor(majorIdxToDelete)}}
        >
            Deleting a major will automatically change affected students' majors in the system. Would you like to proceed?
        </ConfirmationPopup>
        <ConfirmationPopup
            title="Confirm Majors Deletion"
            open={deleteAllMajors} 
            onClose={()=>{setDeleteAllMajors(false)}}
            onConfirm={() => {deleteDeptMajors(department)}}
        >
            Deleting all majors will automatically move all students and prospective students in those majors
            to the N/A major. Would you like to proceed?
        </ConfirmationPopup>
        <Button variant="contained" color="error" onClick={()=>{setDeleteAllMajors(true)}} sx={{marginY: 2}}>Delete All Majors</Button>
        </>
    )
}

export default MajorsTable;