import React, {useState} from 'react';
import Navigation from 'components/navigation/Navigation';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import DepartmentsTable from './DepartmentsTable';
import DepartmentInfo from './DepartmentInfo';
import * as API from 'api/api';
import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import { AlertPopup, ChainedPopupBuilder, LoadingPopup, UploadPopupStudent } from 'components/popups/Popups';
import ExampleCSV from 'components/pages/MajorsDepartments/example_majors_csv.csv'

const MajorsDepartments = () => {
    const [fileUploaded, setFileUploaded] = useState(false);
    const [departments, editDept, deleteDept, addDept] = API.useDepartments([fileUploaded]);
    const [selectedDepartmentIndex, setSelectedDepartment] = useState(-1);
    const selectedDepartment = (selectedDepartmentIndex === -1) ? null : departments[selectedDepartmentIndex];
    
    const onDeptEdited = (deptForm) => {
        editDept(selectedDepartment.DepartmentID, deptForm);
    }
   
    const [majorCSV, setMajorCSV] = useState(null);
    const [uploadResponse, setUploadResponse] = useState(false);
    const uploadMajors = async () => {
        const response = await API.majorsFileUpload(majorCSV);
        setUploadResponse(response);
        setFileUploaded(!fileUploaded);
    }

    const [uploadPopup, startUpload] = 
        new ChainedPopupBuilder().addPopup(
            <UploadPopupStudent
                title="Upload Majors from CSV"
                onUpload={setMajorCSV}
            >
                <Alert severity='info'>
                    Each line of the CSV should contain the name of the department for the major, followed by the name of the major.
                    An example CSV file in the correct format can be found <a href={ExampleCSV}>here</a>.
                </Alert>
            </UploadPopupStudent>
        ).addPopup(
            <LoadingPopup
                title="Uploading Majors from CSV"
                startLoad={uploadMajors}
            />
        ).addPopup(
            <AlertPopup
                title={!!uploadResponse.success ? "Upload Successful" : "Upload Unsuccessful"}
                alert={!!uploadResponse.success ? `The majors upload was successful! ${uploadResponse.success}` : `The majors upload was not successful. ${uploadResponse.error}`}
                severity={!!uploadResponse.success ? "success" : "error" }
            />
        ).UseChainedPopup([majorCSV, uploadResponse]);

    return (
        <>
        <Navigation includeAdminSidebar>
            
            <Grid container spacing={5}>
                <Grid item minWidth={800} maxWidth={800}>
                    <DepartmentsTable
                        departments={departments}
                        deleteDept={deleteDept} addDept={addDept}
                        onDepartmentSelected={setSelectedDepartment}
                    />
                     <Button variant='contained' sx={{mt: 4}} onClick={startUpload}>Upload Majors</Button>
                </Grid>
                <Grid item minWidth={800} maxWidth={800}>
                    <DepartmentInfo department={selectedDepartment} onDeptEdited={onDeptEdited} onFileUploaded={fileUploaded}/>
                </Grid>
            </Grid>
           
        </Navigation>
        {uploadPopup}
        </>
    )
}

export default MajorsDepartments;