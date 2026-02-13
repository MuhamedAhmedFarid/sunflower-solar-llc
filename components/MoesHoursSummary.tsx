import React, { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { WorkRecord } from '../types';
import CalendarIcon from './icons/CalendarIcon';
import ClockIcon from './icons/ClockIcon';
import DollarSignIcon from './icons/DollarSignIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';

// Helper function to convert HH:MM:SS format to minutes
const parseTimeToMinutes = (timeValue: any): number => {
    if (typeof timeValue === 'number') {
        return timeValue;
    }
    if (typeof timeValue === 'string') {
        const parts = timeValue.split(':');
        if (parts.length === 3) {
            const hours = parseInt(parts[0], 10) || 0;
            const minutes = parseInt(parts[1], 10) || 0;
            const seconds = parseInt(parts[2], 10) || 0;
            return hours * 60 + minutes + Math.round(seconds / 60);
        }
    }
    return 0;
};

// Helper function to convert minutes to hours (decimal)
const minutesToHours = (minutes: number): number => {
    return minutes / 60;
};

// Helper function to format minutes as HH:MM
const formatMinutesAsTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const MoesHoursSummary: React.FC = () => {
    const { workRecords } = useApp();
    const [period, setPeriod] = useState<'day' | 'week' | 'biweekly' | 'month'>('month');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Filter entries based on selected period
    const filteredEntries = useMemo(() => {
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
                const dayOfWeek = selected.getDay();
                startDate = new Date(selected);
                startDate.setDate(selected.getDate() - dayOfWeek);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'biweekly':
                const dayOfWeekBi = selected.getDay();
                const weekStart = new Date(selected);
                weekStart.setDate(selected.getDate() - dayOfWeekBi);
                const weekNumber = Math.floor(weekStart.getDate() / 14);
                startDate = new Date(selected.getFullYear(), selected.getMonth(), 1 + weekNumber * 14);
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

        return workRecords.filter((record: WorkRecord) => {
            const recordDate = new Date(record.date);
            return recordDate >= startDate && recordDate <= endDate;
        });
    }, [workRecords, period, selectedDate]);

    // Calculate totals for Moe's (hours * 2)
    const summaryData = useMemo(() => {
        const totalTalkTimeMinutes = filteredEntries.reduce((sum: number, record: WorkRecord) => sum + parseTimeToMinutes(record.talkTime), 0);
        const totalWaitTimeMinutes = filteredEntries.reduce((sum: number, record: WorkRecord) => sum + parseTimeToMinutes(record.waitTime), 0);
        const totalBreaksMinutes = filteredEntries.reduce((sum: number, record: WorkRecord) => sum + parseTimeToMinutes(record.breakMinutes), 0);
        const totalMeetingsMinutes = filteredEntries.reduce((sum: number, record: WorkRecord) => sum + parseTimeToMinutes(record.meetingMinutes), 0);
        const totalSets = filteredEntries.reduce((sum: number, record: WorkRecord) => sum + (record.setsAdded || 0), 0);
        
        const totalTalkTimeHours = minutesToHours(totalTalkTimeMinutes);
        const totalWaitTimeHours = minutesToHours(totalWaitTimeMinutes);
        const totalBreaksHours = minutesToHours(totalBreaksMinutes);
        const totalMeetingsHours = minutesToHours(totalMeetingsMinutes);
        
        // Total billable hours (talk + wait + breaks + meetings)
        const totalBillableHours = totalTalkTimeHours + totalWaitTimeHours + totalBreaksHours + totalMeetingsHours;
        
        // Moe's total = billable hours * 2 + sets * $5
        const moesTotal = (totalBillableHours * 2) + (totalSets * 5);

        return {
            totalTalkTime: formatMinutesAsTime(totalTalkTimeMinutes),
            totalWaitTime: formatMinutesAsTime(totalWaitTimeMinutes),
            totalBreaks: formatMinutesAsTime(totalBreaksMinutes),
            totalMeetings: formatMinutesAsTime(totalMeetingsMinutes),
            totalBillableHours,
            moesTotal,
            totalSets,
            periodLabel: `${period.charAt(0).toUpperCase() + period.slice(1)} - ${new Date(selectedDate).toLocaleDateString()}`,
            recordCount: filteredEntries.length,
        };
    }, [filteredEntries, selectedDate, period]);

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-600 font-medium">Period:</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {(['day', 'week', 'biweekly', 'month'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                        period === p
                                            ? 'bg-primary text-white shadow-lg'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 font-medium mb-2">Date:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>
                <p className="text-sm text-slate-500 mt-4">Selected period: {summaryData.periodLabel}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Talk Time */}
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Total Talk Time</h3>
                        <ClockIcon className="w-6 h-6 opacity-70" />
                    </div>
                    <p className="text-3xl font-bold font-mono">{summaryData.totalTalkTime}</p>
                    <p className="text-xs opacity-75 mt-2">Billable hours</p>
                </div>

                {/* Total Wait Time */}
                <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Total Wait Time</h3>
                        <ClockIcon className="w-6 h-6 opacity-70" />
                    </div>
                    <p className="text-3xl font-bold font-mono">{summaryData.totalWaitTime}</p>
                    <p className="text-xs opacity-75 mt-2">Active wait hours</p>
                </div>

                {/* Total Billable Hours */}
                <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Total Billable Hours</h3>
                        <TrendingUpIcon className="w-6 h-6 opacity-70" />
                    </div>
                    <p className="text-3xl font-bold">{summaryData.totalBillableHours.toFixed(2)}h</p>
                    <p className="text-xs opacity-75 mt-2">Talk + Wait + Breaks + Meetings</p>
                </div>

                {/* Total Sets */}
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Total Sets</h3>
                        <span className="text-2xl">🎯</span>
                    </div>
                    <p className="text-3xl font-bold">{summaryData.totalSets}</p>
                    <p className="text-xs opacity-75 mt-2">${summaryData.totalSets * 5}.00 earned</p>
                </div>
            </div>

            {/* Time Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Breaks */}
                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Break Time</h3>
                        <span className="text-2xl">☕</span>
                    </div>
                    <p className="text-3xl font-bold font-mono">{summaryData.totalBreaks}</p>
                    <p className="text-xs opacity-75 mt-2">Total break hours</p>
                </div>

                {/* Meetings */}
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Meeting Time</h3>
                        <span className="text-2xl">📞</span>
                    </div>
                    <p className="text-3xl font-bold font-mono">{summaryData.totalMeetings}</p>
                    <p className="text-xs opacity-75 mt-2">Total meeting hours</p>
                </div>
            </div>

            {/* Moe's Total */}
            {summaryData.recordCount > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-lg p-8 border border-emerald-200">
                    <h3 className="text-lg font-bold text-primary mb-4">Moe's Hours Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col justify-center">
                            <p className="text-sm text-slate-700 font-semibold mb-2">Total Billable Hours</p>
                            <p className="text-4xl font-bold text-emerald-600">{summaryData.totalBillableHours.toFixed(2)}h</p>
                            <p className="text-xs text-slate-600 mt-2">Talk + Wait + Breaks + Meetings</p>
                        </div>
                        <div className="flex flex-col justify-center p-4 bg-white rounded-lg border border-emerald-200">
                            <p className="text-sm text-slate-700 font-semibold mb-2">Moe's Total (Hours × 2 + Sets × $5)</p>
                            <p className="text-4xl font-bold text-emerald-600">${summaryData.moesTotal.toFixed(2)}</p>
                            <p className="text-xs text-slate-600 mt-2">
                                ({summaryData.totalBillableHours.toFixed(2)}h × $2) + ({summaryData.totalSets} sets × $5)
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-emerald-100 rounded-lg border border-emerald-300">
                        <p className="text-xs text-slate-700"><span className="font-semibold">Records in Period:</span> {summaryData.recordCount}</p>
                    </div>
                </div>
            )}

            {summaryData.recordCount === 0 && (
                <div className="bg-slate-50 rounded-xl p-6 border-2 border-dashed border-slate-300 text-center">
                    <h3 className="text-lg font-bold text-primary mb-1">No Records Found</h3>
                    <p className="text-slate-600">There are no work records for the selected period.</p>
                </div>
            )}
        </div>
    );
};

export default MoesHoursSummary;
