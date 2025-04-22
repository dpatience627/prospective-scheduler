import React, { useState } from "react";
import * as API from "api/api.js";
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { Popup, AlertPopup } from "components/popups/Popups";
import { TextField } from "@mui/material";

const StudentFileUpload = ({onSubmit, open, close}) => {
    const [file, setFile] = useState(null);

    const [uploadInfoOpen, setUploadInfoOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadDisabled, setUploadDisabled] = useState(true);

    
    const handleChange = (event) =>{
        console.log("changing file");
      setFile(event.target.files[0]);
      setUploadDisabled(false);
    }

    function handleSubmit(event) {
        event.preventDefault()
        API.studentFileUpload(file).then((response) => {
            setUploadSuccess(response.success ? true : false);
            console.log(response.success);
            setUploadInfoOpen(true);
        });
        console.log(uploadSuccess);
        onSubmit();
    }
  
    let disableUpload = true;
    if(file) {
        disableUpload = false;
    }

    const closePopup = () =>{
        setUploadInfoOpen(false)
        setUploadDisabled(true);
        close();
    }

    return (
    <Popup title="Upload CSV for Students" open={open} onClose={closePopup} onSubmit={handleSubmit}>
        <TextField type="file" onChange={handleChange} inputProps={{accept:[".csv", ".xlsx"]}} />
        <Button variant="contained" component="label" disabled={uploadDisabled} onClick={handleSubmit}varient="contained">
            Upload File
        </ Button>
        <Dialog open={uploadInfoOpen} onClose={closePopup} fullWidth maxWidth='sm'>
                <DialogTitle>Student Upload Complete</DialogTitle>
            <AlertPopup
                title="Student Upload Complete"
                alert={uploadSuccess ? "The student upload was successful!" : "The student upload was not successful. The file you uploaded may be incorrectly formatted."}
                severity={uploadInfoSeverity(uploadSuccess)}>{uploadInfoPrompt(uploadSuccess)}
            </AlertPopup>
        </Dialog>
    </Popup>
    );
};

const uploadInfoPrompt = (uploadSuccess) => {
    return uploadSuccess ? 
        "The student upload was successful!" :
        "The student upload was not successful. The file you uploaded may be incorrectly formatted.";
}

const uploadInfoSeverity = (uploadSuccess) => {
    return uploadSuccess ? "info" : "error";
}

export default StudentFileUpload;