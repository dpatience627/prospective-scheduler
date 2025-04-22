import React, { useMemo } from "react";
import Stack from '@mui/material/Stack';
import * as DateTimeUtils from "utils/DateTimeUtils";
import APISelectList, { LIST_OF_MAJORS } from "components/APISelectList";
import Validator from "components/forms/Validator";
import PopupForm from "components/forms/PopupForm";
import ValidatedTextField from "components/forms/fields/ValidatedTextField";
import ValidatedDatePicker from "components/forms/fields/ValidatedDatePicker";
import ValidatedTimePicker from "components/forms/fields/ValidatedTimePicker";

const formDefaults = {
    VisitDate: DateTimeUtils.tomorrow(),
    StartTime: DateTimeUtils.hour(12),
    EndTime: DateTimeUtils.hour(13),
    StudentFirstName: "",
    StudentMiddleInitial: "",
    StudentLastName: "",
    IntendedMajorID: 1,
    CreatedByUserID: 1
}

const formatForm = (form) => {
    const formatting = {};
    formatting.VisitDate = DateTimeUtils.formatDateForDB(form.VisitDate);
    formatting.StartTime = DateTimeUtils.formatTimeForDB(form.StartTime);
    formatting.EndTime = DateTimeUtils.formatTimeForDB(form.EndTime);
    return {...form, ...formatting};
}

const AddVisitPopup = ({open, onClose, onSubmit}) => {
    const validate = useMemo(() => {
        return new Validator()
            .require("StudentFirstName").and().check("StudentFirstName").forName()
            .and().require("StudentLastName").and().check("StudentLastName").forName()
            .and().check("StudentMiddleInitial").forName()
            .and().check("StartTime").isBeforeTime("EndTime")
            .and().check("StartTime").isTimeRangeAtLeast("EndTime", 1)
            .compile()
    }, []);

    const handleSubmit = (form) => {
        onSubmit(formatForm(form));
    }

    return (
        <PopupForm
            title="Add Prospective Student Visit" open={open}
            onClose={onClose} onSubmit={handleSubmit} validate={validate}
            formDefaults={formDefaults}
        >
            <Stack spacing={3} direction="row" sx={{marginBottom: 4}}>
                <ValidatedTextField label="First Name" name="StudentFirstName" maxLength={40} formItem/>
                <ValidatedTextField label="Middle Initial" name="StudentMiddleInitial" maxLength={1} formItem/>
                <ValidatedTextField label="Last Name" name="StudentLastName" maxLength={40} formItem/>
            </Stack>

            <Stack spacing={3} direction="row" sx={{marginBottom: 4}}>
                <APISelectList name="IntendedMajorID" label="Intended Major" type={LIST_OF_MAJORS} formItem/>
            </Stack>

            <Stack spacing={3} direction="row" sx={{marginBottom: 4}}>
                <ValidatedDatePicker label="Visit Date" name="VisitDate" disablePast formItem/>
                <ValidatedTimePicker label="Start Time" name="StartTime" formItem/>
                <ValidatedTimePicker label="End Time" name="EndTime" formItem/>
            </Stack>
        </PopupForm>
    )
}

export default AddVisitPopup;