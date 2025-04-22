import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const LoadingPopup = ({open=false, title="Loading"}) => {
    return (
        <Dialog open={open} fullWidth maxWidth='sm'>
            <DialogTitle>{title}</DialogTitle>
            <Stack spacing={2} padding={2}>
                <Typography>This may take a few seconds...</Typography>
                <LinearProgress/>
            </Stack>
        </Dialog>
    )
}

export default LoadingPopup;