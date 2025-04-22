import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

const ConfirmationPopup = ({children, open=false, onClose=()=>{}, onConfirm=()=>{}, title="Warning", confirmText="Yes", denyText="No"}) => {
    const handleConfirm = () => {
        onClose();
        onConfirm();
    }
    
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
            <DialogTitle>{title}</DialogTitle>
            <Stack spacing={2} padding={2}>
                <Alert severity="warning">{children}</Alert>
                <Grid container justifyContent={'center'}>
                    <Grid item m={2}>
                        <Button variant="contained" onClick={handleConfirm}>{confirmText}</Button>
                    </Grid>
                    <Grid item m={2}>
                        <Button variant="contained" onClick={onClose}>{denyText}</Button>
                    </Grid>
                </Grid>
            </Stack>
        </Dialog>
    )
}

export default ConfirmationPopup;