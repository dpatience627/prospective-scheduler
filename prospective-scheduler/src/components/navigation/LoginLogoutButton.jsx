import Button from '@mui/material/Button';
import { useMsal } from '@azure/msal-react';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';

const LoginLogoutButton = ({sx}) => {
    const { instance } = useMsal();

    const initializeLogin = () => {
        instance.loginRedirect();
    };
    
    const initializeLogout = () => {
        instance.logoutRedirect();
    };

    return (
        <>
            <UnauthenticatedTemplate>
                <Button color="inherit" onClick={initializeLogin} sx={sx}>Login</Button>
            </UnauthenticatedTemplate>
            <AuthenticatedTemplate>
                <Button color="inherit" onClick={initializeLogout} sx={sx}>Logout</Button>
            </AuthenticatedTemplate>
        </>
    );
};

export default LoginLogoutButton;