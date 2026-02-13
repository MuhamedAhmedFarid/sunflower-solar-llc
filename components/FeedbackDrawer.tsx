import React, { useState, useEffect } from 'react';
import { Candidate, CandidateStatus } from '../types';
import { useApp } from '../hooks/useApp';
import StarIcon from './icons/StarIcon';
import XIcon from './icons/XIcon';
import ThumbsUpIcon from './icons/ThumbsUpIcon';
import ThumbsDownIcon from './icons/ThumbsDownIcon';
import MessageCircleIcon from './icons/MessageCircleIcon';
import UserCheckIcon from './icons/UserCheckIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import AwardIcon from './icons/AwardIcon';


interface FeedbackDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  clientId: string;
  onFeedbackSubmit: (message: string) => void;
}

const FeedbackDrawer: React.FC<FeedbackDrawerProps> = ({ isOpen, onClose, candidate, clientId, onFeedbackSubmit }) => {
  const [rating, setRating] = useState(candidate.rating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState(candidate.comments);
  const [status, setStatus] = useState<CandidateStatus>(candidate.status);
  const { updateCandidateFeedback } = useApp();

  const isApproved = status === CandidateStatus.Good;

  useEffect(() => {
    setRating(candidate.rating);
    setComments(candidate.comments);
    setStatus(candidate.status);
  }, [candidate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCandidateFeedback(clientId, candidate.id, {
        status,
        rating,
        comments,
    });
    onFeedbackSubmit("Feedback submitted successfully!");
  };

  const handleQuickApprove = async () => {
      const newStatus = isApproved ? CandidateStatus.Pending : CandidateStatus.Good;
      setStatus(newStatus);
      await updateCandidateFeedback(clientId, candidate.id, { status: newStatus });
  };

  const StatusButton: React.FC<{ value: CandidateStatus; label: string; icon: React.ReactNode; }> = ({ value, label, icon }) => {
    const isActive = status === value;
    let activeClasses = '';
    switch (value) {
        case CandidateStatus.Texted: activeClasses = 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 border-teal-500'; break;
        case CandidateStatus.Good: activeClasses = 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 border-blue-500'; break;
        case CandidateStatus.Interviewed: activeClasses = 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 border-orange-500'; break;
        case CandidateStatus.Rejected: activeClasses = 'bg-red-500 text-white shadow-lg shadow-red-500/30 border-red-500'; break;
        case CandidateStatus.Training: activeClasses = 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 border-purple-500'; break;
        case CandidateStatus.Probation: activeClasses = 'bg-green-500 text-white shadow-lg shadow-green-500/30 border-green-500'; break;
        default: activeClasses = 'bg-slate-800 text-white';
    }
    const inactiveClasses = 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300';
    return (
      <button
        type="button"
        onClick={() => setStatus(value)}
        className={`flex-grow flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${isActive ? activeClasses : inactiveClasses}`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-70 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-drawer-title"
        className={`fixed top-0 right-0 h-full bg-white w-full max-w-md shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-start p-6 border-b border-slate-200">
                <div className="flex-1">
                    <h2 id="feedback-drawer-title" className="text-xl font-bold text-primary">Feedback for {candidate.alias || candidate.name}</h2>
                    <p className="text-sm text-slate-500">{candidate.role}</p>
                </div>
                <div className="flex items-center space-x-2">
                     <button onClick={handleQuickApprove} title="Mark as Good" className={`p-2 rounded-full transition-colors ${isApproved ? 'text-blue-500 bg-blue-100 hover:bg-blue-200' : 'text-slate-400 hover:bg-slate-100'}`}>
                        <ThumbsUpIcon isFilled={isApproved} className="w-6 h-6" />
                    </button>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Update Status</label>
                    <div className="flex flex-wrap gap-3">
                        <StatusButton value={CandidateStatus.Good} label="Good" icon={<ThumbsUpIcon className="w-4 h-4" />} />
                        <StatusButton value={CandidateStatus.Texted} label="Texted" icon={<MessageCircleIcon className="w-4 h-4" />} />
                        <StatusButton value={CandidateStatus.Interviewed} label="Interviewed" icon={<UserCheckIcon className="w-4 h-4" />} />
                        <StatusButton value={CandidateStatus.Training} label="Training" icon={<BookOpenIcon className="w-4 h-4" />} />
                        <StatusButton value={CandidateStatus.Probation} label="Probation" icon={<AwardIcon className="w-4 h-4" />} />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200">
                         <StatusButton value={CandidateStatus.Rejected} label="Reject" icon={<ThumbsDownIcon className="w-4 h-4" />} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Rating</label>
                    <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                type="button"
                                key={star}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="text-slate-300 data-[active=true]:text-yellow-400 hover:text-yellow-300 transition-transform transform hover:scale-125 focus:outline-none"
                                aria-label={`Rate ${star} star`}
                                data-active={(hoverRating || rating) >= star}
                            >
                                <StarIcon isFilled={(hoverRating || rating) >= star} className="w-8 h-8"/>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="comments" className="block text-sm font-medium text-slate-700">Comments for Admin</label>
                    <textarea
                        id="comments"
                        rows={5}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="mt-2 block w-full rounded-lg border-slate-300 bg-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="e.g., Great portfolio, let's schedule a call."
                    />
                </div>
            </form>

            <div className="p-6 border-t border-slate-200 bg-white sticky bottom-0">
                 <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
                >
                    Submit Feedback
                </button>
            </div>
        </div>
      </div>
    </>
  );
};

export default FeedbackDrawer;