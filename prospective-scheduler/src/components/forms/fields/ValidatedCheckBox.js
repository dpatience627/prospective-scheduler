import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const ValidatedCheckBox = ({label, name, value, error, defaultValue, onChange, onBlur}) => { 
    return (<>
        <Stack direction="row" alignItems="center">
            <Checkbox
                name={name}
                value={value}
                onChange={(e,checked) => {return onChange({
                    target: {
                        name: name,
                        value: checked
                    }
                })}}
                onBlur={onBlur}
                defaultChecked={defaultValue}
            />
            <Typography>{label}</Typography>
        </Stack>
    </>)
}

export default ValidatedCheckBox