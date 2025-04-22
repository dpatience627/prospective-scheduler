import React, { useEffect, useMemo, useState } from "react";
import Stack from '@mui/material/Stack';
import Validator from "components/forms/Validator";
import PopupForm from "components/forms/PopupForm";
import APISelectList, { LIST_OF_MAJORS } from "components/APISelectList";
import ValidatedTextField from "components/forms/fields/ValidatedTextField";
import * as API from "api/api";

export const STUDENT_FORM_DEFAULTS = {
    email: "",
    firstName: "",
    middleInitial: "",
    lastName: "",
    pursuingMajorID: 1
}

export function useStudentFormValidator(students=[], selectedStudent=null) {
    const [studentEmails, setStudentEmails] = useState([]);
    useEffect(() => {
        API.getStudentEmails().then(setStudentEmails);
    }, []);

    const validate = useMemo(() => {
        const validateUniqueStudentEmail = (email) => {
            for(const student of students) {
                if(!!selectedStudent && email.toLowerCase() === selectedStudent.Email.toLowerCase()) {continue;}
                if(email.toLowerCase() === student.Email.toLowerCase()) {return false;}
            }
            return true;
        }

        const validateStudentEmail = (email) => {
            for(const studentEmail of studentEmails) {
                if(email.toLowerCase() === studentEmail.toLowerCase()) {return true;}
            }
            return false;
        }

        return new Validator()
            .require("firstName").and().check("firstName").forName()
            .and().require("lastName").and().check("lastName").forName()
            .and().require("email").and().check("email").forValidGCCEmail("Must be a valid GCC email!")
            .and().check("email").forCustom(validateUniqueStudentEmail, "A student already has this email!")
            .and().check("email").forCustom(validateStudentEmail, "No GCC student has this email!")
            .compile()
    }, [studentEmails, students, selectedStudent]);
    
    return validate;
}

const AddStudentPopup = ({open, onClose, onSubmit, students=[]}) => {
    const validate = useStudentFormValidator(students, null);

    return (
        <PopupForm
            title="Add Student Lunch User" open={open}
            onClose={onClose} onSubmit={onSubmit} validate={validate}
            formDefaults={STUDENT_FORM_DEFAULTS}
        >
            <Stack spacing={3} direction="row" sx={{marginBottom: 4}}>
                <ValidatedTextField label="First Name" name="firstName" maxLength={40} formItem/>
                <ValidatedTextField label="Middle Initial" name="middleInitial" maxLength={1} formItem/>
                <ValidatedTextField label="Last Name" name="lastName" maxLength={40} formItem/>
            </Stack>

            <Stack spacing={3} direction="row" sx={{marginBottom: 4}}>
                <ValidatedTextField label="Student Email" name="email" maxLength={40} formItem/>
                <APISelectList name="pursuingMajorID" label="Major" type={LIST_OF_MAJORS} defaultValue={1} formItem/>
            </Stack>
        </PopupForm>
    )
}

export default AddStudentPopup;