import { AuthenticatedTemplate } from '@azure/msal-react';

export const PageLayout = (props) => {
    /**
     * Most applications will need to conditionally render certain components based on whether a user is signed in or not.
     * msal-react provides 2 easy ways to do this. AuthenticatedTemplate and UnauthenticatedTemplate components will
     * only render their children if a user is authenticated or unauthenticated, respectively.
     */
    return (
        <>
          
            {props.children}
            <br />
            <AuthenticatedTemplate>
                <footer>
                    <center>
                        <span  className="font-mono-data text-[11px] text-slate-500">
                            Contains public sector information licensed under the Open Government Licence v3.0        
                        </span>
                      </center>
                </footer>
            </AuthenticatedTemplate>
        </>
    );
}