import { useEffect, useMemo, useState } from 'react';
import Stack from '@mui/material/Stack';
import PopupForm from "components/forms/PopupForm";
import ValidatedTextField from "components/forms/fields/ValidatedTextField";
import Validator from "components/forms/Validator";
import APISelectList, { LIST_OF_USER_ROLES } from "components/APISelectList";
import * as API from "api/api";

export const USER_FORM_DEFAULTS = {
    firstName: "",
    middleInitial: "",
    lastName: "",
    email: "",
    userPriveleges: 0
}

export const useUserValidationFunction = (currentUsers) => {
    return useUserEditValidationFunction(currentUsers, null);
};

export const useUserEditValidationFunction = (currentUsers, excludeUser) => {
    const [gccEmails, setGccEmails] = useState([]);
    useEffect(() => {
        API.getGccEmails().then(setGccEmails);
    }, []);
    
    return useMemo(() => {
        const validateUniqueEmail = (email) => {
            for(const user of currentUsers) {
                if(!!excludeUser && excludeUser.Email.toLowerCase() === user.Email.toLowerCase()) {continue;}
                if(user.Email.toLowerCase() === email.toLowerCase()) {return false;}
            }
            return true;
        };

        const validateGccEmail = (email) => {
            for(const gccEmail of gccEmails) {
                if(email.toLowerCase() === gccEmail.toLowerCase()) {return true;}
            }
            return false;
        }

        return new Validator()
        .check("email").forValidGCCEmail("Email must be a valid GCC email!")
        .and().check("email").forCustom(validateUniqueEmail, "A user already has this email!")
        .and().check("email").forCustom(validateGccEmail, "No such GCC email exists!")
        .and().require("firstName").check("firstName").forName()
        .and().require("lastName").check("lastName").forName()
        .compile();
    }, [currentUsers, excludeUser, gccEmails]);
};

const AddUserPopup = ({open, onClose, onSubmit, currentUsers}) => {

    const validate = useUserValidationFunction(currentUsers);

    return (
        <PopupForm
            title="Add System User" open={open}
            onClose={onClose} onSubmit={onSubmit} validate={validate}
            formDefaults={USER_FORM_DEFAULTS}
        >
            <Stack spacing={3} direction="row" sx={{marginBottom: 4}}>
                <ValidatedTextField label="First Name" name="firstName" maxLength={40} formItem/>
                <ValidatedTextField label="Middle Initial" name="middleInitial" maxLength={1} formItem/>
                <ValidatedTextField label="Last Name" name="lastName" maxLength={40} formItem/>
            </Stack>
            
            <Stack spacing={3} direction="row" sx={{marginBottom: 4}}>
                <ValidatedTextField label="User Email" name="email" maxLength={40} formItem/>
                <APISelectList label="User Type" name="userPriveleges" type={LIST_OF_USER_ROLES} defaultValue={0} formItem/>
            </Stack>
        </PopupForm>
    )
}

export default AddUserPopup;