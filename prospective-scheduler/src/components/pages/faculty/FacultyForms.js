import React, {useEffect, useMemo, useState} from "react";
import Stack from '@mui/material/Stack';
import PopupForm from "components/forms/PopupForm";
import ValidatedCheckBox from "components/forms/fields/ValidatedCheckBox";
import ValidatedTextField from "components/forms/fields/ValidatedTextField";
import Validator from "components/forms/Validator";
import APISelectList, { LIST_OF_DEPARTMENTS } from "components/APISelectList";
import * as API from "api/api";

const useFacultyEditValidationFunction = (currentFaculty, excludeFaculty, facultyEmails) => {
    return useMemo(() => {
        const validateUniqueEmail = (email) => {
            for(const fac of currentFaculty) {
                if(!!excludeFaculty && excludeFaculty.Email.toLowerCase() === fac.Email.toLowerCase()) {continue;}
                if(fac.Email.toLowerCase() === email.toLowerCase()) {return false;}
            }
            return true;
        };

        const validateFacultyEmail = (email) => {
            for(const facultyEmail of facultyEmails) {
                if(email.toLowerCase() === facultyEmail.toLowerCase()) {return true;}
            }
            return false;
        }

        return new Validator()
        .check("Email").forValidGCCEmail("Email must be a valid GCC email!")
        .and().check("Email").forCustom(validateUniqueEmail, "A faculty member already has this email!")
        .and().check("Email").forCustom(validateFacultyEmail, "No GCC faculty member has this email!")
        .and().require("FirstName").check("FirstName").forName()
        .and().require("LastName").check("LastName").forName()
        .and().require("Title")
        .and().require("OfficeBuilding")
        .and().require("OfficeNumber")
        .compile();
    }, [currentFaculty, excludeFaculty, facultyEmails]);
};

const FACULTY_FORM_DEFAULTS = {
    Title: "",
    FirstName: "",
    LastName: "",
    MiddleInitial: "",
    Email: "",
    OfficeBuilding: "",
    OfficeNumber: "",
    AllowInVisits: false,
    Archived: false,
    EmailValid: false,
    BelongsToDeptID: 1
}

const FacultyForm = ({open, title, onClose, onSubmit, validate, formDefaults}) => {
    return (
        <PopupForm
            title={title} open={open}
            onClose={onClose} onSubmit={onSubmit} validate={validate}
            formDefaults={formDefaults}
        >
            <Stack spacing={3} direction="row" sx={{marginBottom: 4}}>
                <ValidatedTextField label="Title" name="Title" maxLength={3} formItem/>
                <ValidatedTextField label="First Name"  name="FirstName" maxLength={63} formItem/>
                <ValidatedTextField label="Middle Initial" name="MiddleInitial" maxLength={1} formItem/>
                <ValidatedTextField label="Last Name" name="LastName" maxLength={63} formItem/>
            </Stack>
            <Stack spacing={3} direction="row" sx={{marginBottom: 4}}>
                <ValidatedTextField label="Email" name="Email" maxLength={63} formItem/>
                <ValidatedTextField label="Office Building" name="OfficeBuilding" maxLength={8} formItem/>
                <ValidatedTextField label="Office Number" name="OfficeNumber" maxLength={8} formItem/>
                <ValidatedCheckBox label="Allow In Visits?" name="AllowInVisits" defaultValue={formDefaults.AllowInVisits} formItem/>
            </Stack>
            <Stack direction="row" sx={{marginBottom: 4, width: 200}}>
                <APISelectList label="Department" name="BelongsToDeptID" type={LIST_OF_DEPARTMENTS} defaultValue={formDefaults.BelongsToDeptID} formItem fullWidth/>
            </Stack>
        </PopupForm>
    )
}

export const FacultyPopup = ({open, onClose, onSubmit, currentFaculty, title="", selectedFaculty=null}) =>{
    const [facultyEmails, setFacultyEmails] = useState(null);
    useEffect(() => {
        API.getFacultyEmails().then((emails) => {
            setFacultyEmails(emails)
        });
    }, []);

    const validate = useFacultyEditValidationFunction(currentFaculty, selectedFaculty, facultyEmails);

    const formDefaults = useMemo(() => {
        return !selectedFaculty ? FACULTY_FORM_DEFAULTS : {
            Title: selectedFaculty.Title,
            FirstName: selectedFaculty.FirstName,
            LastName: selectedFaculty.LastName,
            MiddleInitial: selectedFaculty.MiddleInitial,
            Email: selectedFaculty.Email,
            OfficeBuilding: selectedFaculty.OfficeBuilding,
            OfficeNumber: selectedFaculty.OfficeNumber,
            AllowInVisits: selectedFaculty.AllowInVisits,
            Archived: selectedFaculty.Archived,
            EmailValid: selectedFaculty.EmailValid,
            BelongsToDeptID: selectedFaculty.BelongsToDept.DepartmentID
        };
    }, [selectedFaculty]);

    return <FacultyForm title={title} open={open} onClose={onClose} onSubmit={onSubmit} validate={validate} formDefaults={formDefaults}/>
}