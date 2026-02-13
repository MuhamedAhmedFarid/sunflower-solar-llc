
import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import Header from './Header';
import { RecruiterSession, ClientForRecruiter, Candidate } from '../types';
import PencilIcon from './icons/PencilIcon';
import XIcon from './icons/XIcon';

interface RecruiterDashboardProps {
    recruiter: RecruiterSession;
}

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string }> = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-up">
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

const countries = [
    { code: '+20', name: 'Egypt' },
    { code: '+63', name: 'Philippines' },
    { code: '+52', name: 'Mexico' },
    { code: '+1', name: 'US' },
];

const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ recruiter }) => {
    const { addCandidate, updateCandidate } = useApp();
    const [selectedClient, setSelectedClient] = useState<ClientForRecruiter | null>(recruiter.clients[0] || null);
    const [candidateModal, setCandidateModal] = useState({ isOpen: false, candidate: undefined as (Candidate & {id: string}) | undefined });

    useEffect(() => {
        if (selectedClient) {
            // Find the updated version of the currently selected client from the prop
            const updatedClient = recruiter.clients.find(c => c.id === selectedClient.id);
            setSelectedClient(updatedClient || null);
        } else if (recruiter.clients.length > 0) {
            // If no client was selected, but now there are clients, select the first one.
            setSelectedClient(recruiter.clients[0]);
        }
    }, [recruiter.clients]);

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            Texted: 'bg-teal-100 text-teal-800 border border-teal-200',
            Good: 'bg-blue-100 text-blue-800 border border-blue-200',
            Interview: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
            Interviewed: 'bg-orange-100 text-orange-800 border border-orange-200',
            Rejected: 'bg-red-100 text-red-800 border border-red-200',
            Probation: 'bg-green-100 text-green-800 border border-green-200',
            Training: 'bg-purple-100 text-purple-800 border border-purple-200',
            Pending: 'bg-slate-100 text-slate-800 border border-slate-200',
        };
        return colors[status] || colors['Pending'];
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
                }, recruiter.id);
            }
            setCandidateModal({ isOpen: false, candidate: undefined });
        } catch (error) {
            console.error("Failed to save candidate:", error);
        }
    };

    return (
        <>
            <div className="flex h-screen bg-transparent">
                <aside className="w-72 bg-white/80 backdrop-blur-sm border-r border-slate-200/50 flex-col hidden md:flex">
                    <div className="h-16 border-b border-slate-200/50 flex items-center px-6">
                        <h2 className="text-lg font-bold text-primary">All Clients</h2>
                    </div>
                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul>
                            {recruiter.clients.map(client => (
                                <li key={client.id} className="px-4 mb-1">
                                    <button onClick={() => setSelectedClient(client)} className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors rounded-lg ${selectedClient?.id === client.id ? 'bg-parchment text-primary' : 'text-slate-600 hover:bg-slate-100'}`}>
                                        {client.name.split(' ')[0]}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                <div className="flex-1 flex flex-col">
                    <Header title={`Recruiter: ${recruiter.username}`} />
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        {selectedClient ? (
                            <div className="animate-fade-in">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-primary">Client: {selectedClient.name.split(' ')[0]}</h3>
                                    </div>
                                    <button onClick={() => setCandidateModal({ isOpen: true, candidate: undefined })} className="bg-primary text-white font-semibold text-sm py-2.5 px-5 rounded-lg hover:shadow-lg transition-transform transform hover:scale-[1.02]">
                                        + Add Candidate
                                    </button>
                                </div>

                                {/* Candidate Table */}
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-parchment/30">
                                            <tr>
                                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Name</th>
                                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Status</th>
                                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Sourced By</th>
                                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-primary uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {selectedClient.candidates.map(candidate => (
                                                <tr key={candidate.id} className="hover:bg-parchment/40 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-primary">{candidate.name}</div><div className="text-sm text-slate-500">{candidate.role}</div></td>
                                                    <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center justify-center h-6 px-2.5 text-xs leading-5 font-semibold rounded-full ${getStatusColor(candidate.status)}`}>{candidate.status}</span></td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{candidate.recruiters?.username || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {candidate.recruiter_id === recruiter.id && (
                                                            <button onClick={() => setCandidateModal({ isOpen: true, candidate })} className="text-primary hover:text-primary/80"><PencilIcon className="w-4 h-4"/></button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-slate-500 text-lg">{recruiter.clients.length > 0 ? 'Select a client to view their candidates.' : 'There are no clients in the system yet.'}</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {candidateModal.isOpen && selectedClient && (() => {
                 const existingNumber = candidateModal.candidate?.whatsapp_number || '';
                 const detectedCountry = countries.find(c => existingNumber.startsWith(c.code));
                 const initialCountryCode = detectedCountry?.code || '+1';
                 const initialPhoneNumber = existingNumber.substring(initialCountryCode.length);

                return (
                    <Modal onClose={() => setCandidateModal({ isOpen: false, candidate: undefined })} title={candidateModal.candidate?.id ? 'Edit Candidate' : 'Add Candidate'}>
                        <form onSubmit={handleCandidateSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                                <input type="text" name="name" id="name" defaultValue={candidateModal.candidate?.name} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1.5">Role / Position</label>
                                <input type="text" name="role" id="role" defaultValue={candidateModal.candidate?.role} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                            </div>
                             <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                <input type="email" name="email" id="email" defaultValue={candidateModal.candidate?.email || ''} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                            </div>
                             <div>
                                <label htmlFor="whatsapp_number" className="block text-sm font-medium text-slate-700 mb-1.5">WhatsApp Number</label>
                                <div className="flex">
                                    <select name="country_code" defaultValue={initialCountryCode} className="px-3 border border-r-0 rounded-l-lg focus:ring-2 focus:ring-primary text-slate-900">
                                        {countries.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                                    </select>
                                    <input type="tel" name="whatsapp_number" id="whatsapp_number" defaultValue={initialPhoneNumber} required className="w-full px-4 py-2.5 border rounded-r-lg focus:ring-2 focus:ring-primary" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="resume_link" className="block text-sm font-medium text-slate-700 mb-1.5">Resume Link (URL)</label>
                                <input type="url" name="resume_link" id="resume_link" defaultValue={candidateModal.candidate?.resume_link} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label htmlFor="recording_link" className="block text-sm font-medium text-slate-700 mb-1.5">Recording Link (URL)</label>
                                <input type="url" name="recording_link" id="recording_link" defaultValue={candidateModal.candidate?.recording_link || ''} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="active_hours" className="block text-sm font-medium text-slate-700 mb-1.5">Active Hours</label>
                                    <input type="number" step="0.01" name="active_hours" id="active_hours" defaultValue={candidateModal.candidate?.active_hours || 0} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <label htmlFor="number_of_sets" className="block text-sm font-medium text-slate-700 mb-1.5">Number of Sets</label>
                                    <input type="number" name="number_of_sets" id="number_of_sets" defaultValue={candidateModal.candidate?.number_of_sets || 0} required className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setCandidateModal({ isOpen: false, candidate: undefined })} className="bg-slate-100 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:shadow-md">Save Candidate</button>
                            </div>
                        </form>
                    </Modal>
                )
            })()}
        </>
    );
};

export default RecruiterDashboard;
