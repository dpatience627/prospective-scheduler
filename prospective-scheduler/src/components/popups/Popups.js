import { useState, useMemo, useEffect, useRef, cloneElement, forwardRef, useImperativeHandle} from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import TextField from "@mui/material/TextField";
import CloseIcon from '@mui/icons-material/Close';

export class ChainedPopupBuilder {

    constructor() {
        this.popups = [];
    }

    addPopup(popup) {
        this.popups.push(cloneElement(popup, {key: this.popups.length}))
        return this;
    }

    ToReactComponent() {
        const th = this;
        const ChainedPopup = forwardRef(({popupIdxOpen= -1, setPopupIdxOpen=(idx)=>{}}, ref) => {

            function endPopupChain() {
                setPopupIdxOpen(-1);
            }

            useImperativeHandle(ref, () => ({
                startPopupChain() {
                  setPopupIdxOpen(0);
                },
                endPopupChain
            }));

            function goToNextPopup() {
                if(popupIdxOpen+1 < th.popups.length) {
                    setPopupIdxOpen(popupIdxOpen+1);
                } else {
                    endPopupChain();
                }
            }

            if(popupIdxOpen === -1) {
                return <></>;
            }

            return cloneElement(th.popups[popupIdxOpen], {open: true, onClose: goToNextPopup, endPopupChain: endPopupChain});
        });
        
        return ChainedPopup;
    }

    UseChainedPopup(dependencies) {
        const th = this;
        function UsePopup() {
            const ChainedPopup = useMemo(() => {return th.ToReactComponent()}, dependencies);
            const [popupIdxOpen, setPopupIdxOpen] = useState(-1);
            const [refMethods, setRefMethods] = useState({
                startPopupChain: ()=>{},
                endPopupChain: ()=>{}
            });
            const popupRef = useRef();
            
            const chainedPopupComponent = useMemo(() => {
                return <ChainedPopup popupIdxOpen={popupIdxOpen} setPopupIdxOpen={setPopupIdxOpen} ref={popupRef}/>
            }, [popupIdxOpen]);

            useEffect(() => {
                setRefMethods({
                    startPopupChain: popupRef.current.startPopupChain,
                    endPopupChain: popupRef.current.endPopupChain
                });
            }, []);

            return [chainedPopupComponent, refMethods.startPopupChain, refMethods.endPopupChain, setPopupIdxOpen];
        }

        return UsePopup();
    }

}

export function Popup({open=false, onClose=()=>{}, showClose=true, title="Popup", fullWidth=true, maxWidth='sm', children}) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth={fullWidth} maxWidth={maxWidth}>
            <Grid container spacing = {2} alignItems="center">
                <Grid item xs>
                    <DialogTitle>{title}</DialogTitle>
                </Grid>
                {showClose ?
                    <Grid item xs>
                        <Grid container justifyContent={"flex-end"}>
                            <Button variant="contained" justifyContent="center" color="error" onClick={onClose} sx={{margin: 2, height:1/2}}><CloseIcon/></Button>
                        </Grid>
                    </Grid> : <></>
                }
            </Grid>
            <Stack spacing={2} padding={2}>
                {children}
            </Stack>
        </Dialog>
    )
}

export function AlertPopup({open=false, onClose=()=>{}, title="Popup", alert="", severity="info", fullWidth=true, maxWidth='sm', showOkay=true, children}) {
    return (
        <Popup open={open} onClose={onClose} title={title} fullWidth={fullWidth} maxWidth={maxWidth} showClose={false}>
            <Alert severity={severity}>
                {alert}
            </Alert>
            {children}
            {showOkay ? (
            <Grid container justifyContent={'center'}>
                <Grid item>
                    <Button variant="contained" onClick={onClose}>OK</Button>
                </Grid>
            </Grid>) : <></>
            }
        </Popup>
    )
}

export function ConfirmationPopup({open=false, onClose=()=>{}, onConfirm=()=>{}, onDeny, endPopupChain=()=>{}, title="Popup", confirmation="", fullWidth=true, maxWidth='sm', children}) {
    async function handleConfirm() {
        (await onConfirm())
        onClose();
    }

    function handleDeny() {
        if(onDeny) {
            onDeny();
        } else {
            endPopupChain();
        }
    }
    
    return (
        <Popup open={open} title={title} fullWidth={fullWidth} maxWidth={maxWidth} showClose={false}>
            <Alert severity="warning">
                {confirmation}
            </Alert>
            {children}
            <Grid container justifyContent={'center'}>
                <Grid item xs={2}>
                    <Button variant="contained" onClick={handleConfirm}>Yes</Button>
                </Grid>
                <Grid item xs={2}>
                    <Button variant="contained" onClick={handleDeny}>No</Button>
                </Grid>
            </Grid>
        </Popup>
    )
}

export function LoadingPopup({open=false, startLoad=async()=>{}, onLoaded=(v)=>{}, onClose=()=>{}, title="Popup", fullWidth=true, maxWidth='sm', children}) {
    useEffect(() => {
        if(open) {
            startLoad().then(onLoaded).then((v) => {onClose()});
        }
    }, [open, onLoaded, onClose, startLoad]);
    
    return (
        <AlertPopup open={open} title={title} alert="Loading... this may take a few seconds" fullWidth={fullWidth} maxWidth={maxWidth} showOkay={false} children={children}>
            {children}
            <LinearProgress/>
        </AlertPopup>
    )
}

export function UploadPopup({open=false, onClose=()=>{}, onUpload=(file)=>{}, endPopupChain=()=>{}, title="Popup", accept="application/pdf", fullWidth=true, maxWidth='sm', children}) {
    const [uploadDisabled, setUploadDisabled] = useState(true);

    const onFileSelected = (event) =>{
        onUpload(event.target.files[0]);
        setUploadDisabled(false);
    }

    return (
        <Popup open={open} onClose={endPopupChain} title={title} fullWidth={fullWidth} maxWidth={maxWidth}>
            {children}
            <TextField type="file" onChange={onFileSelected} inputProps={{accept: accept}} />
            <Button variant="contained" component="label" disabled={uploadDisabled} onClick={onClose} varient="contained">
                Upload File
            </Button>
        </Popup>
    )
}

export function UploadPopupStudent({open=false, onClose=()=>{}, onUpload=(file)=>{}, endPopupChain=()=>{}, title="Popup", accept=[".csv", ".xlsx"], fullWidth=true, maxWidth='sm', children}) {
    const [uploadDisabled, setUploadDisabled] = useState(true);

    const onFileSelected = (event) =>{
        onUpload(event.target.files[0]);
        setUploadDisabled(false);
    }

    return (
        <Popup open={open} onClose={endPopupChain} title={title} fullWidth={fullWidth} maxWidth={maxWidth}>
            {children}
            <TextField type="file" onChange={onFileSelected} inputProps={{accept: accept}} />
            <Button variant="contained" component="label" disabled={uploadDisabled} onClick={onClose} varient="contained">
                Upload File
            </Button>
        </Popup>
    )
}