
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import Header from './Header';
import RefreshCwIcon from './icons/RefreshCwIcon';
import FileTextIcon from './icons/FileTextIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import XIcon from './icons/XIcon';
import MailIcon from './icons/MailIcon';
import PhoneIcon from './icons/PhoneIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import PlayCircleIcon from './icons/PlayCircleIcon';
import BoldIcon from './icons/BoldIcon';
import ItalicIcon from './icons/ItalicIcon';
import UnderlineIcon from './icons/UnderlineIcon';
import ListIcon from './icons/ListIcon';
import ListOrderedIcon from './icons/ListOrderedIcon';
import KeyIcon from './icons/KeyIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import UsersIcon from './icons/UsersIcon';
import { Client, Candidate, Recruiter, HourLogEntry } from '../types';
import Toast from './Toast';
import CreditCardIcon from './icons/CreditCardIcon';
import MoesHoursSummary from './MoesHoursSummary';
import HoursSummary from './HoursSummary';
import ClockIcon from './icons/ClockIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string, size?: 'md' | 'lg' }> = ({ children, onClose, title, size = 'md' }) => {
    const sizeClass = size === 'lg' ? 'max-w-lg' : 'max-w-md';
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className={`bg-white rounded-2xl shadow-xl w-full ${sizeClass} transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-up`}>
                <div className="flex justify-between items-center p-5 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-primary">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-600 hover:bg-slate-100">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

const ClientNotes: React.FC<{ client: Client }> = ({ client }) => {
    const { updateClientNotes } = useApp();
    const [notes, setNotes] = useState(client.notes || '');
    const [isEditing, setIsEditing] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setNotes(client.notes || '') }, [client.notes]);
    
    useEffect(() => {
        if (isEditing && editorRef.current) {
            editorRef.current.innerHTML = client.notes || '';
        }
    }, [isEditing, client.notes]);

    const handleSave = async () => { 
        if (editorRef.current) {
            await updateClientNotes(client.id, editorRef.current.innerHTML); 
        }
        setIsEditing(false);
    };

    const handleCommand = (command: string, value?: string) => (e: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>) => {
        e.preventDefault();
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };
    
    const ToolbarButton: React.FC<{ onMouseDown: (e: React.MouseEvent) => void; children: React.ReactNode; title: string }> = ({ onMouseDown, children, title }) => (
        <button type="button" onMouseDown={onMouseDown} className="p-2 text-slate-600 hover:bg-slate-200 rounded-md" title={title}>
            {children}
        </button>
    );
    
    const fonts = [
        { name: 'Default Sans', value: 'Inter' },
        { name: 'Default Serif', value: 'Lora' },
        { name: 'Merriweather', value: 'Merriweather' },
        { name: 'Lato', value: 'Lato' },
        { name: 'Roboto Mono', value: 'Roboto Mono' },
    ];

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-primary flex items-center gap-2"><ClipboardListIcon className="w-5 h-5" /> Notes & Offers</h4>
                {!isEditing && <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-primary hover:text-primary/80">{client.notes ? 'Edit Offer' : 'Create Offer'}</button>}
            </div>
            {isEditing ? (
                <div>
                    <div className="flex items-center gap-1 p-2 border border-slate-300 border-b-0 rounded-t-md bg-slate-50 flex-wrap">
                        <select onChange={(e) => handleCommand('fontName', e.target.value)(e)} className="text-sm border-slate-300 rounded-md focus:ring-primary focus:border-primary text-slate-700 bg-white hover:bg-slate-50">
                            {fonts.map(font => <option key={font.value} value={font.value}>{font.name}</option>)}
                        </select>
                        <div className="w-px h-5 bg-slate-300 mx-1"></div>
                        <ToolbarButton onMouseDown={handleCommand('bold')} title="Bold"><BoldIcon className="w-4 h-4" /></ToolbarButton>
                        <ToolbarButton onMouseDown={handleCommand('italic')} title="Italic"><ItalicIcon className="w-4 h-4" /></ToolbarButton>
                        <ToolbarButton onMouseDown={handleCommand('underline')} title="Underline"><UnderlineIcon className="w-4 h-4" /></ToolbarButton>
                        <div className="w-px h-5 bg-slate-300 mx-1"></div>
                        <ToolbarButton onMouseDown={handleCommand('insertUnorderedList')} title="Bulleted List"><ListIcon className="w-4 h-4" /></ToolbarButton>
                        <ToolbarButton onMouseDown={handleCommand('insertOrderedList')} title="Numbered List"><ListOrderedIcon className="w-4 h-4" /></ToolbarButton>
                    </div>
                    <div
                        ref={editorRef}
                        contentEditable={true}
                        className="w-full p-3 border border-slate-300 rounded-b-md focus:ring-2 focus:ring-primary bg-white min-h-[150px] prose-styles font-serif"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={() => setIsEditing(false)} className="text-sm bg-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300 font-semibold">Cancel</button>
                        <button onClick={handleSave} className="text-sm text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary/90 font-semibold">Save</button>
                    </div>
                </div>
            ) : <div className="text-sm text-slate-700 prose-styles font-serif" dangerouslySetInnerHTML={{ __html: notes || '<p class="text-slate-400 italic">No offers or notes yet.</p>' }} />}
        </div>
    );
};

