import { useMemo } from 'react';
import Table from 'components/table/Table';
import TableRow from 'components/table/TableRow';
import TableCell from 'components/table/TableCell';

const getVisitsByFacultyMember = (visits) => {
    const visitsByFac = {}
    for(const visit of visits) {
        for(const facultyVisit of visit.FacultyVisits) {
            const faculty = facultyVisit.WithFaculty;
            const name = `${faculty.Title} ${faculty.FirstName} ${faculty.MiddleInitial} ${faculty.LastName}`;
            if(visitsByFac[name]) {
                visitsByFac[name]++;
            } else {
                visitsByFac[name] = 1;
            }
        }
    }

    const dataset = []
    for(const name in visitsByFac) {
        dataset.push({name: name, visits: visitsByFac[name]})
    }

    return dataset.sort((a,b) => b.visits-a.visits);
}

const columns = [
    {name: "Faculty", width: 60},
    {name: "Meetings w/ Prospective Students", width: 40},
];

const VisitsByFacultyTable = ({visits=[], paginated}) => {
    const rows = useMemo(() => {
        return getVisitsByFacultyMember(visits);
    }, [visits]);

    const renderRow = (faculty, index) => {
        return (
            <TableRow key={`${index}`}>
                <TableCell>{faculty.name}</TableCell>
                <TableCell>{faculty.visits}</TableCell>
            </TableRow>
        )
    }

    return (
        <Table
            title="Prospective Student Meetings Per Faculty Member"
            alertWhenEmpty="No faculty in the selected department had meetings with prospective students during this time."
            columns={columns} rows={rows} renderRow={renderRow}
            maxHeight={250}
            paginated={paginated}
        />
    )
}

export default VisitsByFacultyTable;