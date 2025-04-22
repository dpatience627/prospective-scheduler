import * as React from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({placeholder="Search", onChange=(event)=>{}}) => {
  return (
    <TextField
        placeholder={placeholder}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
                <SearchIcon/>
            </InputAdornment>
          ),
        }}
        variant="outlined"
        onChange={onChange}
        fullWidth
    />
  );
}

export default SearchBar;