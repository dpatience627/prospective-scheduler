import Navigation from 'components/navigation/Navigation';
import * as API from 'api/api';
import ClassesTable from './ClassesTable';
import Grid from '@mui/material/Grid';
import { AlertPopup, ChainedPopupBuilder, ConfirmationPopup, LoadingPopup } from 'components/popups/Popups';
import { useEffect, useState } from 'react';

const Classses = () => {
    const [refreshPopup, startRefresh, endRefresh, setRefreshPopupIdxOpen] = 
        new ChainedPopupBuilder().addPopup(
            <ConfirmationPopup
                title="Confirm Class List Refresh"
                confirmation="Refreshing the classes in Prospective Scheduler from MyGCC will archive the current classes.
                                The archived classes will no longer be available to add to prospective student visits. Would you like to proceed?"
            />
        ).addPopup(
            <LoadingPopup title="Refreshing Class List from MyGCC..." startLoad={API.refreshClassesFromMyGCC}/>
        ).addPopup(
            <AlertPopup title="Class List Retrieved" severity="success" alert="Course list successfully refreshed!"/>
        ).UseChainedPopup([]);

    const [classes, edit, remove, loading] = API.useClasses([refreshPopup]);

    return (
        <Navigation includeAdminSidebar>
            <Grid item minWidth={500}>
                <ClassesTable classes={classes} loading={loading} onClassEdit={edit} onRefresh={startRefresh}/>
            </Grid>
            {refreshPopup}
        </Navigation>
    )
}

export default Classses;