import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import SearchBar from 'components/SearchBar';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import TableCell from 'components/table/TableCell';
import TableRow from 'components/table/TableRow';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useMemo, useState, useEffect, cloneElement } from 'react';

const ROWS_PER_PAGE = 5;

const defaultRenderRow = (row, index) => { return <></> }
const defaultIncludeInSearch = (row, search) => { return true }

const Table = ({
    title="Table", alertWhenEmpty="", alertWhenSearchFails="", columns=[], rows=[], loading=false, renderRow=defaultRenderRow, 
    maxHeight=500, paginated=false, searchable=false, includeInSearch=defaultIncludeInSearch,
    onAddClicked, onRowSelected, children
}) => {
    const [search, setSearch] = useState("");
    const updateSearch = (event) => {
        selectRow(-1,-1);
        setPage(0);
        setSearch(event.target.value.toLowerCase());
    }

    useEffect(() => {
        setPage(0);
    }, [rows, includeInSearch]);

    const [page, setPage] = useState(0);

    const indexedRows = useMemo(() => {
        return rows.map((row, index) => {
            const clone = {...row};
            clone.index = index;
            return clone;
        });
    }, [rows]);

    const filteredRows = useMemo(() => {
        return indexedRows.filter((row) => {
            return includeInSearch(row, search)
        });
    }, [indexedRows, search, includeInSearch]);

    const visibleRows = useMemo(() => {
        if(!paginated) {
            return filteredRows;
        }
        
        return filteredRows.slice(
            page * ROWS_PER_PAGE,
            page * ROWS_PER_PAGE + ROWS_PER_PAGE
        );
    }, [filteredRows, page, paginated]);

    const footer = useMemo(() => {
        if(!paginated) {
            return <></>
        }

        const handleChangePage = (event, newPage) => {
            setPage(newPage);
        };

        return (
            <TableFooter>
                <TableRow>
                    <TablePagination
                    count={filteredRows.length}
                    rowsPerPage={ROWS_PER_PAGE}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPageOptions={[ROWS_PER_PAGE]}
                    />
                </TableRow>
            </TableFooter>
        )
    //Yelling about a 'dependency' that won't change
    //eslint-disable-next-line
    }, [paginated, page, filteredRows.length]);

    

    const searchBar = useMemo(() => {
        return (
            <Grid item xs={4}>
                {searchable ? <SearchBar onChange={updateSearch}/> : <></>}
            </Grid>
        )
    //Yelling about a 'dependency' that won't change
    //eslint-disable-next-line
    }, [searchable])

    const addButton = useMemo(() => {
        if(!onAddClicked) {
            return <></>
        }

        return (
            <Grid item xs>
                <Grid container justifyContent="flex-end">
                    <Button variant='contained' startIcon={<AddIcon/>} onClick={onAddClicked}>Add</Button>
                </Grid>
            </Grid>
        )
    }, [onAddClicked])

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * ROWS_PER_PAGE - filteredRows.length) : 0;

    const [selectedRow, setSelectedRow] = useState(-1);
    const selectRow = (index) => {
        if(!onRowSelected) {
            return;
        }
        onRowSelected(index);
        setSelectedRow(index);
    }

    useEffect(() => {
        selectRow(-1,-1);
    //Yelling about a 'dependency' that won't change
    //eslint-disable-next-line
    }, [rows.length])

    const transformRow = (row) => {
        const rendered = renderRow(row, row.index);

        if(onRowSelected) {
            const additionalProps = {
                sx : {
                    '&:last-child td, &:last-child th ': { border: 0 },
                    "&:hover": {
                        backgroundColor: "#BBBBBB"
                    }
                },
                onClick: (event) => {selectRow(row.index)}
            }

            if(row.index === selectedRow) {
                additionalProps.style= {
                    backgroundColor: "#888888"
                }
            }

            return cloneElement(
                rendered,
                additionalProps
            )
        }

        return rendered;
    }

    const searchFailAlert = useMemo(() => {
        if(loading || rows.length == 0 || visibleRows.length > 0 || alertWhenSearchFails.length === 0)  {
            return <></>
        }
        return <Alert severity="info">{alertWhenSearchFails}</Alert>
    }, [loading, rows.length, visibleRows.length, alertWhenSearchFails]);

    const emptyAlert = useMemo(() => {
        if(loading || rows.length > 0 || alertWhenEmpty.length === 0)  {
            return <></>
        }
        return <Alert severity="info">{alertWhenEmpty}</Alert>
    }, [loading, rows.length, alertWhenSearchFails]);

    const loadingAlert = useMemo(() => {
        if(rows.length > 0 || !loading)  {
            return <></>
        }
        return (
            <Grid container spacing={2} my={2} justifyContent="center" alignItems="center">
                <Grid item>
                    <Typography>Loading, this might take a few seconds...</Typography>
                </Grid>
                <Grid item>
                    <CircularProgress/>
                </Grid>
            </Grid>
        )
    }, [rows.length, loading]);

    return (
        <>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Grid container spacing={2} sx={{my:2}} alignItems="center" >
            {searchBar}
            {children}
           {addButton}
        </Grid>
        <TableContainer component={Paper} sx={{ maxHeight: maxHeight }}>
            <MuiTable stickyHeader>
                <colgroup>
                    {columns.map((col,index) => <col key={`col-${index}-width`} width={`${col.width}%`}/>)}
                </colgroup>
                <TableHead>
                    <TableRow>
                        {columns.map((col) => <TableCell key={col.name}>{col.name}</TableCell>)}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {visibleRows.map(transformRow)}
                    {emptyRows > 0 && (
                    <TableRow key="empty-row" style={{height: 53 * emptyRows}}>
                        <TableCell colSpan={columns.length}/>
                    </TableRow>
                    )}
                </TableBody>
                {footer}
            </MuiTable>
            {searchFailAlert}
            {emptyAlert}
        </TableContainer>
        {loadingAlert}
        </>
    )
}

export default Table;