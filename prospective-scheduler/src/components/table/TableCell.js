import { styled } from '@mui/material/styles';
import {default as MuiTableCell, tableCellClasses} from '@mui/material/TableCell';

const TableCell = styled(MuiTableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.error.dark,
      color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
    },
}));

export default TableCell;