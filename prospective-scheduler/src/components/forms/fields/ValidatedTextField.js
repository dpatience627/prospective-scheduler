import TextField from '@mui/material/TextField';

const ValidatedTextField = ({label, name, value, maxLength, error, onChange, onBlur, onClick}) => {
    return (
        <TextField
            label={label}
            name={name}
            value={value}
            error={!!error}
            helperText={error}
            inputProps={{ maxLength: maxLength }}
            onChange={onChange}
            onBlur={onBlur}
            onClick={onClick}
        />
    )
}

export default ValidatedTextField