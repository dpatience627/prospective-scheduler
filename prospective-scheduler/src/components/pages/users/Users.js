import React, {useEffect, useState} from "react";
import Navigation from 'components/navigation/Navigation';
import UserTable from "./UserTable";
import UserInfo from "./UserInfo";

import * as API from "api/api.js";
import Grid from '@mui/material/Grid';

const Users = () => {
    const [selectedUserIdx, setSelectedUserIdx] = useState(-1);
    const [users, edit, remove, add] = API.useUsers([])

    const viewUser = async (index) => {
        setSelectedUserIdx(index);
    };

    const selectedUser = selectedUserIdx === -1 ? null : users[selectedUserIdx];

    const handleDelete = (id, index) => {
        API.deleteUser(id).then(() => {
            remove(index);
        });
    }

    return (
        <Navigation includeAdminSidebar>
            <Grid container spacing={5}>
                <Grid item minWidth={800} maxWidth={800}>
                    <UserTable users={users} onUserSelected={viewUser} onUserDelete={handleDelete} onUserAdd={add}/>
                </Grid>
                <Grid item minWidth={800} maxWidth={800}>
                    <UserInfo user={selectedUser} users={users} onUserEdited={edit}/>
                </Grid>
            </Grid>
        </Navigation>
    );
}
 
export default Users;