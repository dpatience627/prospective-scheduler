import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Button from '@mui/material/Button';

const hasErrors = (errors) => {
    for (const prop in errors) {
        if (Object.hasOwn(errors, prop) && !!errors[prop]) {
            return true;
        }
    }
    return false;
}

const ValidatedForm = forwardRef(({children, onSubmit=()=>{}, validate=(form)=>{return {}}, formDefaults={}, revalidateDeps=[], submitLabel="Submit"}, ref) => {
    const [form, setForm] = useState(formDefaults);
    const [errors, setErrors] = useState({});

    //For specialized forms to reset this form
    useImperativeHandle(ref, () => ({
        reset() {
          setForm(formDefaults);
        }
    }));

    useEffect(() => {
        handleValidate(form);
    }, revalidateDeps);

    useEffect(() => {
        setForm(formDefaults);
        handleValidate(formDefaults);
    }, [formDefaults]);

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(form);
    }

    const handleChange = (event) => {
        const change = {}
        change[event.target.name] = event.target.value;

        const updatedForm = {...form, ...change};

        setForm(updatedForm);
        handleValidate(updatedForm);
    }

    const handleValidate = (form) => {
        const newErrors = validate(form);
        setErrors(newErrors);
    }

    const setUpElement = (element) => {
        const _children = React.Children.toArray(element.props.children);

        const props = {};

        //Only do extra setup on form elements;
        if(element.props.formItem) {
            props.value = form[element.props.name];
            props.error = errors[element.props.name];
            props.onChange = handleChange;
            //props.onBlur = (e)=>{handleValidate(form)};
        }

        //If this isn't a single element, recurse across its children
        if(_children.length > 0) {
            props.children = React.Children.map(element.props.children, child => setUpElement(child));
        }

        //Return the formatted element
        return React.cloneElement(element, props);
    }

    return (
        
        <form onSubmit={handleSubmit}>
            {React.Children.map(children, child => setUpElement(child))}
            <Button sx={{my: 4}}variant='contained' type="submit" disabled={hasErrors(errors)}>{submitLabel}</Button>
        </form>
    )
})

export default ValidatedForm;