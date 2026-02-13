import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import Toast from './Toast';
import { Candidate } from '../types';
import ClockIcon from './icons/ClockIcon';
import CalendarIcon from './icons/CalendarIcon';
import DollarSignIcon from './icons/DollarSignIcon';

const EmployeeHoursLog: React.FC = () => {
    const { clients, addHourLogEntry } = useApp();
    const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
    const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [hoursH, setHoursH] = useState<string>('00');
    const [hoursM, setHoursM] = useState<string>('00');
    const [hoursS, setHoursS] = useState<string>('00');
    const [rate, setRate] = useState<string>('');
    const [setsAdded, setSetsAdded] = useState<string>('0');
    const [breakTime, setBreakTime] = useState<string>('0');
    const [meetings, setMeetings] = useState<string>('0');
    const [balancePaid, setBalancePaid] = useState<string>('0');
    const [notes, setNotes] = useState<string>('');
    const [showToast, setShowToast] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get all candidates in Probation or Training status
    const candidatesInProbationOrTraining = useMemo(() => {
        return clients.flatMap(c => c.candidates)
            .filter(cand => ['Training', 'Probation'].includes(cand.status));
    }, [clients]);

    const selectedCandidate = useMemo(() => 
        candidatesInProbationOrTraining.find(c => c.id === selectedCandidateId),
        [selectedCandidateId, candidatesInProbationOrTraining]
    );

    // Load candidate data when selected
    useEffect(() => {
        if (selectedCandidate) {
            setRate(String(selectedCandidate.rate_per_hour || 0));
            setHoursH('00');
            setHoursM('00');
            setHoursS('00');
            setSetsAdded('0');
            setBalancePaid('0');
            setNotes('');
        }
    }, [selectedCandidate]);

    // Convert break/meetings to hours (30min=0.5, 45min=0.75, 1hour=1)
    const breakHours = useMemo(() => {
        const val = Number(breakTime) || 0;
        return val === 0.5 || val === 0.75 || val === 1 ? val : 0;
    }, [breakTime]);

    const meetingHours = useMemo(() => {
        const val = Number(meetings) || 0;
        return val === 0.5 || val === 0.75 || val === 1 ? val : 0;
    }, [meetings]);

    // Parse H, M, S into decimal hours
    const parseHMSDecimal = (h: string, m: string, s: string) => {
        const hh = parseInt(String(h).replace(/[^0-9]/g, ''), 10) || 0;
        const mm = parseInt(String(m).replace(/[^0-9]/g, ''), 10) || 0;
        const ss = parseInt(String(s).replace(/[^0-9]/g, ''), 10) || 0;
        const totalMinutes = hh * 60 + mm + ss / 60;
        return totalMinutes / 60;
    };

    const padTwo = (v: string) => {
        const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
        if (isNaN(n) || n < 0) return '00';
        return String(Math.max(0, n)).padStart(2, '0');
    };

    // Calculate new totals based on current candidate data and inputs (ensure numeric math)
    const calculatedActiveHours = useMemo(() => {
        if (!selectedCandidate) return 0;
        const current = Number(selectedCandidate.active_hours) || 0;
        const added = parseHMSDecimal(hoursH, hoursM, hoursS);
        const total = added + breakHours + meetingHours;
        return current + total;
    }, [selectedCandidate, hoursH, hoursM, hoursS, breakHours, meetingHours]);

    const calculatedSets = useMemo(() => {
        if (!selectedCandidate) return 0;
        const current = Number(selectedCandidate.number_of_sets) || 0;
        const added = Number(setsAdded) || 0;
        return current + added;
    }, [selectedCandidate, setsAdded]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!selectedCandidateId || !rate || !entryDate) {
            setShowToast('Please fill in all required fields.');
            setIsSubmitting(false);
            return;
        }

        const hoursAddedNum = parseHMSDecimal(hoursH, hoursM, hoursS);
        const ratePerHourNum = parseFloat(rate);
        const setsAddedNum = parseInt(setsAdded, 10) || 0;
        const balancePaidNum = parseFloat(balancePaid) || 0;
        const activeHoursNum = calculatedActiveHours;
        const numSetsNum = calculatedSets;

        if (isNaN(hoursAddedNum) || isNaN(ratePerHourNum) || !selectedCandidate) {
            setShowToast('Please fill in all required fields.');
            setIsSubmitting(false);
            return;
        }

        try {
            await addHourLogEntry({
                candidate_id: selectedCandidateId,
                hours_added: hoursAddedNum,
                rate_per_hour: ratePerHourNum,
                entry_date: new Date(entryDate).toISOString(),
                active_hours: activeHoursNum,
                number_of_sets: numSetsNum,
                sets_added: setsAddedNum,
                balance_paid: balancePaidNum,
                break_hours: breakHours,
                meetings_hours: meetingHours,
                notes: notes || null,
            }, activeHoursNum, numSetsNum);
            
            setShowToast('Hours logged successfully.');
            
            // Reset form but keep candidate selected
            setHoursH('00');
            setHoursM('00');
            setHoursS('00');
            setSetsAdded('0');
            setBreakTime('0');
            setMeetings('0');
            setBalancePaid('0');
            setNotes('');
        } catch (error: unknown) {
            console.error(error);
            const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : '';
            setShowToast(msg ? `Failed to log hours: ${msg}` : 'Failed to log hours.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                <main className="px-4 sm:px-6 lg:px-8 py-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-primary mb-2">Daily Hours Log</h2>
                                <p className="text-slate-600">For employees on Probation or Training</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Candidate Selection */}
                                <div>
                                    <label htmlFor="candidate_id" className="block text-sm font-medium text-slate-700 mb-2">
                                        <span className="flex items-center gap-2">
                                            <ClockIcon className="w-4 h-4" />
                                            Employee
                                        </span>
                                    </label>
                                    <select
                                        id="candidate_id"
                                        value={selectedCandidateId}
                                        onChange={(e) => setSelectedCandidateId(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary bg-white text-slate-900"
                                    >
                                        <option value="" disabled>Select employee</option>
                                        {candidatesInProbationOrTraining.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date */}
                                <div>
                                    <label htmlFor="entry_date" className="block text-sm font-medium text-slate-700 mb-2">
                                        <span className="flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4" />
                                            Date
                                        </span>
                                    </label>
                                    <input
                                        type="date"
                                        id="entry_date"
                                        value={entryDate}
                                        onChange={(e) => setEntryDate(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Hours and Rate */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="hours_added" className="block text-sm font-medium text-slate-700 mb-2">
                                            Hours Added
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                id="hours_h"
                                                value={hoursH}
                                                onChange={(e) => setHoursH(e.target.value.replace(/[^0-9]/g, ''))}
                                                onBlur={() => setHoursH(padTwo(hoursH))}
                                                className="w-16 px-2 py-2 border border-slate-300 rounded-lg text-center font-mono"
                                                aria-label="hours"
                                            />
                                            <span className="text-slate-700">:</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                id="hours_m"
                                                value={hoursM}
                                                onChange={(e) => setHoursM(e.target.value.replace(/[^0-9]/g, ''))}
                                                onBlur={() => setHoursM(padTwo(String(Math.min(parseInt(hoursM || '0', 10) || 0, 59))))}
                                                className="w-12 px-2 py-2 border border-slate-300 rounded-lg text-center font-mono"
                                                aria-label="minutes"
                                            />
                                            <span className="text-slate-700">:</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                id="hours_s"
                                                value={hoursS}
                                                onChange={(e) => setHoursS(e.target.value.replace(/[^0-9]/g, ''))}
                                                onBlur={() => setHoursS(padTwo(String(Math.min(parseInt(hoursS || '0', 10) || 0, 59))))}
                                                className="w-12 px-2 py-2 border border-slate-300 rounded-lg text-center font-mono"
                                                aria-label="seconds"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="rate_per_hour" className="block text-sm font-medium text-slate-700 mb-2">
                                            <span className="flex items-center gap-2">
                                                <DollarSignIcon className="w-4 h-4" />
                                                Rate per Hour ($)
                                            </span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            id="rate_per_hour"
                                            value={rate}
                                            onChange={(e) => setRate(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Sets Added */}
                                <div>
                                    <label htmlFor="sets_added" className="block text-sm font-medium text-slate-700 mb-2">
                                        Sets Added Today
                                    </label>
                                    <input
                                        type="number"
                                        id="sets_added"
                                        value={setsAdded}
                                        onChange={(e) => setSetsAdded(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        placeholder="0"
                                    />
                                </div>

                                {/* Break Time */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">Break Time</label>
                                    <div className="flex gap-4 flex-wrap">
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="break" value="0" checked={breakTime === '0'} onChange={(e) => setBreakTime(e.target.value)} className="w-4 h-4" />
                                            <span className="text-sm text-slate-700">None</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="break" value="0.5" checked={breakTime === '0.5'} onChange={(e) => setBreakTime(e.target.value)} className="w-4 h-4" />
                                            <span className="text-sm text-slate-700">30 min</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="break" value="0.75" checked={breakTime === '0.75'} onChange={(e) => setBreakTime(e.target.value)} className="w-4 h-4" />
                                            <span className="text-sm text-slate-700">45 min</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="break" value="1" checked={breakTime === '1'} onChange={(e) => setBreakTime(e.target.value)} className="w-4 h-4" />
                                            <span className="text-sm text-slate-700">1 hour</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Meetings */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">Meetings</label>
                                    <div className="flex gap-4 flex-wrap">
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="meetings" value="0" checked={meetings === '0'} onChange={(e) => setMeetings(e.target.value)} className="w-4 h-4" />
                                            <span className="text-sm text-slate-700">None</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="meetings" value="0.5" checked={meetings === '0.5'} onChange={(e) => setMeetings(e.target.value)} className="w-4 h-4" />
                                            <span className="text-sm text-slate-700">30 min</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="meetings" value="0.75" checked={meetings === '0.75'} onChange={(e) => setMeetings(e.target.value)} className="w-4 h-4" />
                                            <span className="text-sm text-slate-700">45 min</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="meetings" value="1" checked={meetings === '1'} onChange={(e) => setMeetings(e.target.value)} className="w-4 h-4" />
                                            <span className="text-sm text-slate-700">1 hour</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Total for this entry: (Hours + Break + Meetings) × Rate + Sets added today × $5 */}
                                <div className="p-4 bg-parchment/30 rounded-lg">
                                    <label className="block text-sm font-medium text-slate-600 mb-1">
                                        Total (this entry)
                                    </label>
                                    <p className="text-xl font-bold text-primary">
                                        ${((parseHMSDecimal(hoursH, hoursM, hoursS) + breakHours + meetingHours) * (Number(rate) || 0) + (Number(setsAdded) || 0) * 5).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">(Hours + Break + Meetings) × Rate per hour + Sets added today × $5</p>
                                </div>

                                {/* Cumulative after save */}
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Total sets (after save)</label>
                                    <p className="text-lg font-bold text-slate-800">{calculatedSets}</p>
                                </div>

                                {/* Balance Paid */}
                                <div>
                                    <label htmlFor="balance_paid" className="block text-sm font-medium text-slate-700 mb-2">
                                        <span className="flex items-center gap-2">
                                            <DollarSignIcon className="w-4 h-4" />
                                            Balance Paid ($)
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        id="balance_paid"
                                        value={balancePaid}
                                        onChange={(e) => setBalancePaid(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        placeholder="Add any notes..."
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-semibold hover:shadow-md transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Hours'}
                                    </button>
                                </div>
                            </form>

                            {/* Current Status Display */}
                            {selectedCandidate && (
                                <div className="mt-8 p-4 bg-parchment/30 rounded-lg border border-slate-200">
                                    <h3 className="text-lg font-semibold text-primary mb-3">Current Status</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-500">Name</p>
                                            <p className="font-semibold text-slate-800">{selectedCandidate.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Sets</p>
                                            <p className="font-semibold text-slate-800">{selectedCandidate.number_of_sets}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Rate</p>
                                            <p className="font-semibold text-slate-800">${selectedCandidate.rate_per_hour.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
            {showToast && <Toast message={showToast} onClose={() => setShowToast(null)} />}
        </>
    );
};

export default EmployeeHoursLog;
