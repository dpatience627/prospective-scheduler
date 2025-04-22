import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';

const ValidatedTimePicker = ({label, name, error, value, onChange, onBlur}) => {
    const handleChange = (v) => {
        onChange({
            target: {
                name: name,
                value: v
            }
        });
    }
    
    return (
        <TimePicker
            label={label}
            name={name}
            value={value}
            onChange={handleChange}
            onAccept={onBlur}
            slotProps={{
                textField: {
                    error: !!error,
                    helperText: error
                }
            }}
            viewRenderers={{
                hours: renderTimeViewClock,
                minutes: renderTimeViewClock,
                seconds: renderTimeViewClock,
            }}
        />
    )
}

export default ValidatedTimePicker;