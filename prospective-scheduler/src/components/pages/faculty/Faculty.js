import React from 'react';
import Navigation from 'components/navigation/Navigation';
import FacultyTable from 'components/pages/faculty/FacultyTable';
import { AlertPopup, ChainedPopupBuilder, LoadingPopup, UploadPopup } from 'components/popups/Popups';
import * as API from 'api/api';
import { useState } from 'react';
import Button from '@mui/material/Button';
import { Typography } from '@mui/material';
import Table from 'components/table/Table';
import TableRow from 'components/table/TableRow';
import TableCell from 'components/table/TableCell';

const InvalidEmailTable = ({faculty=[]}) => {
    const columns = [
        {name: "Faculty", width: 75},
        {name: "Email", width: 25}
    ]
    
    const renderFaculty = (faculty, index) => {
        return (
            <TableRow key={`${index}`}>
                <TableCell>{faculty.Title} {faculty.FirstName} {faculty.MiddleInitial} {faculty.LastName}</TableCell>
                <TableCell>{faculty.Email}</TableCell>
            </TableRow>
        )
    }

    return (<>
        <Typography>The following faculty members' emails could not be correctly inferred and must be corrected manually.</Typography>
        <Table
            title="Faculty With Invalid Emails"
            columns={columns} rows={faculty}
            paginated renderRow={renderFaculty}
        />
    </>)
}

const Faculty = () => {
    const [facultyPdf, setFacultyPdf] = useState(null);
    const [uploadResponse, setUploadResponse] = useState(false);
    const uploadFaculty = async () => {
        setUploadResponse(await API.facultyFileUpload(facultyPdf));
        
    }

    const [faculty, edit, remove, add, loading] = API.useFaculty([uploadResponse]);

    const [uploadPopup, startUpload] = 
        new ChainedPopupBuilder().addPopup(
            <UploadPopup
                title="Upload Faculty from PDF"
                onUpload={setFacultyPdf}
            />
        ).addPopup(
            <LoadingPopup
                title="Uploading Faculty from PDF"
                startLoad={uploadFaculty}
            />
        ).addPopup(
            <AlertPopup
                title={!uploadResponse.error ? "Upload Successful" : "Upload Unsuccessful"}
                alert={!uploadResponse.error ? "The faculty upload was successful!" : "The faculty upload was not successful. The file you uploaded may be incorrectly formatted or there are no new faculty members found."}
                severity={!uploadResponse.error ? "success" : "error" }
            >
                {!uploadResponse.error && uploadResponse.length > 0 ? <InvalidEmailTable faculty={uploadResponse}/> : <></>}
            </AlertPopup>
        ).UseChainedPopup([facultyPdf, uploadResponse]);

    return (
        <Navigation includeAdminSidebar>
            <FacultyTable
                faculty={faculty}
                loading={loading}
                addFaculty={add}
                editFaculty={edit}
                deleteFaculty={remove}
            />
            <Button sx={{mt: 4}} variant="contained" onClick={startUpload}>Upload Faculty</Button>
            {uploadPopup}
        </Navigation>
    )
}


export default Faculty;