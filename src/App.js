import { MsalProvider} from '@azure/msal-react';
import { PageLayout } from './components/PageLayout';
import { MainContent } from './MainContent';


const App = ({ instance }) => {
    return (
        <MsalProvider instance={instance}>
            <PageLayout>
                <MainContent />
            </PageLayout>
        </MsalProvider>
    );
};
export default App;
