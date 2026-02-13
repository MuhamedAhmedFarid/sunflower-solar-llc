
import React from 'react';
import { AppProvider, useApp } from './hooks/useApp';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import ClientPortal from './components/ClientPortal';
import RecruiterDashboard from './components/RecruiterDashboard';

const AppContent: React.FC = () => {
    const { currentUser, currentClient, currentRecruiter } = useApp();

    if (currentUser === 'admin') {
        return <AdminDashboard />;
    }
    
    if (currentUser === 'recruiter' && currentRecruiter) {
        return <RecruiterDashboard recruiter={currentRecruiter} />;
    }

    if (currentUser === 'client' && currentClient) {
        return <ClientPortal client={currentClient} />;
    }

    return <LoginPage />;
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <div className="min-h-screen animate-fade-in">
                <AppContent />
            </div>
        </AppProvider>
    );
};

export default App;
