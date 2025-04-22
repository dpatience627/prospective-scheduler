import React from 'react';
import {Link} from 'react-router-dom';
import LoginLogoutButton from 'components/navigation/LoginLogoutButton'

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { GuardedElement } from 'components/authentication/GuardedElements';

import AccountTreeIcon from '@mui/icons-material/AccountTree';
import Book from '@mui/icons-material/Book';
import Restaurant from '@mui/icons-material/Restaurant';
import School from '@mui/icons-material/School';
import ManageAccounts from '@mui/icons-material/ManageAccounts';

const sidebarWidth = 125

const MAJORS_DEPARTMENTS_PAGE = "/MajorsDepartments"
const CLASS_VISIT_PAGE = "/ClassVisit"
const STUDENT_LUNCH_PAGE = "/StudentLunch"
const FACULTY_DATA_PAGE = "/FacultyData"
const SYSTEM_USERS_PAGE = "/Users"
const STATISTICS_PAGE = "/Statistics"
const VISITS_PAGE = "/"

const ADMIN_PAGES = [MAJORS_DEPARTMENTS_PAGE, CLASS_VISIT_PAGE, STUDENT_LUNCH_PAGE, FACULTY_DATA_PAGE, SYSTEM_USERS_PAGE]

const unselectedCss = {marginX: 1, color: "#FFFFFF", backgroundColor: "#BB1111", '&:hover': {backgroundColor: '#881212'}}
const selectedCss = {marginX: 1, color: "#FFFFFF", backgroundColor: "#660808", '&:hover': {backgroundColor: '#881212'}}

let lastAdminPageVisited = MAJORS_DEPARTMENTS_PAGE

const adminSidebarOptions = [
    {icon: <AccountTreeIcon/>, name: "Majors / Departments", to: MAJORS_DEPARTMENTS_PAGE},
    {icon: <Book/>, name: "Classes", to: CLASS_VISIT_PAGE},
    {icon: <Restaurant/>, name: "Student Lunches", to: STUDENT_LUNCH_PAGE},
    {icon: <School/>, name: "Faculty Data", to: FACULTY_DATA_PAGE},
    {icon: <ManageAccounts/>, name: "System Users", to: SYSTEM_USERS_PAGE}
]

function Navigation({children, includeAdminSidebar=false}){
    let adminSidebar = (!includeAdminSidebar) ? <></> : (
        <Drawer variant="permanent"
                PaperProps={{sx: {backgroundColor: "#474747"}}}
                sx={{ width: sidebarWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: sidebarWidth, boxSizing: 'border-box'}}}
        >
            <Toolbar />
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden'}}>
                {adminSidebarOptions.map((option, index) => (
                    <Button title={option.hover} key={`admin-option-${index}`} component={Link} to={option.to}
                            variant="contained" color="inherit" sx={{ m:1 }}
                            disabled={window.location.toString().endsWith(option.to)}
                    >
                        <Stack
                            alignItems="center"
                        >
                            {option.icon}
                            <Typography variant="caption" alignContent="center">{option.name}</Typography>
                        </Stack>
                    </Button>
                ))}
            </Box>
        </Drawer>
    )

    for(const adminSidebarOption of adminSidebarOptions) {
        if(window.location.pathname === adminSidebarOption.to) {
            lastAdminPageVisited = adminSidebarOption.to
        }
    }

    const currentPage = window.location.pathname;

    return (
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
            <AppBar position="fixed" sx={{ bgcolor: "#BB1111", zIndex: (theme) => theme.zIndex.drawer + 1}}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>Prospective Scheduler</Typography>
                    <GuardedElement requiredPriveleges><Button component={Link} to={lastAdminPageVisited} sx={ADMIN_PAGES.includes(currentPage) ? selectedCss : unselectedCss}>Admin Controls</Button></GuardedElement>
                    <GuardedElement requiredPriveleges><Button component={Link} to={STATISTICS_PAGE} sx={currentPage === STATISTICS_PAGE ? selectedCss : unselectedCss}>Statistics</Button></GuardedElement>
                    <Button component={Link} to={VISITS_PAGE} sx={currentPage === VISITS_PAGE ? selectedCss : unselectedCss}>Visits</Button>
                    <LoginLogoutButton sx={unselectedCss}></LoginLogoutButton>
                </Toolbar>
            </AppBar>
            {adminSidebar}
            <Box component="main" sx={{ flexGrow: 1, m: 2}}>
                <Toolbar/>
                {children}
            </Box>
        </Box>
    );
}

export default Navigation;