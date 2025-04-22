
import { styled } from '@mui/material/styles';
import {default as MuiTableRow} from '@mui/material/TableRow';

const TableRow = styled(MuiTableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

export default TableRow;