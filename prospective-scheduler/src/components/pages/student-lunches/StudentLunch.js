import React, { useState, useEffect } from 'react';
import Navigation from 'components/navigation/Navigation';
import StudentTable from 'components/pages/student-lunches/StudentTable';
import StudentInfo from 'components/pages/student-lunches/StudentInfo';

import * as API from 'api/api.js';
import Grid from '@mui/material/Grid';

const StudentLunch = () => {
    const [selectedStudentIdx, setSelectedStudentIdx] = useState(-1);
    const [updateToggle, setUpdateToggle] = useState(false);
    const [students, edit, remove, add, loading] = API.useStudents([updateToggle]);

    const selectedStudent = selectedStudentIdx == -1 ? null : students[selectedStudentIdx];

    const handleEdit = (studentForm) => {
        edit(selectedStudent.StudentID, studentForm);
    }

    return (
        <Navigation includeAdminSidebar>
            <Grid container spacing={5}>
                <Grid item minWidth={800} maxWidth={800}>
                    <StudentTable students={students} onStudentSelected={setSelectedStudentIdx} onTableUpdate={() => {setUpdateToggle(!updateToggle)}}/>
                </Grid>
                <Grid item minWidth={800} maxWidth={800}>
                    <StudentInfo currentStudents={students} student={selectedStudent} students={students} onStudentEdited={handleEdit}/>
                </Grid>
            </Grid>
        </Navigation>
    )
}

export default StudentLunch;