const countries = [
    { code: '+20', name: 'Egypt' },
    { code: '+63', name: 'Philippines' },
    { code: '+52', name: 'Mexico' },
    { code: '+1', name: 'US' },
];

const AdminDashboard: React.FC = () => {
    const { 
        clients, recruiters, hourLogEntries, generateNewCode, addClient, updateClient, deleteClient, 
        addCandidate, updateCandidate, deleteCandidate,
        addRecruiter, updateRecruiterPassword, deleteRecruiter, updateAdminPassword,
        toggleCandidatePhoneVisibility, addHourLogEntry, updateHourLogEntry, deleteHourLogEntry,
    } = useApp();

    const [activeView, setActiveView] = useState<'clients' | 'recruiters' | 'hoursLog' | 'employeeHours' | 'summary'>('clients');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [clientModal, setClientModal] = useState({ isOpen: false, client: undefined as Client | undefined });
    const [recruiterModal, setRecruiterModal] = useState({ isOpen: false, recruiter: undefined as Recruiter | undefined });
    const [candidateModal, setCandidateModal] = useState({ isOpen: false, candidate: undefined as (Candidate & {id: string}) | undefined });
    const [hoursModalOpen, setHoursModalOpen] = useState(false);
    const [adminPasswordModal, setAdminPasswordModal] = useState(false);
    const [showToast, setShowToast] = useState<string | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [editHourModal, setEditHourModal] = useState<{ isOpen: boolean; entry?: HourLogEntry }>(() => ({ isOpen: false }));
    const [candidateEntriesModal, setCandidateEntriesModal] = useState<{ isOpen: boolean; candidate?: Candidate }>(() => ({ isOpen: false }));

    const selectedClient = clients.find(c => c.id === selectedClientId);

    useEffect(() => {
        if (window.innerWidth >= 768 && !selectedClientId && clients.length > 0) {
            setSelectedClientId(clients[0].id);
        }
    }, [clients, selectedClientId]);

    const handleRecruiterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const username = (form.elements.namedItem('username') as HTMLInputElement).value;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;
        if (!password) return;

        try {
            if (recruiterModal.recruiter) {
                await updateRecruiterPassword(recruiterModal.recruiter.id, password);
                setShowToast("Recruiter password updated.");
            } else {
                if (!username) return;
                await addRecruiter(username, password);
                setShowToast("Recruiter added successfully.");
            }
            setRecruiterModal({ isOpen: false, recruiter: undefined });
        } catch(error) {
            console.error("Failed to save recruiter", error);
        }
    };
    
    const handleClientSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const clientData = {
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            email: (form.elements.namedItem('email') as HTMLInputElement).value,
            phone_number: (form.elements.namedItem('phone_number') as HTMLInputElement).value,
        };
        if (!clientData.name || !clientData.email || !clientData.phone_number) return;

        try {
            if (clientModal.client) {
                await updateClient(clientModal.client.id, clientData);
            } else {
                await addClient(clientData);
            }
            setClientModal({ isOpen: false, client: undefined });
        } catch (error) {
            console.error("Failed to save client:", error);
        }
    };
    
    const handleCandidateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedClient) return;

        const form = e.currentTarget;
        const countryCode = (form.elements.namedItem('country_code') as HTMLSelectElement).value;
        const phone = (form.elements.namedItem('whatsapp_number') as HTMLInputElement).value;

        const candidateData = {
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            role: (form.elements.namedItem('role') as HTMLInputElement).value,
            email: (form.elements.namedItem('email') as HTMLInputElement).value,
            whatsapp_number: `${countryCode}${phone}`,
            resume_link: (form.elements.namedItem('resume_link') as HTMLInputElement).value,
            recording_link: (form.elements.namedItem('recording_link') as HTMLInputElement).value,
            active_hours: parseFloat((form.elements.namedItem('active_hours') as HTMLInputElement).value) || 0,
            number_of_sets: parseInt((form.elements.namedItem('number_of_sets') as HTMLInputElement).value, 10) || 0,
        };

        try {
            if (candidateModal.candidate?.id) {
                await updateCandidate(candidateModal.candidate.id, candidateData);
            } else {
                await addCandidate(selectedClient.id, {
                    ...candidateData,
                    rate_per_hour: 0,
                    total_hours: 0,
                });
            }
            setCandidateModal({ isOpen: false, candidate: undefined });
        } catch (error) {
            console.error("Failed to save candidate:", error);
        }
    };

    const AdminPasswordModal = () => {
        const [secretWord, setSecretWord] = useState('');
        const [newPassword, setNewPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [error, setError] = useState('');
        const isVerified = secretWord === 'Moe';

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            if (!isVerified) {
                setError('Incorrect secret word.');
                return;
            }
            if (!newPassword || newPassword !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
            await updateAdminPassword(newPassword);
            setShowToast("Admin password changed successfully!");
            setAdminPasswordModal(false);
        };

        return (
            <Modal onClose={() => setAdminPasswordModal(false)} title="Change Admin Password">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="secretWord" className="block text-sm font-medium text-slate-700 mb-1.5">Secret Word</label>
                        <input type="password" name="secretWord" id="secretWord" value={secretWord} onChange={e => setSecretWord(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary"/>
                    </div>
                     <div className="space-y-4 pt-2 border-t mt-4">
                        <label className="block text-sm font-medium text-slate-700 -mb-2">New Password</label>
                        <input type="password" name="newPassword" placeholder="Enter new password" disabled={!isVerified} value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-slate-100 disabled:cursor-not-allowed"/>
                        <input type="password" name="confirmPassword" placeholder="Confirm new password" disabled={!isVerified} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-slate-100 disabled:cursor-not-allowed"/>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setAdminPasswordModal(false)} className="bg-slate-100 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200">Cancel</button>
                        <button type="submit" disabled={!isVerified} className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed">Save Password</button>
                    </div>
                </form>
            </Modal>
        );
    };

    const getStatusColor = (status: string) => { 
        switch (status) {
            case 'Texted': return 'bg-teal-100 text-teal-800 border border-teal-200';
            case 'Good': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'Interview': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'Interviewed': return 'bg-orange-100 text-orange-800 border border-orange-200';
            case 'Rejected': return 'bg-red-100 text-red-800 border border-red-200';
            case 'Probation': return 'bg-green-100 text-green-800 border border-green-200';
            case 'Training': return 'bg-purple-100 text-purple-800 border border-purple-200';
            default: return 'bg-slate-100 text-slate-800 border border-slate-200';
        }
    };
    
    const getWhatsAppLink = (number: string) => {
        const cleanedNumber = number.replace(/[^0-9+]/g, '');
        return `https://wa.me/${cleanedNumber}`;
    };

    const TabButton: React.FC<{ view: 'clients' | 'recruiters' | 'hoursLog' | 'employeeHours' | 'summary' | 'stats'; label: string; icon: React.ReactNode }> = ({ view, label, icon }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeView === view ? 'bg-parchment text-primary' : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
            {icon} {label}
        </button>
    );
    
    const filteredLogEntries = useMemo(() => {
        if (!startDate || !endDate) {
            return hourLogEntries;
        }
        
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return hourLogEntries.filter(entry => {
            const entryDate = new Date(entry.entry_date);
            return entryDate >= start && entryDate <= end;
        });

    }, [hourLogEntries, startDate, endDate]);

    return (
        <>
            <div className="flex h-screen bg-transparent md:flex-row flex-col">
                <aside className={`w-full md:w-72 bg-white/80 backdrop-blur-sm border-r border-slate-200/50 flex flex-col transition-all duration-300 ${selectedClientId && activeView === 'clients' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="h-16 border-b border-slate-200/50 flex items-center justify-between px-4">
                       <h2 className="text-lg font-bold text-primary">Clients</h2>
                    </div>
                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul>{clients.map(client => <li key={client.id} className="group px-4 mb-1"><button onClick={() => {setSelectedClientId(client.id); setActiveView('clients');}} className={`w-full text-left px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg flex justify-between items-center ${selectedClientId === client.id && activeView === 'clients' ? 'bg-parchment text-primary' : 'text-slate-600 hover:bg-slate-100'}`}><span>{client.name}</span><div className="hidden group-hover:flex items-center gap-2"><PencilIcon onClick={(e) => { e.stopPropagation(); setClientModal({ isOpen: true, client }); }} className="w-4 h-4 text-slate-500 hover:text-primary"/><TrashIcon onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete ${client.name}?`)) deleteClient(client.id); }} className="w-4 h-4 text-slate-500 hover:text-red-600"/></div></button></li>)}</ul>
                    </nav>
                    <div className="p-4 border-t border-slate-200/50">
                        <button onClick={() => setClientModal({ isOpen: true, client: undefined })} className="w-full bg-primary text-white text-sm font-semibold py-3 rounded-lg hover:shadow-lg transition-transform transform hover:scale-[1.02]">+ Add New Client</button>
                    </div>
                </aside>

                <div className={`flex-1 flex flex-col ${!selectedClientId && activeView === 'clients' ? 'hidden md:flex' : 'flex'}`}>
                    <Header 
                        title={
                            activeView === 'clients' ? (selectedClient?.name || 'Client Dashboard') :
                            activeView === 'recruiters' ? 'Recruiter Management' :
                            activeView === 'hoursLog' ? 'Hours Log' :
                            activeView === 'employeeHours' ? 'Moe\'s Hours' :
                            'Summary'
                        }
                        headerActions={
                            <button onClick={() => setAdminPasswordModal(true)} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors p-2 rounded-md hover:bg-slate-100">
                                <KeyIcon className="w-4 h-4"/>
                                <span className="hidden sm:inline">Change Admin Password</span>
                            </button>
                        }
                    />
                    <div className="px-4 sm:px-6 lg:px-8 pt-4 border-b border-slate-200">
                        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
                            <TabButton view="clients" label="Clients" icon={<BriefcaseIcon className="w-5 h-5"/>} />
                            <TabButton view="recruiters" label="Recruiters" icon={<UsersIcon className="w-5 h-5"/>} />
                            <TabButton view="hoursLog" label="Hours Log" icon={<CreditCardIcon className="w-5 h-5"/>} />
                            <TabButton view="employeeHours" label="Moe's Hours" icon={<ClockIcon className="w-5 h-5"/>} />
                            <TabButton view="summary" label="Summary" icon={<TrendingUpIcon className="w-5 h-5"/>} />
                        </nav>
                    </div>
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        {activeView === 'clients' && (<>
                            {selectedClient ? (
                                <div className="animate-fade-in space-y-6">
                                    <div className="bg-white p-5 rounded-xl shadow-sm flex justify-between items-center flex-wrap gap-4">
                                       <div className="space-y-3">
                                            <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap"><span className="flex items-center gap-1.5"><MailIcon className="w-4 h-4" /> {selectedClient.email}</span><span className="flex items-center gap-1.5"><PhoneIcon className="w-4 h-4" /> {selectedClient.phone_number}</span></div>
                                            <div className="flex items-center"><p className="text-sm text-slate-500 mr-2">Access Code:</p><span className="font-mono bg-parchment/80 text-primary text-sm px-3 py-1 rounded-md">{selectedClient.access_code}</span><button onClick={() => generateNewCode(selectedClient.id)} className="ml-2 p-1.5 rounded-full text-slate-600 hover:bg-slate-200" title="Regenerate"><RefreshCwIcon className="w-4 h-4" /></button></div>
                                       </div>
                                        <button onClick={() => setCandidateModal({ isOpen: true, candidate: undefined })} className="bg-primary text-white font-semibold text-sm py-2.5 px-5 rounded-lg hover:shadow-lg transition-transform transform hover:scale-[1.02]">+ Add Candidate</button>
                                    </div>
                                    <ClientNotes client={selectedClient} />
                                    <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-parchment/30"><tr><th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Name</th><th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Sourced By</th><th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Status</th><th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Contact & Links</th><th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-primary uppercase tracking-wider">Visible to Client</th><th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-primary uppercase tracking-wider">Actions</th></tr></thead><tbody className="bg-white divide-y divide-slate-200">{selectedClient.candidates.map(candidate => (<tr key={candidate.id} className="hover:bg-parchment/40 transition-colors"><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{candidate.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{candidate.recruiters?.username || 'Admin'}</td><td className="px-6 py-4 whitespace-nowrap"><span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(candidate.status)}`}>{candidate.status}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-4 text-slate-500"><a href={candidate.resume_link} target="_blank" rel="noopener noreferrer" className="hover:text-primary" title="Resume"><FileTextIcon className="w-5 h-5"/></a>{candidate.recording_link && <a href={candidate.recording_link} target="_blank" rel="noopener noreferrer" className="hover:text-purple-500" title="Recording"><PlayCircleIcon className="w-5 h-5"/></a>}<a href={getWhatsAppLink(candidate.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="hover:text-green-400" title="WhatsApp"><WhatsAppIcon className="w-5 h-5"/></a>{candidate.email && <a href={`mailto:${candidate.email}`} className="hover:text-blue-500" title="Email"><MailIcon className="w-5 h-5"/></a>}</td><td className="px-6 py-4 whitespace-nowrap text-center"><button onClick={() => toggleCandidatePhoneVisibility(candidate.id, selectedClient.id, candidate.show_phone_to_client)} className={`p-2 rounded-full transition-colors ${candidate.show_phone_to_client ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`} title={candidate.show_phone_to_client ? 'Contact info is visible to client. Click to hide.' : 'Contact info is hidden from client. Click to show.'}><PhoneIcon className="w-4 h-4" /></button></td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right"><div className="flex items-center justify-end gap-4 text-slate-500"><button onClick={() => setCandidateModal({ isOpen: true, candidate })} className="hover:text-primary"><PencilIcon className="w-4 h-4" /></button><button onClick={() => { if(window.confirm('Delete candidate?')) deleteCandidate(candidate.id, selectedClient.id) }} className="hover:text-red-500"><TrashIcon className="w-4 h-4" /></button></div></td></tr>))}</tbody></table></div></div>
                                </div>
                            ) : (
                                <div className="text-center py-20 hidden md:block">
                                    <p className="text-slate-500 text-lg">{clients.length > 0 ? 'Select a client to view their dashboard.' : 'Add a client to get started.'}</p>
                                </div>
                            )}
                        </>)}
                        {activeView === 'recruiters' && (
                            <div className="animate-fade-in">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-primary">Recruiter Accounts</h2>
                                    <button onClick={() => setRecruiterModal({ isOpen: true, recruiter: undefined })} className="bg-primary text-white font-semibold text-sm py-2.5 px-5 rounded-lg hover:shadow-lg transition-transform transform hover:scale-[1.02]">+ Add Recruiter</button>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-parchment/30">
                                                <tr>
                                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Username</th>
                                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Joined</th>
                                                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-primary uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {recruiters.map(recruiter => (
                                                    <tr key={recruiter.id} className="hover:bg-parchment/40 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{recruiter.username}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(recruiter.created_at).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                                            <div className="flex items-center justify-end gap-4 text-slate-500">
                                                                <button onClick={() => setRecruiterModal({ isOpen: true, recruiter })} className="hover:text-primary flex items-center gap-1.5" title="Change Password"><KeyIcon className="w-4 h-4" /> <span className="hidden sm:inline">Change Password</span></button>
                                                                <button onClick={() => { if(window.confirm(`Delete recruiter ${recruiter.username}?`)) deleteRecruiter(recruiter.id) }} className="hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeView === 'hoursLog' && (
                             <div className="animate-fade-in">
                                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                                    <h2 className="text-2xl font-bold text-primary">Hours Log</h2>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <label htmlFor="start-date" className="text-sm font-medium text-slate-600">From:</label>
                                            <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border-slate-300 rounded-md shadow-sm text-sm p-2"/>
                                            <label htmlFor="end-date" className="text-sm font-medium text-slate-600">To:</label>
                                            <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border-slate-300 rounded-md shadow-sm text-sm p-2"/>
                                        </div>
                                        <button onClick={() => setHoursModalOpen(true)} className="bg-primary text-white font-semibold text-sm py-2.5 px-5 rounded-lg hover:shadow-lg transition-transform transform hover:scale-[1.02]">+ Log Hours</button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-parchment/30">
                                                <tr>
                                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Candidate</th>
                                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Client</th>
                                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Hours</th>
                                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Break</th>
                                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Meetings</th>
                                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Rate ($/hr)</th>
                                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Sets (current)</th>
                                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Balance Paid ($)</th>
                                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Total Payment ($)</th>
                                                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-primary uppercase tracking-wider">Entries</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {clients.flatMap(c => c.candidates).filter(cand => ['Training','Probation'].includes(cand.status)).map(candidate => {
                                                    const entries = filteredLogEntries.filter(e => e.candidate_id === candidate.id);
                                                    const hoursAdded = entries.reduce((s, e) => s + (Number(e.hours_added) || 0), 0);
                                                    const breakHours = entries.reduce((s, e) => s + (Number((e as any).break_hours ?? 0) || 0), 0);
                                                    const meetingsHours = entries.reduce((s, e) => s + (Number((e as any).meetings_hours ?? 0) || 0), 0);
                                                    const totalHours = hoursAdded + breakHours + meetingsHours;
                                                    const setsAdded = entries.reduce((s, e) => s + (Number(e.sets_added ?? 0) || 0), 0);
                                                    const balancePaid = entries.reduce((s, e) => s + (Number(e.balance_paid ?? 0) || 0), 0);
                                                    const ratePerHour = Number(candidate.rate_per_hour || 0);
                                                    const totalPayment = (totalHours * ratePerHour) + (setsAdded * 5);
                                                    const clientName = clients.find(cl => cl.candidates.some(ca => ca.id === candidate.id))?.name || '';
                                                    return (
                                                        <tr key={candidate.id} className="hover:bg-parchment/40 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{candidate.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{clientName}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600">{hoursAdded.toFixed(2)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{breakHours.toFixed(2)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{meetingsHours.toFixed(2)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{ratePerHour.toFixed(2)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{candidate.number_of_sets}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${balancePaid.toFixed(2)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">${totalPayment.toFixed(2)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                                                                <div className="flex items-center justify-end gap-4 text-slate-500">
                                                                    <button onClick={() => setCandidateEntriesModal({ isOpen: true, candidate })} className="text-sm bg-slate-100 px-3 py-1 rounded-md hover:bg-slate-200">View Entries</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                         {filteredLogEntries.length === 0 && (
                                            <div className="text-center py-16">
                                                <p className="text-slate-500">No hours logged for the selected date range.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeView === 'employeeHours' && (
                            <div className="animate-fade-in">
                                <MoesHoursSummary />
                            </div>
                        )}
                        {activeView === 'summary' && (
                            <div className="animate-fade-in">
                                <HoursSummary />
                            </div>
                        )}
                    </main>
                </div>
            </div>
            {adminPasswordModal && <AdminPasswordModal />}
            {hoursModalOpen && <HourLogModal onClose={() => setHoursModalOpen(false)} showToast={setShowToast} candidatesInProbation={clients.flatMap(c => c.candidates).filter(cand => ['Training', 'Probation'].includes(cand.status))} />}
            {editHourModal.isOpen && editHourModal.entry && <EditHourLogModal onClose={() => setEditHourModal({ isOpen: false })} showToast={setShowToast} entry={editHourModal.entry} />}
            {candidateEntriesModal.isOpen && candidateEntriesModal.candidate && (
                <CandidateEntriesModal
                    onClose={() => setCandidateEntriesModal({ isOpen: false })}
                    showToast={setShowToast}
                    candidate={candidateEntriesModal.candidate}
                    entries={filteredLogEntries.filter(e => e.candidate_id === candidateEntriesModal.candidate?.id)}
                    onEdit={(entry) => { setEditHourModal({ isOpen: true, entry }); }}
                />
            )}
            {showToast && <Toast message={showToast} onClose={() => setShowToast(null)} />}
            {clientModal.isOpen && <Modal onClose={() => setClientModal({ isOpen: false, client: undefined })} title={clientModal.client ? 'Edit Client' : 'Add New Client'}><form onSubmit={handleClientSubmit} className="space-y-4"><div><label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Client Name</label><input type="text" name="name" id="name" defaultValue={clientModal.client?.name} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" /></div><div><label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label><input type="email" name="email" id="email" defaultValue={clientModal.client?.email} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" /></div><div><label htmlFor="phone_number" className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label><input type="tel" name="phone_number" id="phone_number" defaultValue={clientModal.client?.phone_number} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" /></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setClientModal({ isOpen: false, client: undefined })} className="bg-slate-100 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200">Cancel</button><button type="submit" className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:shadow-md">Save Client</button></div></form></Modal>}
            {recruiterModal.isOpen && <Modal onClose={() => setRecruiterModal({ isOpen: false, recruiter: undefined })} title={recruiterModal.recruiter ? 'Change Password' : 'Add New Recruiter'}><form onSubmit={handleRecruiterSubmit} className="space-y-4"><div><label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">Username</label><input type="text" name="username" id="username" defaultValue={recruiterModal.recruiter?.username} required disabled={!!recruiterModal.recruiter} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary disabled:bg-slate-100" /></div><div><label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label><input type="password" name="password" id="password" required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" /></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setRecruiterModal({ isOpen: false, recruiter: undefined })} className="bg-slate-100 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200">Cancel</button><button type="submit" className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:shadow-md">Save</button></div></form></Modal>}
            {candidateModal.isOpen && selectedClient && (() => { const existingNumber = candidateModal.candidate?.whatsapp_number || ''; const detectedCountry = countries.find(c => existingNumber.startsWith(c.code)); const initialCountryCode = detectedCountry?.code || '+1'; const initialPhoneNumber = existingNumber.substring(initialCountryCode.length); return (<Modal onClose={() => setCandidateModal({ isOpen: false, candidate: undefined })} title={candidateModal.candidate?.id ? 'Edit Candidate' : 'Add Candidate'}><form onSubmit={handleCandidateSubmit} className="space-y-4"><div><label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label><input type="text" name="name" id="name" defaultValue={candidateModal.candidate?.name} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" /></div><div><label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1.5">Role / Position</label><input type="text" name="role" id="role" defaultValue={candidateModal.candidate?.role} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" /></div><div><label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label><input type="email" name="email" id="email" defaultValue={candidateModal.candidate?.email || ''} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" /></div><div><label htmlFor="whatsapp_number" className="block text-sm font-medium text-slate-700 mb-1.5">WhatsApp Number</label><div className="flex"><select name="country_code" defaultValue={initialCountryCode} className="px-3 border border-r-0 rounded-l-lg focus:ring-2 focus:ring-primary text-slate-900">{countries.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}</select><input type="tel" name="whatsapp_number" id="whatsapp_number" defaultValue={initialPhoneNumber} required className="w-full px-4 py-2.5 border rounded-r-lg focus:ring-2 focus:ring-primary" /></div></div><div><label htmlFor="resume_link" className="block text-sm font-medium text-slate-700 mb-1.5">Resume Link (URL)</label><input type="url" name="resume_link" id="resume_link" defaultValue={candidateModal.candidate?.resume_link} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" /></div><div><label htmlFor="recording_link" className="block text-sm font-medium text-slate-700 mb-1.5">Recording Link (URL)</label><input type="url" name="recording_link" id="recording_link" defaultValue={candidateModal.candidate?.recording_link || ''} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" /></div><div className="grid grid-cols-2 gap-4"><div><label htmlFor="active_hours" className="block text-sm font-medium text-slate-700 mb-1.5">Active Hours</label><input type="number" step="0.01" name="active_hours" id="active_hours" defaultValue={candidateModal.candidate?.active_hours || 0} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" /></div><div><label htmlFor="number_of_sets" className="block text-sm font-medium text-slate-700 mb-1.5">Number of Sets</label><input type="number" name="number_of_sets" id="number_of_sets" defaultValue={candidateModal.candidate?.number_of_sets || 0} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" /></div></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setCandidateModal({ isOpen: false, candidate: undefined })} className="bg-slate-100 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200">Cancel</button><button type="submit" className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:shadow-md">Save Candidate</button></div></form></Modal>)})()}
        </>
    );
};

const HourLogModal: React.FC<{onClose: () => void; showToast: (msg: string) => void; candidatesInProbation: Candidate[]}> = ({onClose, showToast, candidatesInProbation}) => {
    const { addHourLogEntry } = useApp();
    const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
    const [hoursAdded, setHoursAdded] = useState<string>('');
    const [rate, setRate] = useState<string>('');
    const [activeHours, setActiveHours] = useState<string>('');
    const [numSets, setNumSets] = useState<string>('');
    const [setsAddedThisEntry, setSetsAddedThisEntry] = useState<string>('0');
    const [balancePaid, setBalancePaid] = useState<string>('0');

    const selectedCandidate = useMemo(() => 
        candidatesInProbation.find(c => c.id === selectedCandidateId),
        [selectedCandidateId, candidatesInProbation]
    );

    useEffect(() => {
        if (selectedCandidate) {
            setRate(String(selectedCandidate.rate_per_hour || 0));
            setActiveHours(String(selectedCandidate.active_hours || 0));
            setNumSets(String(selectedCandidate.number_of_sets || 0));
            setHoursAdded(''); // Reset hours added when candidate changes
            setSetsAddedThisEntry('0');
            setBalancePaid('0');
        }
    }, [selectedCandidate]);

    const handleHoursAddedChange = (value: string) => {
        setHoursAdded(value);
        if (selectedCandidate) {
            const added = parseFloat(value) || 0;
            const currentActive = selectedCandidate.active_hours || 0;
            setActiveHours(String(currentActive + added));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const candidateId = selectedCandidateId;
        const hoursAddedNum = parseFloat(hoursAdded);
        const ratePerHourNum = parseFloat(rate);
        const activeHoursNum = parseFloat(activeHours);
        const numSetsNum = parseInt(numSets, 10) || 0;
        const setsAddedNum = parseInt(setsAddedThisEntry, 10) || 0;
        const balancePaidNum = parseFloat(balancePaid) || 0;
        const entryDate = (form.elements.namedItem('entry_date') as HTMLInputElement).value;
        const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value;
        
        if (!candidateId || isNaN(hoursAddedNum) || isNaN(ratePerHourNum) || !entryDate || isNaN(activeHoursNum) || isNaN(numSetsNum)) {
            showToast("Please fill all required fields correctly.");
            return;
        }

        try {
            await addHourLogEntry({
                candidate_id: candidateId,
                hours_added: hoursAddedNum,
                rate_per_hour: ratePerHourNum,
                entry_date: new Date(entryDate).toISOString(),
                active_hours: activeHoursNum,
                number_of_sets: numSetsNum,
                sets_added: setsAddedNum,
                balance_paid: balancePaidNum,
                notes: notes,
            }, activeHoursNum, numSetsNum);
            showToast("Hour entry logged successfully.");
            onClose();
        } catch (error: unknown) {
            console.error(error);
            const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : '';
            showToast(msg ? `Failed to log hours: ${msg}` : "Failed to log hours.");
        }
    };

    return (
        <Modal onClose={onClose} title="Log New Hour Entry">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="candidate_id" className="block text-sm font-medium text-slate-700 mb-1.5">Candidate</label>
                    <select id="candidate_id" name="candidate_id" value={selectedCandidateId} onChange={(e) => setSelectedCandidateId(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary bg-white text-slate-900">
                        <option value="" disabled>Select a candidate</option>
                        {candidatesInProbation.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="entry_date" className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                    <input type="date" id="entry_date" name="entry_date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="hours_added" className="block text-sm font-medium text-slate-700 mb-1.5">Hours Added</label>
                        <input type="number" step="0.01" id="hours_added" name="hours_added" value={hoursAdded} onChange={e => handleHoursAddedChange(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label htmlFor="rate_per_hour" className="block text-sm font-medium text-slate-700 mb-1.5">Rate per Hour ($)</label>
                        <input type="number" step="0.01" id="rate_per_hour" name="rate_per_hour" value={rate} onChange={e => setRate(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="active_hours" className="block text-sm font-medium text-slate-700 mb-1.5">Total Active Hours</label>
                        <input type="number" step="0.01" id="active_hours" name="active_hours" value={activeHours} onChange={e => setActiveHours(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label htmlFor="number_of_sets" className="block text-sm font-medium text-slate-700 mb-1.5">Total Number of Sets</label>
                        <input type="number" id="number_of_sets" name="number_of_sets" value={numSets} onChange={e => setNumSets(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                    </div>
                </div>
                <div>
                    <label htmlFor="sets_added" className="block text-sm font-medium text-slate-700 mb-1.5">Sets Added (this entry)</label>
                    <input type="number" id="sets_added" name="sets_added" value={setsAddedThisEntry} onChange={e => setSetsAddedThisEntry(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label htmlFor="balance_paid" className="block text-sm font-medium text-slate-700 mb-1.5">Balance Paid ($)</label>
                    <input type="number" step="0.01" id="balance_paid" name="balance_paid" value={balancePaid} onChange={e => setBalancePaid(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                </div>
                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1.5">Notes (Optional)</label>
                    <textarea id="notes" name="notes" rows={3} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary"></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-slate-100 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200">Cancel</button>
                    <button type="submit" className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:shadow-md">Log Entry</button>
                </div>
            </form>
        </Modal>
    )
}


export default AdminDashboard;

const EditHourLogModal: React.FC<{ onClose: () => void; showToast: (msg: string) => void; entry: HourLogEntry }> = ({ onClose, showToast, entry }) => {
    const { updateHourLogEntry } = useApp();
    const [entryDate, setEntryDate] = useState<string>(new Date(entry.entry_date).toISOString().split('T')[0]);
    const [hoursAdded, setHoursAdded] = useState<string>(String(entry.hours_added ?? ''));
    const [rate, setRate] = useState<string>(String(entry.rate_per_hour ?? ''));
    const [setsAdded, setSetsAdded] = useState<string>(String(entry.sets_added ?? 0));
    const [balancePaid, setBalancePaid] = useState<string>(String(entry.balance_paid ?? 0));
    const [notes, setNotes] = useState<string>(entry.notes ?? '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateHourLogEntry(entry.id, {
                entry_date: new Date(entryDate).toISOString(),
                hours_added: parseFloat(hoursAdded) || 0,
                rate_per_hour: parseFloat(rate) || 0,
                sets_added: parseInt(setsAdded || '0', 10) || 0,
                balance_paid: parseFloat(balancePaid) || 0,
                notes: notes || null,
            } as Partial<HourLogEntry>);
            showToast('Hour entry updated.');
            onClose();
        } catch (err) {
            console.error(err);
            showToast('Failed to update entry.');
        }
    };

    return (
        <Modal onClose={onClose} title="Edit Hour Entry">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Candidate</label>
                    <input type="text" value={entry.candidates?.name || ''} disabled className="w-full px-4 py-2.5 border rounded-lg bg-slate-50" />
                </div>
                <div>
                    <label htmlFor="entry_date" className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                    <input type="date" id="entry_date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="hours_added" className="block text-sm font-medium text-slate-700 mb-1.5">Hours Added</label>
                        <input type="number" step="0.01" id="hours_added" value={hoursAdded} onChange={e => setHoursAdded(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                        <label htmlFor="rate_per_hour" className="block text-sm font-medium text-slate-700 mb-1.5">Rate per Hour ($)</label>
                        <input type="number" step="0.01" id="rate_per_hour" value={rate} onChange={e => setRate(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                    </div>
                </div>
                <div>
                    <label htmlFor="sets_added" className="block text-sm font-medium text-slate-700 mb-1.5">Sets Added (this entry)</label>
                    <input type="number" id="sets_added" value={setsAdded} onChange={e => setSetsAdded(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label htmlFor="balance_paid" className="block text-sm font-medium text-slate-700 mb-1.5">Balance Paid ($)</label>
                    <input type="number" step="0.01" id="balance_paid" value={balancePaid} onChange={e => setBalancePaid(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1.5">Notes (Optional)</label>
                    <textarea id="notes" rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="bg-slate-100 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200">Cancel</button>
                    <button type="submit" className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:shadow-md">Save Changes</button>
                </div>
            </form>
        </Modal>
    );
};

const CandidateEntriesModal: React.FC<{ onClose: () => void; showToast: (msg: string) => void; candidate: Candidate; entries: HourLogEntry[]; onEdit: (entry: HourLogEntry) => void }> = ({ onClose, showToast, candidate, entries, onEdit }) => {
    const { deleteHourLogEntry } = useApp();

    return (
        <Modal onClose={onClose} title={`Entries for ${candidate.name}`} size="lg">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-parchment/30">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase">Hours</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase">Rate</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase">Sets</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase">Balance</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase">Notes</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-primary uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {entries.map(en => (
                            <tr key={en.id} className="hover:bg-parchment/40">
                                <td className="px-4 py-2 text-sm text-slate-600">{new Date(en.entry_date).toLocaleDateString()}</td>
                                <td className="px-4 py-2 text-sm font-semibold text-slate-800">{Number(en.hours_added).toFixed(2)}</td>
                                <td className="px-4 py-2 text-sm text-slate-600">{Number(en.rate_per_hour).toFixed(2)}</td>
                                <td className="px-4 py-2 text-sm text-slate-600">{en.sets_added ?? en.number_of_sets ?? 0}</td>
                                <td className="px-4 py-2 text-sm text-slate-600">${Number(en.balance_paid ?? 0).toFixed(2)}</td>
                                <td className="px-4 py-2 text-sm text-slate-600">{en.notes}</td>
                                <td className="px-4 py-2 text-sm text-right text-slate-500">
                                    <div className="flex items-center justify-end gap-3">
                                        <button onClick={() => onEdit(en)} className="hover:text-primary"><PencilIcon className="w-4 h-4" /></button>
                                        <button onClick={async () => { if (window.confirm('Delete hour entry?')) { try { await deleteHourLogEntry(en.id); showToast('Hour entry deleted.'); } catch (err) { console.error(err); showToast('Failed to delete entry.'); } } }} className="hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No entries for this candidate in the selected range.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button onClick={onClose} className="bg-slate-100 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200">Close</button>
            </div>
        </Modal>
    );
};
