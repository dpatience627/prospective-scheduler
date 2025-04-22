import { useRef } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import Button from '@mui/material/Button';
import ValidatedForm from "./ValidatedForm";
import { Grid } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

const PopupForm = ({children, open, onClose=()=>{}, onSubmit=()=>{}, validate=(form)=>{return {}}, formDefaults={}, title="Form Title"}) => {
    const formRef = useRef();

    const handleClose = () => {
        onClose();
        formRef.current.reset();
    }

    const handleSubmit = (form) => {
        onSubmit(form);
        handleClose();
    }

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">   
            <Grid container spacing = {2} alignItems="center">
                <Grid item xs>
                    <DialogTitle justifyContent="center" >{title}</DialogTitle>
                </Grid>
                <Grid item xs>
                    <Grid container justifyContent={"flex-end"}>
                        <Button variant="contained" justifyContent="center" color="error" onClick={() => {handleClose()}} sx={{margin: 2, height:1/2}}><CloseIcon/></Button>
                    </Grid>
                </Grid>
            </Grid>
            <Box display="flex" justifyContent="center" alignItems="center">
                <ValidatedForm ref={formRef} onSubmit={handleSubmit} validate={validate} formDefaults={formDefaults} revalidateDeps={[open]}>
                    {children}
                </ValidatedForm>
            </Box>
        </Dialog>
    )
}

export default PopupForm;