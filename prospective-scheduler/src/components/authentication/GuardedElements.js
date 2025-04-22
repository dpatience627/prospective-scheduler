import * as API from "../../api/api.js";
import LoginLogoutButton from "../navigation/LoginLogoutButton.jsx";

export const GuardedElement = ({children, deniedElement=<></>, requiredPriveleges=false}) => {
    const permissions = API.usePermissions(requiredPriveleges);

    const hasPermissions = (permissions !== -1 && (!requiredPriveleges || (requiredPriveleges && permissions === 1)));

    if(hasPermissions) {
        return (
            <>
                {children}
            </>
        );
    }

    return <>{deniedElement}</>
}

export const GuardedPage = ({children, requiredPriveleges=false}) => {
    const deniedElement = (
        <>
            <p>You do not have permission to view this page.</p>
            <LoginLogoutButton></LoginLogoutButton>
        </>
    )
    return <GuardedElement deniedElement={deniedElement} requiredPriveleges={requiredPriveleges}>{children}</GuardedElement>
}