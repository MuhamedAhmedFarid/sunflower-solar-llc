
import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import Logo from './icons/Logo';

const LoginPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'client' | 'recruiter' | 'admin'>('client');
    const [accessCode, setAccessCode] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { loginAsAdmin, loginAsClient, loginAsRecruiter, isLoading, error } = useApp();
    const [displayError, setDisplayError] = useState<string | null>(null);

    useEffect(() => {
        setDisplayError(error);
    }, [error]);

    const handleClientLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setDisplayError(null);
        await loginAsClient(accessCode);
    };

    const handleRecruiterLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setDisplayError(null);
        await loginAsRecruiter(username, password);
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setDisplayError(null);
        await loginAsAdmin(password);
    };
    
    const handleTabChange = (tabName: 'client' | 'recruiter' | 'admin') => {
        setActiveTab(tabName);
        setDisplayError(null);
        setUsername('');
        setPassword('');
    };

    const TabButton: React.FC<{ tabName: 'client' | 'recruiter' | 'admin'; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => handleTabChange(tabName)}
            className={`flex-1 relative py-4 text-sm font-semibold tracking-wider transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 first:rounded-tl-lg last:rounded-tr-lg ${
                activeTab === tabName
                    ? 'bg-white text-primary'
                    : 'bg-parchment/40 text-slate-500 hover:text-primary'
            }`}
        >
            {label}
            {activeTab === tabName && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>}
        </button>
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative animate-fade-in-up">
            <main className="w-full max-w-md">
                <div className="text-center mb-8">
                     <Logo className="h-40 w-40 inline-block text-primary" />
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-primary sm:text-4xl">Sunflower llc</h1>
                    <p className="mt-2 text-base text-primary/80">Access your dedicated candidate dashboard.</p>
                </div>
                <div className="bg-white shadow-2xl shadow-primary/10 rounded-xl">
                    <div className="flex">
                        <TabButton tabName="client" label="Client" />
                        <TabButton tabName="recruiter" label="Recruiter" />
                        <TabButton tabName="admin" label="Admin" />
                    </div>
                    <div className="p-6 sm:p-8">
                        {activeTab === 'client' && (
                            <form onSubmit={handleClientLogin} className="space-y-6">
                                <div>
                                    <label htmlFor="accessCode" className="sr-only">Access Code</label>
                                    <input
                                        id="accessCode"
                                        type="text"
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        placeholder="Enter client access code"
                                        className="w-full px-4 py-3 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed tracking-wider"
                                >
                                    {isLoading ? 'Verifying...' : 'View'}
                                </button>
                            </form>
                        )}
                        {activeTab === 'recruiter' && (
                             <form onSubmit={handleRecruiterLogin} className="space-y-4">
                                <div>
                                    <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"/>
                                </div>
                                <div>
                                    <input id="recruiterPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"/>
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-transform transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed tracking-wider !mt-6">
                                    {isLoading ? 'Signing In...' : 'Sign In'}
                                </button>
                            </form>
                        )}
                        {activeTab === 'admin' && (
                            <form onSubmit={handleAdminLogin} className="space-y-6">
                                <div>
                                    <label htmlFor="adminPassword" className="sr-only">Password</label>
                                    <input
                                        id="adminPassword"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:cursor-not-allowed tracking-wider"
                                >
                                    {isLoading ? 'Signing In...' : 'Enter'}
                                </button>
                            </form>
                        )}
                        {displayError && <p className="mt-4 text-sm text-center text-red-600">{displayError}</p>}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LoginPage;