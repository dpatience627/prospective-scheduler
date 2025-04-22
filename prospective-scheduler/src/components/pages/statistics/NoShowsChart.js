import { useMemo } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const numberOfNoShows = (visits) => {
    return visits.filter((visit) => visit.WasNoShow).length;
}

const NoShowsChart = ({visits=[]}) => {
    const noShows = useMemo(() => numberOfNoShows(visits), [visits]);
    const attended = visits.length - noShows;

    return (
        <Stack>
            <Typography variant="h5">Scheduled Visits Attended</Typography>
            <PieChart
                series={[
                    {
                        data: [
                            { color: '#1F449C', value: attended, label: 'Attended' },
                            { color: '#F05039', value: noShows, label: 'No-Show' },
                        ],
                        highlightScope: { faded: 'global', highlighted: 'item' },
                        faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                    },
                ]}
                width={500}
                height={300}
            />
        </Stack>
    )
}

export default NoShowsChart;