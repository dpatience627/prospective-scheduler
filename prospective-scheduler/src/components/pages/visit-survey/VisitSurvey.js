import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import * as API from 'api/api';


const Survey = ({survey, wasNoShow=(response)=>{}}) => {
    const visit = survey.ForVisit;
    const studentName = `${visit.StudentFirstName} ${visit.StudentLastName}`;
    return (<>
        <Typography variant="h3" gutterBottom textAlign="center">
            Prospective Student Visit Survey
        </Typography>
        <Grid container direction="row" justifyContent="center" spacing={2}>
            <Grid item xs={12} textAlign="center">
                <Typography variant="h6" gutterBottom>
                    Did {studentName} show up to the event you participated in?
                </Typography>
            </Grid>
        </Grid>
        <Grid container direction="row" justifyContent="center" spacing={10}>
            <Grid item xs={2}>
                <Button variant="contained" color="success" fullWidth onClick={() => {wasNoShow(false);}}>Yes</Button>
            </Grid>
            <Grid item xs={2}>
                <Button variant="contained" color="error" fullWidth onClick={() => {wasNoShow(true);}}>No</Button>
            </Grid>
        </Grid>
    </>)
}

const VisitSurvey = () => {
    const { surveyID } = useParams();
    const [survey, setSurvey] = useState(null);
    const [responded, setResponded] = useState(false);

    useEffect(() => {
        API.getNoShowSurvey(surveyID).then((survey) => setSurvey(survey));
    }, [surveyID]);

    if(!survey) {
        return <>Loading...</>
    }

    if(survey && !responded) {
        const wasNoShow = (response) => {
            API.respondToNoShowSurvey(surveyID, response).then(() => {
                setResponded(true);
            })
        }
        return <Survey survey={survey} wasNoShow={wasNoShow}/>
    }

    return (<>
        <Typography textAlign="center" variant="h3">Thank you for your response!</Typography>
        <Typography textAlign="center" variant="subtitle1">If you incorrectly logged your response, you may change it at any time. Otherwise, you may close this tab.</Typography>
        <Grid container justifyContent="center">  
            <Grid item>
                <Button variant="contained" onClick={()=>{setResponded(false);}}>Change Response</Button>
            </Grid>
        </Grid>
    </>)
}

export default VisitSurvey;