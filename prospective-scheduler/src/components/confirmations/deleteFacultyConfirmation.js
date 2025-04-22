import * as API from "api/api.js";
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import React, {useState, useEffect, setState} from "react";
import Stack from '@mui/material/Stack';
import { Dialog, FormControlLabel, Select, MenuItem } from "@mui/material";
import Grid from "@mui/material/Grid";
import TableRow from "components/table/TableRow";
import TableCell from "components/table/TableCell";
import Table from "components/table/Table";

const DeleteFacultyConfirmation = ({open, onClose, onConfirm, facultyToDelete}) =>{
    const facDefaults = {
        facTitle: "",
        firstName: "",
        lastName: "",
        middleInitial: "",
        email: "",
        officeBuilding: "",
        officeNumber: "",
        allowInVisits: false,
        archived: true,
        deptID: 1
    }
    const [facInfo, setFacInfo] = useState(facDefaults);
    const [affectedCourses, setAffectedCourses] = useState([]);
    const fac = prepareMember(facultyToDelete)
    
    const columns = [
        {name: "Course Name", width: 40}
    ]

    const renderAffected = (affectedClass) =>{
        return(
            <TableRow key={`${affectedClass.ClassID}`}>
                <TableCell>{affectedClass.ClassName}</TableCell>
            </TableRow>
        )
    }
    const closePopup = () => {
        console.log(affectedCourses);
        onClose();
    }

    const deleteFaculty = async (ID) => {
        await API.deleteFaculty(ID);
        closePopup();
    };

     useEffect(() => {
        if(facultyToDelete != null){
            setFacInfo(prepareMember(facultyToDelete));
            API.facultyAffectedCourses(facultyToDelete.FacultyID).then(affectCourses => {
                setAffectedCourses(affectCourses);
            })
        }
        
    }, [facultyToDelete])

    return (
        <Dialog open={open} onClose={closePopup} fullWidth maxWidth='lg' >
            <Stack spacing={2} sx={{mx: 5}} >
                <Typography sx={{pt: 5}} align="center">Are you sure you want to delete the following faculty Member:</Typography>
                <Typography align="center">{facInfo.facTitle} {facInfo.firstName} {facInfo.lastName}</Typography>
                <Table
                    title="Affected Courses"
                    columns={columns}
                    renderRow={renderAffected}
                    rows={affectedCourses}
                    paginated
                >

                </Table>
                <Grid container columnGap={24} justifyContent={'center'}>
                    <Grid item padding={2}>
                        <Button variant="outlined" sx={{bgcolor:'#3884ff', color:'#FFFFFF'}} onClick={closePopup}>Cancel</Button>
                    </Grid>
                    <Grid item padding={2}>
                        <Button variant="outlined" sx={{bgcolor:'#BB1111', color:"#FFFFFF"}} onClick={() => deleteFaculty(facultyToDelete.FacultyID)}>Delete Faculty</Button>
                    </Grid>
                </Grid>
            </Stack>
        </Dialog>
    )
}

const prepareMember = (facMem) =>{
    if(facMem == null){
        const toRet= {
            facTitle: "",
            firstName: "",
            lastName: "",
            middleInitial: "",
            email: "",
            officeBuilding: "",
            officeNumber: "",
            allowInVisits: false,
            archived: true,
            deptID: 1
        }
        return toRet;
    }else{
        const toRet = {
            facTitle: facMem.Title,
            firstName: facMem.FirstName,
            lastName: facMem.LastName,
            middleInitial: facMem.MiddleInitial,
            email: facMem.Email,
            officeBuilding: facMem.OfficeBuilding,
            officeNumber: facMem.OfficeNumber,
            allowInVisits: facMem.AllowInVisits,
            archived: facMem.Archived,
            deptID: facMem.BelongsToDept.DepartmentID
        };
     
        return toRet
    }
        
    
}

export default DeleteFacultyConfirmation;

