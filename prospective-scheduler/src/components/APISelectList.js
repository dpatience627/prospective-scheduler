import { useEffect, useState, useMemo } from "react";
import TextField from '@mui/material/TextField';
import MenuItem from "@mui/material/MenuItem";
import * as API from "api/api.js";

export const LIST_OF_MAJORS = 0;
export const LIST_OF_DEPARTMENTS = 1;
export const LIST_OF_USER_ROLES = 2;

const APISelectList = ({type, name, label, defaultValue=1, includeNone=false, noneName="None", fullWidth=false, onChange=(v)=>{}}) => {
    const [list, setList] = useState([]);
    const [value, setValue] = useState(defaultValue);
    
    useEffect(() => {
        setValue(defaultValue);
    }, [defaultValue]);

    useEffect(() => {
        getListOfType(type).then((l) => {setList(l);});
    }, []);

    const noneOption = useMemo(() => {
        if(!includeNone) {
            return []
        }
        return <MenuItem key="option-none" value={-1}>{noneName}</MenuItem>
    }, [includeNone])

    const handleChange = (e) => {
        setValue(e.target.value);
        onChange(e);
    };

    if(!list || list.length === 0) {
        return <></>
    }

    return (
        <TextField select label={label} name={name} value={value} onChange={handleChange} fullWidth={fullWidth}>
            {noneOption}
            {list.map((item, index) => (
                <MenuItem key={`option-${index}`} value={getValueOfItem(item,type)}>{getNameofItem(item,type)}</MenuItem>
            ))}
        </TextField>
    )
}

const getValueOfItem = (item, type) => {
    switch(type) {
        case LIST_OF_MAJORS: return item.MajorID;
        case LIST_OF_DEPARTMENTS: return item.DepartmentID;
        case LIST_OF_USER_ROLES: return item.RoleID;
        default: return 0;
    }
}

const getNameofItem = (item, type) => {
    switch(type) {
        case LIST_OF_MAJORS: return item.MajorName;
        case LIST_OF_DEPARTMENTS: return item.DepartmentName;
        case LIST_OF_USER_ROLES: return item.RoleName;
        default: return 0;
    }
}

const getListOfType = (type) => {
    switch(type) {
        case LIST_OF_MAJORS: return API.getMajors();
        case LIST_OF_DEPARTMENTS: return API.getDepartments();
        case LIST_OF_USER_ROLES: return API.getUserRoles();
        default: return [];
    }
}

export default APISelectList;
