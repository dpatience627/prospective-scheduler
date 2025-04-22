import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { DEPARTMENT_FORM_DEFAULTS, validateDepartment } from './AddDepartmentPopup';
import ValidatedForm from 'components/forms/ValidatedForm';
import ValidatedTextField from 'components/forms/fields/ValidatedTextField';
import MajorsTable from './MajorsTable';

const DepartmentInfo = ({department, onDeptEdited, onFileUploaded}) => {
    const oldDeptInfo = useMemo(() => {
        if(!department) {
            return DEPARTMENT_FORM_DEFAULTS;
        }

        return {
            departmentName: department.DepartmentName,
            departmentAbbreviation: department.DepartmentAbbrev
        };
    }, [department]);
    
    if(!department) {
        return <></>
    }

    return (
        <>
       
        <Stack spacing={4} marginBottom={6}>
            <Typography variant="h4" gutterBottom>{department.DepartmentName} Department</Typography>
            <ValidatedForm
                formDefaults={oldDeptInfo}
                validate={validateDepartment}
                onSubmit={onDeptEdited} submitLabel="Save Changes"
            >
                <Stack spacing={3}>
                    <ValidatedTextField maxLength={127} name="departmentName" label="Department Name" formItem/>
                    <ValidatedTextField maxLength={4} name="departmentAbbreviation" label="Department Abbreviation" formItem/>
                </Stack>
            </ValidatedForm>
        </Stack>
        <MajorsTable department={department} fileUploadUpdate={onFileUploaded} />
     </>
    )
 }

 export default DepartmentInfo;