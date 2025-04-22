import React, {useState} from "react";
import * as API from "api/api.js";
import Button from '@mui/material/Button';
import AddUserPopup from 'components/pages/users/AddUserPopup';
import ConfirmationPopup from "components/confirmations/ConfirmationPopup";
import Table from 'components/table/Table';
import TableRow from 'components/table/TableRow';
import TableCell from 'components/table/TableCell';
import { useMsal } from "@azure/msal-react";

const isUserLoggedIn = (userID, users, loggedInUserEmail) => {
    for(const user of users) {
        if(user.UserID === userID) {
            return user.Email === loggedInUserEmail;
        }
    }
}

const isUserServiceAccount = (userID) => {
    return userID === 1;
}

const columns = [
    {name: "Name", width: 40},
    {name: "User Type", width: 30},
    {name: "Delete User", width: 30}
]

const UserTable = ({users=[], onUserSelected = (index) => {}, onUserDelete = (index) => {}, onUserAdd = (user) => {}}) => {
    const { accounts } = useMsal();
    const [addUserOpen, setAddUserOpen] = useState(false);

    const openAddUser = () => {
        setAddUserOpen(true);
    }

    const closeAddUser = () => {
        setAddUserOpen(false);
    }

    const includeInSearch = (user, search) => {
        const hideUser = isUserLoggedIn(user.UserID, users, accounts[0].username) || isUserServiceAccount(user.UserID);
        const inSearch = `${user.FirstName} ${user.MiddleInitial} ${user.LastName} ${user.UserPriveleges}`.toLowerCase().includes(search.toLowerCase());
        return inSearch & !hideUser;
    };

    const addUser = async (form) => {
        API.addUser(form.email, form.userPriveleges, form.firstName, form.lastName, form.middleInitial)
           .then(onUserAdd);
    }

    const [deleteConfOpen, setDeleteConfOpen] = useState(false);
    const [userIdToDelete, setUserIdToDelete] = useState(-1);
    const [userIndexToDelete, setUserIndexToDelete] = useState(-1);
    const handleDeleteUser = (id, index) => {
        setUserIdToDelete(id);
        setUserIndexToDelete(index);
        setDeleteConfOpen(true);
    }

    const renderUser = (user, index) => {
        return (
            <TableRow key={`${index}`}>
                <TableCell>{user.FirstName} {user.MiddleInitial} {user.LastName}</TableCell>
                <TableCell>{user.UserPriveleges}</TableCell>
                <TableCell><Button variant="contained" color="error" onClick={() => {handleDeleteUser(user.UserID, index)}}>Delete</Button></TableCell>
            </TableRow>
        )
    }

    return (
        <>
        <Table
            title="Other System Users"
            alertWhenSearchFails="No users match your search. Try searching by name or user type!"
            alertWhenEmpty="No other users are in the system. Try adding one with the button above!"
            columns={columns} rows={users} renderRow={renderUser}
            searchable includeInSearch={includeInSearch}
            onRowSelected={onUserSelected} onAddClicked={openAddUser}
            paginated
        />
        <AddUserPopup open={addUserOpen} onClose={closeAddUser} onSubmit={addUser} currentUsers={users}/>
        <ConfirmationPopup
            title="Confirm User Deletion"
            open={deleteConfOpen} onClose={()=>{setDeleteConfOpen(false)}}
            onConfirm={()=>{onUserDelete(userIdToDelete, userIndexToDelete)}}
        >
            Are you sure you want to delete this user?
        </ConfirmationPopup>
        </>
    )
}

export default UserTable;