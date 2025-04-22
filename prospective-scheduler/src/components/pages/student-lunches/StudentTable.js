import React, {useState, useMemo} from "react";
import * as API from "api/api.js";
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Table from "components/table/Table";
import TableRow from "components/table/TableRow";
import TableCell from "components/table/TableCell";
import AddStudentPopup from 'components/pages/student-lunches/AddStudentPopup';
import ConfirmationPopupOLD from "components/confirmations/ConfirmationPopup";
import { AlertPopup, ChainedPopupBuilder, LoadingPopup, UploadPopupStudent } from 'components/popups/Popups';
import APISelectList, { LIST_OF_MAJORS } from 'components/APISelectList';
import ExampleCSV from 'components/pages/student-lunches/example_students_csv.csv';

const columns = [
    {name: "Name", width: 40},
    {name: "Email", width: 40},
    {name: "Major", width: 40},
    {name: "Delete Student", width: 30},
]
const StudentTable = ({students, onStudentSelected = (studentID) => {}, onTableUpdate=()=>{}}) => {
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [addStudentOpen, setAddStudentOpen] = useState(false);
    const [majorID, setMajorID] = useState(-1);
    const [deleteConfOpen, setDeleteConfOpen] = useState(false);
    const [deleteAllConfOpen, setDeleteAllConfOpen] = useState(false);
    const [studentIndexToDelete, setStudentIndexToDelete] = useState(-1);

    const deleteStudent = async (id) => {
        await API.deleteStudent(id);
        if(selectedStudent && selectedStudent.studentID === id) {
            selectStudent(null, null);
        }
        onTableUpdate();
    };
    
    const deleteAllStudents = () => {
        for (let i = 0; i < students.length; i++) {
            console.log("DIE" + students[i].StudentID);
            deleteStudent(students[i].StudentID);
          }
    }

    const handleDeleteStudent = (index) => {
        setStudentIndexToDelete(index);
        setDeleteConfOpen(true);
    }

    const handleDeleteAllStudents = () => {
        setDeleteAllConfOpen(true);
    }

    const selectStudent = (row, studentID) => {
        if(selectedStudent) {
            selectedStudent.row.style.backgroundColor = "white";
            console.log(row);
            console.log(studentID);
        }
        
        if(row) {
            row.style.backgroundColor = "#888888"
            onStudentSelected(studentID);
            setSelectedStudent({row: row, studentID: studentID});
            console.log(row);
            console.log(studentID);
        } else {
            onStudentSelected(null);
            setSelectedStudent(null);
        }
    }

    const includeInSearch = (student, search, majorID) => {
        if(majorID !== -1 && student.PursuingMajor.MajorID !== majorID) {
            return false;
        }

        const inSearch = `${student.FirstName} ${student.MiddleInitial} ${student.LastName}`.toLowerCase().includes(search.toLowerCase());
        return inSearch;
    };

    const openAddStudent = () => {
        setAddStudentOpen(true);
    }

    const closeAddStudent = () => {
        setAddStudentOpen(false);
    }

    const addStudent = async (form) => {
        API.addStudent(form.email, form.firstName, form.lastName, form.middleInitial, form.pursuingMajorID)
           .then(() => onTableUpdate());
    }

    const renderStudent = (student, index) => {
        return (
            <TableRow key={`${index}`}>
                <TableCell>{student.FirstName} {student.MiddleInitial} {student.LastName}</TableCell>
                <TableCell>{student.Email}</TableCell>
                <TableCell>{student.PursuingMajor.MajorName}</TableCell>
                <TableCell><Button variant="contained" color="error" onClick={() => {handleDeleteStudent(student.StudentID)}}>Delete</Button></TableCell>
            </TableRow>
        )
    }

    const majorSelect = useMemo(() =>{
        return(
            <Grid item xs={4} justifyContent={"center"}>
                <APISelectList type={LIST_OF_MAJORS} label="Filter by Major" noneName="All" defaultValue={-1} onChange={(e)=>{setMajorID(e.target.value)}} includeNone fullWidth formItem/>
            </Grid>
        )
    })

    const [studentCSV, setStudentCSV] = useState(null);
    const [uploadResponse, setUploadResponse] = useState(false);
    const uploadStudents = async () => {
        const response = await API.studentFileUpload(studentCSV);
        setUploadResponse(response);
        onTableUpdate();
    }

    const [uploadPopupStudent, startUpload] = 
        new ChainedPopupBuilder().addPopup(
            <UploadPopupStudent
                title="Upload Students from CSV"
                onUpload={setStudentCSV}
            >
                <Alert severity='info'>
                    An example CSV file in the correct format can be found <a href={ExampleCSV}>here</a>.
                </Alert>
            </UploadPopupStudent>
        ).addPopup(
            <LoadingPopup
                title="Uploading Students from CSV"
                startLoad={uploadStudents}
            />
        ).addPopup(
            <AlertPopup
                title={!uploadResponse.error ? "Upload Successful" : "Upload Unsuccessful"}
                alert={!uploadResponse.error ? "The student upload was successful!" : "The student upload was not successful. The file you uploaded may be incorrectly formatted."}
                severity={!uploadResponse.error ? "success" : "error" }
            />
        ).UseChainedPopup([studentCSV, uploadResponse]);


    return (
        <>
        <Table
            title="Students Available for Student Lunches"
            alertWhenEmpty="There are currently no students. Try manually adding students or uploading them from a CSV!"
            alertWhenSearchFails="No students match your search."
            columns={columns} rows={students} renderRow={renderStudent}
            searchable includeInSearch={(student, search) => includeInSearch(student, search, majorID)}
            children={majorSelect}
            onRowSelected={onStudentSelected} onAddClicked={openAddStudent}
            paginated
            
        />
        <Button variant="contained" onClick={startUpload}  sx={{marginY: 2}} >Upload Students</Button>
        {uploadPopupStudent}
        <ConfirmationPopupOLD
            title="Confirm Student Deletion"
            open={deleteConfOpen} onClose={()=>{setDeleteConfOpen(false)}}
            onConfirm={()=>{deleteStudent(studentIndexToDelete)}}
        >
            Are you sure you want to delete this student? All visits they are in will be canceled upon deletion.
        </ConfirmationPopupOLD>
        <br></br>
        <Button variant="contained" color="error" onClick={() => {handleDeleteAllStudents()}} sx={{marginY: 2}}>Delete All Students</Button>
        <ConfirmationPopupOLD
            title="Confirm All Student Deletion"
            open={deleteAllConfOpen} onClose={()=>{setDeleteAllConfOpen(false)}}
            onConfirm={()=>{deleteAllStudents()}}
        >
            Are you sure you want to delete ALL students? All visits each student is in will be canceled upon deletion.
        </ConfirmationPopupOLD>
        <AddStudentPopup open={addStudentOpen} onClose={closeAddStudent} onSubmit={addStudent} students={students}/>
        </>
    )
}

export default StudentTable;