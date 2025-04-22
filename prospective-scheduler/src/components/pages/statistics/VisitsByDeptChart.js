import { BarChart } from '@mui/x-charts/BarChart';
import { useMemo } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const getVisitsByDepartment = (visits) => {
    const visitsByDept = {}
    for(const visit of visits) {
        const dept = visit.IntendedMajor.MajorDepartment.DepartmentAbbrev;
        if(visitsByDept[dept]) {
            visitsByDept[dept]++;
        } else {
            visitsByDept[dept] = 1;
        }
    }

    const dataset = []
    for(const dept in visitsByDept) {
        dataset.push({dept: dept, count: visitsByDept[dept]})
    }

    return dataset
}

const chartSettings = {
    yAxis: [{label: 'Visits', tickMinStep: 1}],
    width: 400,
    height: 300,
};

const VisitsByDeptChart = ({visits=[]}) => {
    const dataset = useMemo(() => {
        return getVisitsByDepartment(visits);
    }, [visits]);

    return (
        <Stack>
            <Typography variant="h5">Visits Per Department</Typography>
            <BarChart
                dataset={dataset}
                xAxis={[{ scaleType: 'band', dataKey: 'dept', label: 'Department'}]}
                series={[{ dataKey: 'count', color:'#ffc800' }]}
                {...chartSettings}
            />
        </Stack>
    )
}

export default VisitsByDeptChart;