import React, {useMemo, useState} from "react";
import { Button } from "@mui/material";
import Table from "components/table/Table";
import TableRow from "components/table/TableRow";
import TableCell from "components/table/TableCell";
import AddDepartmentPopup from "./AddDepartmentPopup";
import ConfirmationPopup from "components/confirmations/ConfirmationPopup";

const columns = [
    {name: "Department Name", width : 60},
    {name: "Abbreviation", width : 30},
    {name: "Delete Dept.", width : 10}
]

const includeDeptInSearch = (dept, search) => {
    return (dept.DepartmentName.toLowerCase().includes(search) || dept.DepartmentAbbrev.toLowerCase().includes(search)) && dept.DepartmentAbbrev !== "N/A";
}

const DepartmentsTable = ({departments=[], deleteDept=()=>{}, addDept=()=>{}, onDepartmentSelected = (dept)=>{}}) => {
    const [addDeptOpen, setAddDeptOpen] = useState(false);
    const openAddDept = () => {setAddDeptOpen(true);}
    const closeAddDept = () => {setAddDeptOpen(false);}

    const [deleteConfOpen, setDeleteConfOpen] = useState(false);
    const [deptIdxToDelete, setDeptIdxToDelete] = useState(-1);
    const handleDeleteDept = (index) => {
        setDeptIdxToDelete(index);
        setDeleteConfOpen(true);
    }

    const renderDept = (dept, index) => {
        return (
            <TableRow key={`${index}`}>
                <TableCell>{dept.DepartmentName}</TableCell>
                <TableCell>{dept.DepartmentAbbrev}</TableCell>
                <TableCell>
                    <Button
                        variant="contained" color="error"
                        onClick={()=>{handleDeleteDept(index)}}
                    >
                        Delete
                    </Button>
                </TableCell>
            </TableRow>
        )
    }

    return(
        <>
        <Table
            title="Departments"
            alertWhenSearchFails="No department matches your search."
            alertWhenEmpty="There are currently no departments. Try adding one with the button above or uploading a CSV!"
            columns={columns} rows={departments} renderRow={renderDept}
            onAddClicked={openAddDept} onRowSelected={onDepartmentSelected}
            searchable includeInSearch={includeDeptInSearch}
            paginated
        >
        </Table>
        
        <AddDepartmentPopup open={addDeptOpen} onClose={closeAddDept} onSubmit={addDept}/>
        <ConfirmationPopup
            title="Confirm Department Deletion"
            open={deleteConfOpen} onClose={()=>{setDeleteConfOpen(false)}}
            onConfirm={()=>{deleteDept(deptIdxToDelete)}}
        >
            Deleting a department will automatically move all majors, faculty, and classes in that department
            to the N/A department. Would you like to proceed?
        </ConfirmationPopup>
        </>
    )
}

export default DepartmentsTable;
