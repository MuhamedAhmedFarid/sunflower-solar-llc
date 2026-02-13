import React, { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { HourLogEntry } from '../types';
import CalendarIcon from './icons/CalendarIcon';
import ClockIcon from './icons/ClockIcon';
import DollarSignIcon from './icons/DollarSignIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';

const HoursSummary: React.FC = () => {
    const { hourLogEntries, clients } = useApp();
    const [period, setPeriod] = useState<'day' | 'week' | 'biweekly' | 'month'>('day');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Filter entries based on selected period
    const filteredEntries = useMemo(() => {
        const now = new Date();
        const selected = new Date(selectedDate);
        
        let startDate: Date;
        let endDate: Date = new Date(selected);
        endDate.setHours(23, 59, 59, 999);

        switch (period) {
            case 'day':
                startDate = new Date(selected);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                // Get start of week (Sunday)
                const dayOfWeek = selected.getDay();
                startDate = new Date(selected);
                startDate.setDate(selected.getDate() - dayOfWeek);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'biweekly':
                // Get start of biweekly (14 day period starting from Sunday)
                const dayOfWeekBi = selected.getDay();
                const weekStart = new Date(selected);
                weekStart.setDate(selected.getDate() - dayOfWeekBi);
                const weekNumber = Math.floor((selected.getDate() - dayOfWeekBi) / 14);
                startDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
                startDate.setDate(1 + weekNumber * 14 - selected.getDay());
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 13);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                startDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
        }

        return hourLogEntries.filter(entry => {
            const entryDate = new Date(entry.entry_date);
            return entryDate >= startDate && entryDate <= endDate;
        });
    }, [hourLogEntries, period, selectedDate]);

    // Calculate totals
    const totals = useMemo(() => {
        const totalHours = filteredEntries.reduce((sum, entry) => sum + (Number(entry.hours_added) || 0), 0);
        const totalBreak = filteredEntries.reduce((sum, entry) => sum + (Number((entry as any).break_hours ?? 0) || 0), 0);
        const totalMeetings = filteredEntries.reduce((sum, entry) => sum + (Number((entry as any).meetings_hours ?? 0) || 0), 0);
        const totalActiveHours = filteredEntries.reduce((sum, entry) => sum + (Number(entry.active_hours) || 0), 0);
        const totalSets = filteredEntries.reduce((sum, entry) => sum + (Number(entry.number_of_sets) || 0), 0);
        const totalBalancePaid = filteredEntries.reduce((sum, entry) => sum + (Number(entry.balance_paid) || 0), 0);
        
        // Total payment: ((hours_added + break_hours + meetings_hours) * rate_per_hour) + (sets_added * 5) per entry
        const totalPayment = filteredEntries.reduce((sum, entry) => {
            const hours = Number(entry.hours_added) || 0;
            const breakHrs = Number((entry as any).break_hours ?? 0) || 0;
            const meetingHrs = Number((entry as any).meetings_hours ?? 0) || 0;
            const totalEntryHours = hours + breakHrs + meetingHrs;
            const rate = Number(entry.rate_per_hour) || 0;
            const sets = Number(entry.sets_added ?? 0) || 0;
            const entryPayment = (totalEntryHours * rate) + (sets * 20);
            return sum + entryPayment;
        }, 0);

        // Calculate by candidate
        const byCandidate = filteredEntries.reduce((acc, entry) => {
            const candidateId = entry.candidate_id;
            const candidateName = entry.candidates?.name || 'Unknown';
            
            if (!acc[candidateId]) {
                acc[candidateId] = {
                    name: candidateName,
                    hours: 0,
                    breakHours: 0,
                    meetingsHours: 0,
                    activeHours: 0,
                    sets: 0,
                    balancePaid: 0,
                    payment: 0,
                };
            }
            
            acc[candidateId].hours += Number(entry.hours_added) || 0;
            acc[candidateId].breakHours += Number((entry as any).break_hours ?? 0) || 0;
            acc[candidateId].meetingsHours += Number((entry as any).meetings_hours ?? 0) || 0;
            acc[candidateId].activeHours += Number(entry.active_hours) || 0;
            acc[candidateId].sets += Number(entry.number_of_sets) || 0;
            acc[candidateId].balancePaid += Number(entry.balance_paid) || 0;
            const hours = Number(entry.hours_added) || 0;
            const breakHrs = Number((entry as any).break_hours ?? 0) || 0;
            const meetingHrs = Number((entry as any).meetings_hours ?? 0) || 0;
            const totalEntryHours = hours + breakHrs + meetingHrs;
            const rate = Number(entry.rate_per_hour) || 0;
            const sets = Number(entry.sets_added ?? 0) || 0;
            acc[candidateId].payment += (totalEntryHours * rate) + (sets * 20);
            
            return acc;
        }, {} as Record<string, {
            name: string;
            hours: number;
            breakHours: number;
            meetingsHours: number;
            activeHours: number;
            sets: number;
            balancePaid: number;
            payment: number;
        }>);

        return {
            totalHours,
            totalBreak,
            totalMeetings,
            totalActiveHours,
            totalSets,
            totalBalancePaid,
            totalPayment,
            byCandidate: Object.values(byCandidate),
        };
    }, [filteredEntries]);

    const getPeriodLabel = () => {
        const date = new Date(selectedDate);
        switch (period) {
            case 'day':
                return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            case 'week':
                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() - date.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return `${startOfWeek.toLocaleDateString('en-US')} - ${endOfWeek.toLocaleDateString('en-US')}`;
            case 'biweekly':
                const dayOfWeekBi = date.getDay();
                const biweekStart = new Date(date);
                biweekStart.setDate(date.getDate() - dayOfWeekBi);
                const weekNumberBi = Math.floor((date.getDate() - dayOfWeekBi) / 14);
                const biweekStartDate = new Date(date.getFullYear(), date.getMonth(), 1);
                biweekStartDate.setDate(1 + weekNumberBi * 14 - date.getDay());
                const biweekEndDate = new Date(biweekStartDate);
                biweekEndDate.setDate(biweekStartDate.getDate() + 13);
                return `${biweekStartDate.toLocaleDateString('en-US')} - ${biweekEndDate.toLocaleDateString('en-US')}`;
            case 'month':
                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        }
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
            <main className="px-4 sm:px-6 lg:px-8 py-8">
                {/* Period Selection */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-slate-700">Period:</label>
                            <div className="flex gap-2">
                                {(['day', 'week', 'biweekly', 'month'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p as any)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                            period === p
                                                ? 'bg-primary text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                    >
                                        {p === 'day' ? 'Daily' : p === 'week' ? 'Weekly' : p === 'biweekly' ? 'Biweekly' : 'Monthly'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-slate-500" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-slate-600">
                        <span className="font-semibold">Selected period:</span> {getPeriodLabel()}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <ClockIcon className="w-6 h-6 text-primary" />
                            <h3 className="text-sm font-medium text-slate-600">Total Hours</h3>
                        </div>
                        <p className="text-2xl font-bold text-primary">{totals.totalHours.toFixed(2)}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">☕</span>
                            <h3 className="text-sm font-medium text-slate-600">Breaks & Meetings</h3>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{(totals.totalBreak + totals.totalMeetings).toFixed(2)}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">📊</span>
                            <h3 className="text-sm font-medium text-slate-600">Sets</h3>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{totals.totalSets}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSignIcon className="w-6 h-6 text-purple-500" />
                            <h3 className="text-sm font-medium text-slate-600">Balance Paid</h3>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">${totals.totalBalancePaid.toFixed(2)}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSignIcon className="w-6 h-6 text-orange-500" />
                            <h3 className="text-sm font-medium text-slate-600">Total Payment</h3>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">${totals.totalPayment.toFixed(2)}</p>
                    </div>

                    <div className={`bg-white rounded-xl shadow-lg p-6 ${totals.totalPayment - totals.totalBalancePaid > 0 ? 'border-2 border-yellow-200' : 'border-2 border-green-200'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{totals.totalPayment - totals.totalBalancePaid > 0 ? '⚠️' : '✓'}</span>
                            <h3 className="text-sm font-medium text-slate-700">Remaining to Collect</h3>
                        </div>
                        <p className={`text-2xl font-bold ${totals.totalPayment - totals.totalBalancePaid > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                            ${(totals.totalPayment - totals.totalBalancePaid).toFixed(2)}
                        </p>
                        <p className="text-xs opacity-75 mt-2">Total payment minus amounts already recorded</p>
                    </div>
                </div>

                {/* By Candidate Breakdown */}
                {totals.byCandidate.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-primary mb-4">Details by Employee</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-parchment/30">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">Hours Added</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">Sets</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">Balance Paid</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">Total Payment</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {totals.byCandidate.map((candidate, idx) => (
                                        <tr key={idx} className="hover:bg-parchment/40 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{candidate.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{candidate.hours.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{candidate.sets}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${candidate.balancePaid.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">${candidate.payment.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {filteredEntries.length === 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <p className="text-slate-500 text-lg">No data for the selected period.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HoursSummary;
