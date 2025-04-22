import React from 'react';
import ReactDOM from 'react-dom/client';
import Visits from 'components/pages/visits/Visits';
import Users from 'components/pages/users/Users';
import MajorsDepartments from 'components/pages/MajorsDepartments/MajorsDepartments';
import Statistics from 'components/pages/statistics/Statistics';
import Classses from 'components/pages/classes/Classes';
import StudentLunch from './components/pages/student-lunches/StudentLunch';
import Faculty from './components/pages/faculty/Faculty';
import VisitSurvey from 'components/pages/visit-survey/VisitSurvey';
import { GuardedPage } from './components/authentication/GuardedElements';
import {Routes, Route, BrowserRouter} from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { MsalAuthenticationTemplate, MsalProvider } from "@azure/msal-react";
import { PublicClientApplication, InteractionType } from "@azure/msal-browser";

//Force window refresh because of api token stuff being weird
window.setInterval(() =>{ // Set interval for checking
    window.location.reload();
}, 45*60*1000); // Repeat every 45 minutes

const msalConfiguration = {
  auth: {
      clientId: "d935431d-2930-40af-a7c5-50dda0002850",
      authority: "https://login.microsoftonline.com/83918960-2218-4cd3-81fe-302a8e771da9",
      redirectUri: "/",
      postLogoutRedirectUri: "/"
  }
};

export const pca = await PublicClientApplication.createPublicClientApplication(msalConfiguration);

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<GuardedPage><Visits/></GuardedPage>}/>
                <Route path="/Users" element={<GuardedPage requiredPriveleges><Users/></GuardedPage>}/>
                <Route path="/Statistics" element={<GuardedPage requiredPriveleges><Statistics/></GuardedPage>}/>
                <Route path="/ClassVisit" element={<GuardedPage><Classses/></GuardedPage>}/>
                <Route path="/StudentLunch" element={<GuardedPage requiredPriveleges><StudentLunch/></GuardedPage>}/>
                <Route path="/FacultyData" element={<GuardedPage requiredPriveleges><Faculty/></GuardedPage>}/>
                <Route path="/MajorsDepartments" element={<GuardedPage requiredPriveleges><MajorsDepartments/></GuardedPage>}/>
                <Route path="/visitsurvey/:surveyID" element={<VisitSurvey/>}/>
            </Routes>
        </BrowserRouter>
    )
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <MsalProvider instance={pca}>
        <MsalAuthenticationTemplate interactionType={InteractionType.Redirect}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <App/>
            </LocalizationProvider>
        </MsalAuthenticationTemplate>
    </MsalProvider>
);
