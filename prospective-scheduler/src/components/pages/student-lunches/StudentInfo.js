import React, { useMemo } from "react";
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography'
import ValidatedForm from "components/forms/ValidatedForm";
import { STUDENT_FORM_DEFAULTS, useStudentFormValidator } from "./AddStudentPopup";
import ValidatedTextField from "components/forms/fields/ValidatedTextField";
import APISelectList, {LIST_OF_MAJORS} from "components/APISelectList";

const StudentInfo = ({student=null, onStudentEdited=(form)=>{}, currentStudents=[]}) => {
    const validate = useStudentFormValidator(currentStudents, student);

    const oldStudentInfo = useMemo(() => {
        if(!student) {
            return STUDENT_FORM_DEFAULTS;
        }

        return {
            firstName: student.FirstName,
            middleInitial: student.MiddleInitial,
            lastName: student.LastName,
            email: student.Email,
            majorID: student.PursuingMajor.MajorID
        }
    }, [student])

    if(!student) {
        return <></>
    }

    return (
        <>
            <Typography variant="h4" gutterBottom>{student.FirstName} {student.MiddleInitial} {student.LastName}'s Account</Typography>
            <ValidatedForm onSubmit={onStudentEdited} formDefaults={oldStudentInfo} validate={validate} submitLabel="Save Changes">
                <Stack spacing={3} direction="row" sx={{marginBottom: 4}}>
                    <ValidatedTextField label="First Name" name="firstName" maxLength={40} formItem/>
                    <ValidatedTextField label="Middle Initial" name="middleInitial" maxLength={1} formItem/>
                    <ValidatedTextField label="Last Name" name="lastName" maxLength={40} formItem/>
                </Stack>
                <Stack spacing={3} direction="row" sx={{marginTop: 4, marginBottom: 4}}>
                    <ValidatedTextField label="Student Email" name="email" maxLength={40} formItem/>
                    <APISelectList label="Major" name="majorID" type={LIST_OF_MAJORS} defaultValue={oldStudentInfo.majorID} formItem/>
                </Stack>
            </ValidatedForm>
        </>
    )
}

export default StudentInfo;