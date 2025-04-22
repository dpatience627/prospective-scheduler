import React, {useMemo} from "react";
import Stack from '@mui/material/Stack';
import PopupForm from "components/forms/PopupForm";
import ValidatedTextField from "components/forms/fields/ValidatedTextField";
import Validator from "components/forms/Validator";

const validateMajorForm = new Validator().require("majorName").compile()

const AddMajorPopup = ({open, onClose, onSubmit, department}) =>{
    const formDefaults = useMemo(() => {
        return {
            majorName: "",
            majorDeptID: department.DepartmentID
        }
    }, [department]);

    return (
        <PopupForm
            title={`Add Major to ${department.DepartmentName} Department`}
            open={open} onClose={onClose} onSubmit={onSubmit}
            formDefaults={formDefaults} validate={validateMajorForm}
        >
            <Stack spacing={3} direction="row">
                <ValidatedTextField name="majorName" label="Major Name" maxLength={40} formItem/>
            </Stack>
        </PopupForm>
    )
}

export default AddMajorPopup