import React, { useState } from 'react';
import { Candidate, CandidateStatus } from '../types';
import WhatsAppIcon from './icons/WhatsAppIcon';
import FileTextIcon from './icons/FileTextIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import StarIcon from './icons/StarIcon';
import PlayCircleIcon from './icons/PlayCircleIcon';
import MailIcon from './icons/MailIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';

interface CandidateCardProps {
    candidate: Candidate;
    onFeedbackClick: (candidate: Candidate) => void;
    clientName: string;
    onQuickApprove: (candidate: Candidate) => void;
}

const getStatusColorClasses = (status: string) => {
    switch (status) {
        case 'Texted': return { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' };
        case 'Good': return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
        case 'Interview': return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' };
        case 'Interviewed': return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' };
        case 'Rejected': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
        case 'Probation': return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
        case 'Training': return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' };
        default: return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' };
    }
};

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onFeedbackClick, clientName, onQuickApprove }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { bg, text, border } = getStatusColorClasses(candidate.status);
    
    const getWhatsAppLink = (number: string) => {
        const cleanedNumber = number.replace(/[^0-9+]/g, '');
        const message = `Hey ${candidate.alias || candidate.name}`;
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${cleanedNumber}?text=${encodedMessage}`;
    };
    
    const formatDate = (dateString: string) => {
        // FIX: Corrected typo from toLocaleDateDateString to toLocaleDateString.
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-slate-200/80">
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                        <img className="h-12 w-12 rounded-full" src={`https://ui-avatars.com/api/?name=${(candidate.alias || candidate.name).replace(' ', '+')}&background=random`} alt="" />
                        <div>
                            <h3 className="text-lg font-bold text-primary">{candidate.alias || candidate.name}</h3>
                            <p className="text-sm text-slate-600">{candidate.role}</p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center justify-center h-6 px-2.5 text-xs leading-5 font-semibold rounded-full border ${bg} ${text} ${border}`}>
                        {candidate.status}
                    </span>
                </div>
                <div className="flex items-center mt-4 text-sm text-slate-500">
                    <p>Added: {formatDate(candidate.created_at)}</p>
                </div>
                
                 {candidate.rating > 0 && (
                    <div className="flex items-center mt-3">
                        {[...Array(5)].map((_, i) => <StarIcon key={i} isFilled={i < candidate.rating} className="w-5 h-5 text-yellow-400" />)}
                    </div>
                 )}


                <div className="mt-5 border-t border-slate-200 pt-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => onQuickApprove(candidate)} title="Mark as Good" className={`p-2 rounded-full transition-colors ${candidate.status === CandidateStatus.Good ? 'text-blue-500 bg-blue-100 hover:bg-blue-200' : 'text-slate-400 hover:bg-slate-100'}`}>
                            <ThumbsUpIcon isFilled={candidate.status === CandidateStatus.Good} className="w-5 h-5" />
                        </button>
                        <button onClick={() => onFeedbackClick(candidate)} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                            Give Feedback
                        </button>
                    </div>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center text-sm text-slate-500 hover:text-primary">
                        Details
                        <ChevronDownIcon className={`w-5 h-5 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
            
            {isExpanded && (
                <div className="p-5 bg-parchment/30 border-t border-slate-200 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        {candidate.show_phone_to_client && (
                            <>
                                <a href={getWhatsAppLink(candidate.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-green-600 font-medium hover:text-green-800 transition-colors">
                                    <WhatsAppIcon className="w-5 h-5" />
                                    <span>WhatsApp</span>
                                </a>
                                {candidate.email && (
                                    <a href={`mailto:${candidate.email}`} className="flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-800 transition-colors">
                                        <MailIcon className="w-5 h-5" />
                                        <span>Email</span>
                                    </a>
                                )}
                            </>
                        )}
                         <a href={candidate.resume_link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-slate-600 font-medium hover:text-primary transition-colors">
                            <FileTextIcon className="w-5 h-5" />
                            <span>Resume</span>
                        </a>
                        {candidate.recording_link && (
                             <a href={candidate.recording_link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-purple-600 font-medium hover:text-purple-800 transition-colors">
                                <PlayCircleIcon className="w-5 h-5" />
                                <span>Recording</span>
                            </a>
                        )}
                    </div>
                    {candidate.comments && (
                        <div className="mt-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Notes</h4>
                            <p className="mt-2 text-sm text-slate-700 bg-white p-3 rounded-md border border-slate-200">{candidate.comments}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CandidateCard;