
import React from 'react';
import { useApp } from '../hooks/useApp';
import LogOutIcon from './icons/LogOutIcon';
import Logo from './icons/Logo';

interface HeaderProps {
    title: string;
    children?: React.ReactNode;
    headerActions?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, children, headerActions }) => {
    const { logout } = useApp();

    return (
        <header className="bg-white/70 backdrop-blur-xl shadow-sm sticky top-0 z-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-4">
                        {children || (
                           <Logo className="h-10 w-10 text-primary" />
                        )}
                        <h1 className="text-xl font-bold text-primary truncate">{title}</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        {headerActions}
                        <button
                            onClick={logout}
                            className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors"
                        >
                            <LogOutIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
