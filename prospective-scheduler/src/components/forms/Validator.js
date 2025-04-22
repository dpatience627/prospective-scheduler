class ValidationCheck {
    constructor(formItemName, errorMessage, checkFunction) {
        this.formItemName = formItemName;
        this.errorMessage = errorMessage;
        this.checkFunction = checkFunction;
    }

    validate(input) {
        if(this.checkFunction(input)) {
            return null;
        }
        return this.errorMessage;
    }
}

class Validator {
    constructor() {
        this.formItemName = ""
        this.checks = [];
        this.form = {};
    }

    and() {
        return this;
    }

    check(formItemName) {
        this.formItemName = formItemName;
        return this;
    }

    fail(formItemName) {
        this.formItemName = formItemName
        this.checks.push(new ValidationCheck(
            this.formItemName,
            "Field automatically failed for testing", 
            (v) => {return false;}
        ));
        return this;
    }

    require(formItemName) {
        this.formItemName = formItemName;
        this.checks.push(new ValidationCheck(
            this.formItemName,
            "This field is required!", 
            validateRequiredField
        ));
        return this;
    }

    forCustom(customValidationFunction, errorMessage) {
        this.checks.push(new ValidationCheck(this.formItemName, errorMessage, customValidationFunction));
        return this;
    }

    forValidGCCEmail(errorMessage) {
        this.checks.push(new ValidationCheck(this.formItemName, errorMessage, validateGCCEmail));
        return this;
    }

    forLettersOnly(errorMessage) {
        this.checks.push(new ValidationCheck(this.formItemName, errorMessage, validateLettersOnly))
        return this;
    }

    forName() {
        this.checks.push(new ValidationCheck(this.formItemName, "This field must only contain letters or dashes!", validateName));
        return this;
    }

    isBeforeTime(endTimeFormItemName) {
        const checkFunction = (startTime) => {
            const endTime = this.form[endTimeFormItemName];
            return validateTimeRange(startTime, endTime);
        }
        
        this.checks.push(new ValidationCheck(
            this.formItemName,
            "Start time must come before end time!",
            checkFunction
        ));

        return this
    }

    isTimeRangeAtLeast(endTimeFormItemName, hours) {
        const checkFunction = (startTime) => {
            const endTime = this.form[endTimeFormItemName];
            return endTime.diff(startTime, 'minutes') >= 60;
        }
        
        this.checks.push(new ValidationCheck(
            this.formItemName,
            "The visit must last at least one hour!",
            checkFunction
        ));

        return this
    }

    validate(form) {
        this.form = form;
        const errors = {};

        for(const check of this.checks) {
            //If there was already an error for this item, don't check any more validation requirements for it
            if(errors[check.formItemName]) { continue; }
            
            errors[check.formItemName] = check.validate(form[check.formItemName]);
        }

        return errors;
    }

    compile() {
        return (form) => {return this.validate(form);}
    }

}

const validateTimeRange = (start, end) => {
    return start.isBefore(end);
}

const validateRequiredField = (input) => {
    return !!input;
}

const validateGCCEmail = (email) => {
    const gccEmailRegex = /^([A-Z]|[0-9])+@GCC\.EDU$/i
    return gccEmailRegex.test(email);
}

const validateLettersOnly = (text) => {
    return /^[A-Za-z]*$/.test(text);
}

const validateName = (text) => {
    return /^[A-Za-z-]*$/.test(text);
}

export default Validator;