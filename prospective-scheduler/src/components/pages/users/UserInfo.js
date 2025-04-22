import React, { useMemo } from "react";
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography'
import ValidatedForm from "components/forms/ValidatedForm";
import * as API from "api/api";
import { USER_FORM_DEFAULTS, useUserEditValidationFunction } from "./AddUserPopup";
import ValidatedTextField from "components/forms/fields/ValidatedTextField";
import APISelectList, {LIST_OF_USER_ROLES} from "components/APISelectList";

const UserInfo = ({user=null, onUserEdited=(index, user)=>{}, users=[]}) => {
    const oldUserInfo = useMemo(() => {
        if(!user) {
            return USER_FORM_DEFAULTS;
        }

        return {
            email: user.Email,
            firstName: user.FirstName,
            middleInitial: user.MiddleInitial,
            lastName: user.LastName,
            userPriveleges: API.userRoleToId(user.UserPriveleges)
        }
    }, [user])

    const validate = useUserEditValidationFunction(users, user);

    if(!user) {
        return <></>
    }

    const editUser = (form) => {
        API.editUser(user.UserID, form.email, form.userPriveleges, form.firstName, form.lastName, form.middleInitial)
           .then((user) => {
                const index = users.findIndex((u) => {return u.UserID === user.UserID;})
                onUserEdited(index, user);
            }
        );
    }

    return (
        <>
            <Typography variant="h4" gutterBottom>{user.FirstName} {user.MiddleInitial} {user.LastName}'s Account</Typography>
            <ValidatedForm onSubmit={editUser} validate={validate} formDefaults={oldUserInfo} submitLabel="Save Changes">
                <Stack spacing={3} direction="row" sx={{marginBottom: 4}}>
                    <ValidatedTextField label="First Name" name="firstName" maxLength={40} formItem/>
                    <ValidatedTextField label="Middle Initial" name="middleInitial" maxLength={1} formItem/>
                    <ValidatedTextField label="Last Name" name="lastName" maxLength={40} formItem/>
                </Stack>
                <Stack spacing={3} direction="row" sx={{marginTop: 4, marginBottom: 4}}>
                    <ValidatedTextField label="User Email" name="email" maxLength={40} formItem/>
                    <APISelectList label="User Type" name="userPriveleges" type={LIST_OF_USER_ROLES} defaultValue={oldUserInfo.userPriveleges} formItem/>
                </Stack>
            </ValidatedForm>
        </>
    )
}

export default UserInfo;