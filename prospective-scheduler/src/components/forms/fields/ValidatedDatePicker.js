import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const ValidatedDatePicker = ({label, name, value, error, onChange, onBlur, disablePast, disableFuture, fullWidth, minDate, maxDate}) => {
    const handleChange = (v) => {
        onChange({
            target: {
                name: name,
                value: v
            }
        });
    }
    
    return (
        <DatePicker
            label={label}
            name={name}
            value={value}
            onChange={handleChange}
            onAccept={onBlur}
            disablePast={disablePast}
            disableFuture={disableFuture}
            minDate={minDate}
            maxDate={maxDate}
            slotProps={{
                textField: {
                    error: !!error,
                    helperText: error,
                    fullWidth: fullWidth
                },
            }}
        />
    )
}

export default ValidatedDatePicker;