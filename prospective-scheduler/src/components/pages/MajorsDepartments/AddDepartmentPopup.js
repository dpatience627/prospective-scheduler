import PopupForm from "components/forms/PopupForm";
import ValidatedTextField from "components/forms/fields/ValidatedTextField";
import Stack from '@mui/material/Stack';
import Validator from "components/forms/Validator";

export const DEPARTMENT_FORM_DEFAULTS = {
    departmentName: "",
    departmentAbbreviation: ""
}

export const validateDepartment = new Validator()
    .require("departmentName").and()
    .require("departmentAbbreviation").and()
    .check("departmentAbbreviation").forLettersOnly("Abbreviation can only contain letters!")
    .compile();

const AddDepartmentPopup = ({open, onClose, onSubmit}) => {
    return (
        <PopupForm 
            title="Add Department"
            open={open} onClose={onClose}
            validate={validateDepartment} onSubmit={onSubmit}
            formDefaults={DEPARTMENT_FORM_DEFAULTS}
        >
            <Stack spacing={3} direction="row">
                <ValidatedTextField name="departmentName" label="Department Name" maxLength={40} formItem/>
                <ValidatedTextField name="departmentAbbreviation" label="Department Abbreviation" maxLength={4} formItem/>
            </Stack>
        </PopupForm>
    )
}

export default AddDepartmentPopup;