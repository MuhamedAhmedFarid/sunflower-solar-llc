import React, { useState } from 'react';
import { Client, Candidate, CandidateStatus } from '../types';
import Header from './Header';
import CandidateCard from './CandidateCard';
import FeedbackDrawer from './FeedbackDrawer';
import Toast from './Toast';
import StarIcon from './icons/StarIcon';
import FileTextIcon from './icons/FileTextIcon';
import PlayCircleIcon from './icons/PlayCircleIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import MailIcon from './icons/MailIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import EmployeeWorkRecordsStats from './EmployeeWorkRecordsStats';
import ClientPaymentSummary from './ClientPaymentSummary';
import { useApp } from '../hooks/useApp';


interface ClientPortalProps {
    client: Client;
}

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

const ClientPortal: React.FC<ClientPortalProps> = ({ client }) => {
    const { updateCandidateFeedback } = useApp();
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'All' | CandidateStatus>('All');
    const [activeTab, setActiveTab] = useState<'candidates' | 'workRecords' | 'hoursSummary'>('candidates');

    const handleOpenFeedback = (candidate: Candidate) => {
        setSelectedCandidate(candidate);
        setIsDrawerOpen(true);
    };

    const handleCloseFeedback = () => {
        setIsDrawerOpen(false);
        setTimeout(() => setSelectedCandidate(null), 300);
    };

    const handleFeedbackSubmit = (message: string) => {
        handleCloseFeedback();
        setToastMessage(message);
    };

    const handleQuickApprove = async (candidate: Candidate) => {
        const isApproved = candidate.status === CandidateStatus.Good;
        const newStatus = isApproved ? CandidateStatus.Pending : CandidateStatus.Good;
        await updateCandidateFeedback(client.id, candidate.id, { status: newStatus });
        setToastMessage(`${candidate.alias || candidate.name} has been marked as '${newStatus === CandidateStatus.Good ? 'Good' : 'Pending'}'.`);
    };

    const getWhatsAppLink = (number: string, candidateName: string) => {
        const cleanedNumber = number.replace(/[^0-9+]/g, '');
        const message = `Hey ${candidateName}`;
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${cleanedNumber}?text=${encodedMessage}`;
    };

    const filterOptions: ('All' | CandidateStatus)[] = [
        'All',
        CandidateStatus.Pending,
        CandidateStatus.Texted,
        CandidateStatus.Good,
        CandidateStatus.Interviewed,
        CandidateStatus.Probation,
        CandidateStatus.Training,
        CandidateStatus.Rejected,
    ];

    const getCount = (status: 'All' | CandidateStatus) => {
        if (status === 'All') return client.candidates.length;
        return client.candidates.filter(c => c.status === status).length;
    };
    
    const filteredCandidates = client.candidates.filter(candidate => {
        if (activeFilter === 'All') return true;
        return candidate.status === activeFilter;
    });

    return (
        <>
            <Header title={`${client.name}'s Portal`} />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {/* Tab Navigation */}
                <div className="flex gap-4 mb-8 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('candidates')}
                        className={`px-4 py-3 font-semibold transition-colors ${
                            activeTab === 'candidates'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-slate-600 hover:text-primary'
                        }`}
                    >
                        Candidates
                    </button>
                    <button
                        onClick={() => setActiveTab('workRecords')}
                        className={`px-4 py-3 font-semibold transition-colors ${
                            activeTab === 'workRecords'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-slate-600 hover:text-primary'
                        }`}
                    >
                        Work Records Stats
                    </button>
                    <button
                        onClick={() => setActiveTab('hoursSummary')}
                        className={`px-4 py-3 font-semibold transition-colors ${
                            activeTab === 'hoursSummary'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-slate-600 hover:text-primary'
                        }`}
                    >
                        Payment Summary
                    </button>
                </div>

                {/* Candidates Tab */}
                {activeTab === 'candidates' && (
                    <>
                        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-slate-200/80">
                            <h2 className="text-2xl font-bold text-primary">Welcome to your Portal</h2>
                            <p className="text-slate-500 mt-1">Here are the qualified candidates for your review.</p>
                        </div>

                <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto pb-4 mb-6">
                    {filterOptions.map(option => {
                        const count = getCount(option);
                        // Don't render a filter button if there are no candidates with that status (except for 'All')
                        if (count === 0 && option !== 'All') return null;

                        return (
                            <button
                                key={option}
                                onClick={() => setActiveFilter(option)}
                                className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                                    activeFilter === option
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-white text-slate-600 hover:bg-parchment/60 hover:text-primary'
                                }`}
                            >
                                {option === CandidateStatus.Good && <ThumbsUpIcon className="w-4 h-4" />}
                                {option} 
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${activeFilter === option ? 'bg-white/20' : 'bg-slate-100'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {filteredCandidates.length > 0 ? (
                    <>
                        {/* Mobile View: Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:hidden animate-fade-in-up">
                            {filteredCandidates.map(candidate => (
                                <CandidateCard 
                                    key={candidate.id} 
                                    candidate={candidate} 
                                    onFeedbackClick={handleOpenFeedback} 
                                    clientName={client.name} 
                                    onQuickApprove={handleQuickApprove}
                                />
                            ))}
                        </div>

                        {/* Desktop View: Table */}
                        <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden animate-fade-in-up border border-slate-200/80">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-parchment/30">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Candidate</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Rating</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Links</th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-primary uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {filteredCandidates.map(candidate => (
                                        <tr key={candidate.id} className="hover:bg-parchment/40 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <img className="h-10 w-10 rounded-full" src={`https://ui-avatars.com/api/?name=${(candidate.alias || candidate.name).replace(' ', '+')}&background=random`} alt="" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-semibold text-primary">{candidate.alias || candidate.name}</div>
                                                        <div className="text-sm text-slate-500">{candidate.role}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center justify-center h-6 px-2.5 text-xs leading-5 font-semibold rounded-full ${getStatusColor(candidate.status)}`}>
                                                    {candidate.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                <div className="flex items-center">
                                                    {candidate.rating > 0 ? (
                                                        [...Array(5)].map((_, i) => <StarIcon key={i} isFilled={i < candidate.rating} className="w-5 h-5 text-yellow-400" />)
                                                    ) : (
                                                        <span className="text-slate-400">Not Rated</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <div className="flex items-center gap-3">
                                                    <a href={candidate.resume_link} target="_blank" rel="noopener noreferrer" className="hover:text-primary" title="Resume"><FileTextIcon className="w-5 h-5"/></a>
                                                    {candidate.recording_link && <a href={candidate.recording_link} target="_blank" rel="noopener noreferrer" className="hover:text-purple-500" title="Recording"><PlayCircleIcon className="w-5 h-5"/></a>}
                                                    {candidate.show_phone_to_client && (
                                                        <>
                                                            <a href={getWhatsAppLink(candidate.whatsapp_number, candidate.alias || candidate.name)} target="_blank" rel="noopener noreferrer" className="hover:text-green-500" title="WhatsApp"><WhatsAppIcon className="w-5 h-5"/></a>
                                                            {candidate.email && <a href={`mailto:${candidate.email}`} className="hover:text-blue-500" title="Email"><MailIcon className="w-5 h-5"/></a>}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-4">
                                                    <button onClick={() => handleQuickApprove(candidate)} title="Mark as Good" className={`p-2 rounded-full transition-colors ${candidate.status === CandidateStatus.Good ? 'text-blue-500 bg-blue-100 hover:bg-blue-200' : 'text-slate-400 hover:bg-slate-100'}`}>
                                                        <ThumbsUpIcon isFilled={candidate.status === CandidateStatus.Good} className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleOpenFeedback(candidate)} className="font-semibold text-primary hover:text-primary/80 transition-colors">
                                                        Update Feedback
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200/80 animate-fade-in">
                        <h3 className="text-lg font-semibold text-primary">No Candidates Found</h3>
                        <p className="text-slate-500 mt-1">There are no candidates with the status "{activeFilter}".</p>
                    </div>
                )}
                    </>
                )}

                {/* Work Records Tab */}
                {activeTab === 'workRecords' && (
                    <EmployeeWorkRecordsStats />
                )}

                {/* Hours Summary Tab */}
                {activeTab === 'hoursSummary' && (
                    <ClientPaymentSummary />
                )}
            </main>
            {selectedCandidate && (
                <FeedbackDrawer
                    isOpen={isDrawerOpen}
                    onClose={handleCloseFeedback}
                    candidate={selectedCandidate}
                    clientId={client.id}
                    onFeedbackSubmit={handleFeedbackSubmit}
                />
            )}
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        </>
    );
};

export default ClientPortal;