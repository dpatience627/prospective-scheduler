import React, {useState} from "react";
import Navigation from 'components/navigation/Navigation';
import VisitTable from "./VisitTable";
import VisitInfo from "./VisitInfo";

import * as API from "api/api.js";
import Grid from '@mui/material/Grid';
import { ConfirmationPopup } from "components/popups/Popups";

const Visits = () => {
    const [visits, editVisit, addVisit, deleteVisit] = API.useVisits([]);
    const [selectedVisit, setSelectedVisit] = useState(null)

    const viewVisit = async (index) => {
        setSelectedVisit(null);
        if(index !== -1) {
            setSelectedVisit(visits[index]);
        }
    }  

    const handleEditVisit = (editedVisit) => {
        editVisit(editedVisit);
        setSelectedVisit(editedVisit);
    }

    const [visitToDelete, setVisitToDelete] = useState(0);
    const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
    const closeDeleteWarning = () => {setDeleteWarningOpen(false);}
    const openDeleteWarning = (visit) => {
        setVisitToDelete(visit);
        setDeleteWarningOpen(true);
    }

    const confirmDeleteVisit = () => {
        deleteVisit(visitToDelete);
    }

    return (
        <Navigation>
            <Grid container spacing={5}>
                <Grid item minWidth={900} maxWidth={900}>
                    <VisitTable visits={visits} onVisitSelected={viewVisit} onAdd={addVisit} onDelete={openDeleteWarning}/>
                </Grid>
                <Grid item minWidth={900} maxWidth={900}>
                    <VisitInfo visit={selectedVisit} onEditVisit={handleEditVisit}/>
                </Grid>
            </Grid>
            <ConfirmationPopup
                title="Confirm Visit Deletion"
                confirmation="Deleting a visit will also cancel all related events. Woud you like to proceeed?"
                open={deleteWarningOpen}
                onConfirm={confirmDeleteVisit} onClose={closeDeleteWarning} onDeny={closeDeleteWarning}
            />
        </Navigation>
    )
}

export default Visits;