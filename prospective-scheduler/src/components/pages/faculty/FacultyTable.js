import React, {useState, useMemo} from "react";
import Button from '@mui/material/Button';
import APISelectList, { LIST_OF_DEPARTMENTS } from 'components/APISelectList';
import Grid from '@mui/material/Grid';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Checkbox from "@mui/material/Checkbox";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Tooltip from '@mui/material/Tooltip';
import Table from "components/table/Table";
import { ChainedPopupBuilder, ConfirmationPopup } from 'components/popups/Popups';
import { FacultyPopup } from './FacultyForms';

const columns = [
    {name: "Title", width: 5},
    {name: "First Name", width: 10},
    {name: "Last Name", width: 10},
    {name: "Email", width: 15},
    {name: "Office", width: 15},
    {name: "Department", width: 10},
    {name: "Allow In Visits?", width: 10},
    {name: "Valid Email", width: 5},
    {name: "Edit", width: 10},
    {name: "Delete", width: 10}
];

const facultyToForm = (faculty) => {
    return {
        ...faculty,
        BelongsToDeptID: faculty.BelongsToDept.DepartmentID
    }
}

const InvalidEmailWarning = ({facultyMember}) =>{
    if(!facultyMember.EmailValid){
        return <Tooltip title="EMAIL INVALID"><ErrorOutlineIcon/></Tooltip>;
    }
    return <></>;
}

const FacultyTable = ({faculty=[], loading, addFaculty=(facForm)=>{}, editFaculty=(facID, facForm)=>{}, deleteFaculty=(index)=>{}, onVerify=()=>{}}) => {
    const [selectedFacultyIdx, setSelectedFacultyIdx] = useState(-1);
    const selectedFaculty = (selectedFacultyIdx !== -1) ? faculty[selectedFacultyIdx] : null

    const [deptID, setDeptID] = useState(-1);

    const [addFacultyOpen, setAddFacultyOpen] = useState(false);
    const [editFacultyOpen, setEditFacultyOpen] = useState(false);
    const[deletePopup, startDelete] = 
        new ChainedPopupBuilder().addPopup(
            <ConfirmationPopup
            title="Confirm Faculty Deletion"
            confirmation="Deleting a faculty member will archive all of the classes the faculty member teaches. Would you like to proceed?"
            onConfirm={() => {deleteFaculty(selectedFacultyIdx);}}
        />).UseChainedPopup([selectedFacultyIdx]);

    const handleDelete = (index) => {
        setSelectedFacultyIdx(index);
        startDelete();
    }
    
    const renderFaculty = (facMember, index) => {
        return (
            <TableRow key={`${facMember.FacultyID}`}>
                <TableCell>{facMember.Title}</TableCell>
                <TableCell>{facMember.FirstName}</TableCell>
                <TableCell>{facMember.LastName}</TableCell>
                <TableCell>{facMember.Email}</TableCell>
                <TableCell>{facMember.OfficeBuilding}{facMember.OfficeNumber}</TableCell>
                <TableCell>{facMember.BelongsToDept.DepartmentAbbrev}</TableCell>
                <TableCell>
                    <Checkbox 
                        label="allowInVisits" 
                        checked={facMember.AllowInVisits}
                        onClick={() => {
                            facMember.AllowInVisits = !facMember.AllowInVisits;
                            editFaculty(facMember.FacultyID, facultyToForm(facMember))
                        }}>
                    </Checkbox>
                </TableCell>
                <TableCell>
                    <InvalidEmailWarning facultyMember={facMember}/>
                </TableCell>
                <TableCell>
                    <Button 
                        variant="outlined" 
                        sx={{bgcolor:'#3884ff', color:'#FFFFFF'}} 
                        onClick={() => {setSelectedFacultyIdx(index); setEditFacultyOpen(true);}}>
                            Edit
                    </Button>
                </TableCell>
                <TableCell>
                    <Button variant="outlined" sx={{bgcolor:'#BB1111', color:"#FFFFFF"}} onClick={() => {handleDelete(index)}}>
                        Delete
                    </Button>
                </TableCell>
            </TableRow>
        )
    }

    const includeInSearch = (fac, search, departmentID) => {
        if(departmentID !== -1 && fac.BelongsToDept.DepartmentID !== departmentID) {
            return false;
        }
        const inSearch = `${fac.Title} ${fac.FirstName} ${fac.MiddleInitial} ${fac.LastName} ${fac.Email} ${fac.OfficeBuilding} ${fac.OfficeNumber} ${fac.BelongsToDept.DepartmentAbbrev}`
                          .toLowerCase().includes(search.toLowerCase());
        return inSearch;
    };

    const deptSelect = useMemo(() =>{
        return (
            <Grid item xs={4} justifyContent={"center"}>
                <APISelectList type={LIST_OF_DEPARTMENTS} label="Filter by Department" noneName="All" defaultValue={-1} onChange={(e)=>{setDeptID(e.target.value)}} includeNone fullWidth/>
            </Grid>
        )
    }, []);
   
    return(
        <>
        <Table
            title="Faculty Data"
            alertWhenEmpty="There are currently no faculty. Try adding a faculty member or uploading a PDF containing faculty information!"
            alertWhenSearchFails="No faculty match your search. Try searching by name or user type!"
            loading={loading}
            columns={columns} 
            rows={faculty} 
            renderRow={renderFaculty}
            searchable includeInSearch={(facMember, search) =>includeInSearch(facMember, search, deptID)}
            children={deptSelect}
            onAddClicked={() => {setAddFacultyOpen(true);}}
            paginated
        />
        <FacultyPopup
            open={addFacultyOpen} onClose={() => {setAddFacultyOpen(false)}}
            onSubmit={addFaculty} currentFaculty={faculty} title="Add Faculty Member"
        />
        <FacultyPopup
            open={editFacultyOpen} onClose={() => {setEditFacultyOpen(false)}}
            onSubmit={(facForm) => {
                editFaculty(selectedFaculty.FacultyID, facForm)
            }}
            currentFaculty={faculty} title="Edit Faculty Member"
            selectedFaculty={selectedFaculty}
        />
        {deletePopup}
        </>
    )
    
}

export default FacultyTable;