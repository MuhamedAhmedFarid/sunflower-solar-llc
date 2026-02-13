import React, { useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import TrendingUpIcon from './icons/TrendingUpIcon';
import DollarSignIcon from './icons/DollarSignIcon';
import ClockIcon from './icons/ClockIcon';
import UsersIcon from './icons/UsersIcon';

// Helper function to convert HH:MM:SS format to minutes
const parseTimeToMinutes = (timeValue: any): number => {
    if (typeof timeValue === 'number') {
        return timeValue;
    }
    
    if (typeof timeValue === 'string') {
        // Handle HH:MM:SS format
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

// Helper function to format minutes as HH:MM
const formatMinutesAsTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};


import { useState } from 'react';

const EmployeeWorkRecordsStats: React.FC = () => {
    const { workRecords, currentClient, markRecordsAsPaid } = useApp();
    // Payment processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Period and date state for filtering
    const [period, setPeriod] = useState<'day' | 'week' | 'biweekly' | 'month'>('month');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Create a mapping of employee ID to candidate alias/name
    const employeeNameMap = useMemo(() => {
        const map = new Map<string, string>();
        if (currentClient) {
            currentClient.candidates.forEach(candidate => {
                map.set(candidate.id, candidate.alias || candidate.name);
            });
        }
        return map;
    }, [currentClient]);

    // Get client employee IDs and filter records to only this client's employees
    const clientEmployeeIds = useMemo(() => {
        if (!currentClient) return new Set<string>();
        return new Set(currentClient.candidates.map(c => c.id));
    }, [currentClient]);


    // Helper to parse date safely
    const safeParseDate = (dateValue: any): Date => {
        if (!dateValue) return new Date();
        if (typeof dateValue === 'string') {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return new Date();
            return date;
        }
        if (dateValue instanceof Date) return dateValue;
        return new Date();
    };


    // Show Paid History toggle
    const [showPaidHistory, setShowPaidHistory] = useState(false);

    // Filter records by client, payment_status, and period (pending or paid)
    const filteredRecords = useMemo(() => {
        if (!currentClient || workRecords.length === 0) return [];

        const selected = safeParseDate(selectedDate);
        let startDate: Date;
        let endDate: Date = new Date(selected);
        endDate.setHours(23, 59, 59, 999);

        switch (period) {
            case 'day':
                startDate = new Date(selected);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week': {
                const dayOfWeek = selected.getDay();
                startDate = new Date(selected);
                startDate.setDate(selected.getDate() - dayOfWeek);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            }
            case 'biweekly': {
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
            }
            case 'month':
            default:
                startDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(selected.getFullYear(), selected.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
        }

        const filtered = workRecords.filter(record => {
            // Only include records for this client's employees
            if (!clientEmployeeIds.has(record.employeeId)) return false;
            // Filter by payment_status: pending or paid
            const paymentStatus = record.payment_status ?? 'pending';
            const statusMatch = showPaidHistory ? paymentStatus === 'paid' : paymentStatus === 'pending';
            if (!statusMatch) return false;
            // Date range filter
            const recordDate = safeParseDate(record.date);
            return recordDate >= startDate && recordDate <= endDate;
        });
        // Debug log
        console.log('[EmployeeWorkRecordsStats] Filtered', filtered.length, 'records', {
            period,
            selectedDate,
            showPaidHistory,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            clientEmployeeIds: Array.from(clientEmployeeIds),
            firstRecords: filtered.slice(0, 3)
        });
        return filtered;
    }, [workRecords, clientEmployeeIds, period, selectedDate, currentClient, showPaidHistory]);

    const stats = useMemo(() => {
        // Group records by employee
        const byEmployee = new Map<string, typeof filteredRecords>();
        filteredRecords.forEach(record => {
            const key = record.employeeId;
            if (!byEmployee.has(key)) byEmployee.set(key, []);
            byEmployee.get(key)!.push(record);
        });

        // Calculate totals
        const totalTalkTime = filteredRecords.reduce((sum, r) => sum + parseTimeToMinutes(r.talkTime), 0);
        const totalWaitTime = filteredRecords.reduce((sum, r) => sum + parseTimeToMinutes(r.waitTime), 0);
        const totalBreaks = filteredRecords.reduce((sum, r) => sum + parseTimeToMinutes(r.breakMinutes), 0);
        const totalMeetings = filteredRecords.reduce((sum, r) => sum + parseTimeToMinutes(r.meetingMinutes), 0);
        const totalSets = filteredRecords.reduce((sum, r) => sum + (Number(r.setsAdded) || 0), 0);
        
        // Calculate total earnings
        const totalEarnings = filteredRecords.reduce((sum, r) => {
            const talkHours = parseTimeToMinutes(r.talkTime) / 60;
            const waitHours = parseTimeToMinutes(r.waitTime) / 60;
            const breakHours = parseTimeToMinutes(r.breakMinutes) / 60;
            const meetingHours = parseTimeToMinutes(r.meetingMinutes) / 60;
            const hours = talkHours + waitHours + breakHours + meetingHours;
            const rate = Number(r.ratePerHour) || 0;
            const sets = Number(r.setsAdded) || 0;
            return sum + (hours * rate + sets * 20);
        }, 0);

        // By employee stats
        const byEmployeeStats = Array.from(byEmployee.entries()).map(([employeeId, records]) => {
            const talkTime = records.reduce((s, r) => s + parseTimeToMinutes(r.talkTime), 0);
            const waitTime = records.reduce((s, r) => s + parseTimeToMinutes(r.waitTime), 0);
            const breakMinutes = records.reduce((s, r) => s + parseTimeToMinutes(r.breakMinutes), 0);
            const meetingMinutes = records.reduce((s, r) => s + parseTimeToMinutes(r.meetingMinutes), 0);
            const sets = records.reduce((s, r) => s + (Number(r.setsAdded) || 0), 0);
            
            // Average rate (if multiple rates, take the last one)
            const rate = records.length > 0 ? Number(records[records.length - 1].ratePerHour) || 0 : 0;
            
            const talkHours = talkTime / 60;
            const waitHours = waitTime / 60;
            const breakHours = breakMinutes / 60;
            const meetingHours = meetingMinutes / 60;
            const hours = talkHours + waitHours + breakHours + meetingHours;
            const earnings = (hours * rate) + (sets * 20);
            const name = employeeNameMap.get(employeeId) || `Employee ${employeeId}`;
            
            return {
                employeeId,
                name,
                talkTime,
                waitTime,
                breakMinutes,
                meetingMinutes,
                sets,
                rate,
                hours,
                earnings,
                entries: records.length,
            };
        });

        // Top performers
        const topByEarnings = [...byEmployeeStats].sort((a, b) => b.earnings - a.earnings).slice(0, 3);
        const topByHours = [...byEmployeeStats].sort((a, b) => b.hours - a.hours).slice(0, 3);

        return {
            totalTalkTime,
            totalWaitTime,
            totalBreaks,
            totalMeetings,
            totalSets,
            totalEarnings,
            totalEmployees: byEmployee.size,
            totalRecords: filteredRecords.length,
            byEmployeeStats,
            topByEarnings,
            topByHours,
        };
    }, [filteredRecords, employeeNameMap]);

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];


    // Period/date selector UI
    const periodOptions: Array<'day' | 'week' | 'biweekly' | 'month'> = ['day', 'week', 'biweekly', 'month'];

    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
            <main className="px-4 sm:px-6 lg:px-8 py-8">
                {/* Period Selector */}
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-slate-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Period:</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {periodOptions.map(p => (
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
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm text-slate-600 font-medium mb-2">Date:</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            {/* Show Paid History Toggle */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="showPaidHistory"
                                    checked={showPaidHistory}
                                    onChange={e => setShowPaidHistory(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                />
                                <label htmlFor="showPaidHistory" className="text-sm text-slate-600 font-medium cursor-pointer">
                                    Show Paid History
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                {filteredRecords.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200/80 animate-fade-in">
                        <h3 className="text-lg font-semibold text-primary">No Work Records Available</h3>
                        <p className="text-slate-500 mt-1">Work records will appear here once employees log their activities.</p>
                    </div>
                ) : (
                    <>
                        {/* Success Message */}
                        {successMessage && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 flex items-center gap-3 mb-4">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">{successMessage}</span>
                            </div>
                        )}
                        {/* Mark as Paid Button (only for unpaid view) */}
                        {!showPaidHistory && filteredRecords.length > 0 && (
                            <button
                                onClick={async () => {
                                    if (!window.confirm('Are you sure you want to confirm payment and mark all these records as paid?')) {
                                        return;
                                    }
                                    setIsProcessing(true);
                                    try {
                                        const recordIds = filteredRecords.map(record => record.id);
                                        await markRecordsAsPaid(recordIds);
                                        setSuccessMessage('Payment confirmed. Records have been archived.');
                                        setTimeout(() => setSuccessMessage(null), 5000);
                                    } catch (error) {
                                        alert('Failed to mark records as paid: ' + (error instanceof Error ? error.message : 'Unknown error'));
                                    } finally {
                                        setIsProcessing(false);
                                    }
                                }}
                                disabled={isProcessing}
                                className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg"
                            >
                                {isProcessing ? 'Processing...' : '✓ Confirm & Mark as Paid'}
                            </button>
                        )}
                        {/* ...existing code... */}
                        {/* Summary Section */}
                        {/* Main Charts Section */}
                        {/* Time Breakdown Pie Chart */}
                        {/* Top Performers */}
                        {/* Detailed Tables */}
                    </>
                )}
            </main>
        </div>
    );

    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
            <main className="px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-slate-200/80">
                    <h2 className="text-2xl font-bold text-primary">Work Records Summary</h2>
                    <p className="text-slate-500 mt-1">Total amount you owe to your employees for work completed</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Total Work Hours</p>
                            <p className="text-2xl font-bold text-primary mt-1">{((stats.totalTalkTime + stats.totalWaitTime) / 60).toFixed(1)}h</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Total Amount Owed</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">${stats.totalEarnings.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Active Employees</p>
                            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.totalEmployees}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Work Records</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalRecords}</p>
                        </div>
                    </div>
                </div>

                {/* Main Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Earnings Distribution Bar Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
                        <h2 className="text-xl font-bold text-primary mb-6">Earnings by Employee</h2>
                        <div className="space-y-4">
                            {stats.byEmployeeStats.map((employee, idx) => (
                                <div key={employee.employeeId} className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-slate-700">{employee.name}</span>
                                        <span className="text-sm font-bold text-green-600">${employee.earnings.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{
                                                width: `${(employee.earnings / Math.max(...stats.byEmployeeStats.map(c => c.earnings))) * 100}%`,
                                                backgroundColor: colors[idx % colors.length],
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hours Distribution */}
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <h2 className="text-xl font-bold text-primary mb-6">Hours by Employee</h2>
                        <div className="space-y-4">
                            {stats.byEmployeeStats.map((employee, idx) => (
                                <div key={employee.employeeId} className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-slate-700">{employee.name}</span>
                                        <span className="text-sm font-bold text-blue-600">{employee.hours.toFixed(1)}h</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{
                                                width: `${(employee.hours / Math.max(...stats.byEmployeeStats.map(c => c.hours))) * 100}%`,
                                                backgroundColor: '#3b82f6',
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium opacity-90">Average per Employee</h3>
                                <UsersIcon className="w-5 h-5 opacity-70" />
                            </div>
                            <p className="text-2xl font-bold">${(stats.totalEarnings / stats.totalEmployees).toFixed(2)}</p>
                            <p className="text-xs opacity-75 mt-1">avg earnings</p>
                        </div>

                        <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium opacity-90">Total Wait Time</h3>
                                <ClockIcon className="w-5 h-5 opacity-70" />
                            </div>
                            <p className="text-2xl font-bold font-mono">{formatMinutesAsTime(stats.totalWaitTime)}</p>
                            <p className="text-xs opacity-75 mt-1">{(stats.totalWaitTime / 60).toFixed(2)}h hours</p>
                        </div>

                        <div className="bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium opacity-90">Records Logged</h3>
                                <TrendingUpIcon className="w-5 h-5 opacity-70" />
                            </div>
                            <p className="text-2xl font-bold">{stats.totalRecords}</p>
                            <p className="text-xs opacity-75 mt-1">{(stats.totalRecords / stats.totalEmployees).toFixed(1)} avg per employee</p>
                        </div>
                    </div>
                </div>

                {/* Time Breakdown Pie Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Time Breakdown */}
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
                        <h2 className="text-xl font-bold text-primary mb-6">Time Breakdown</h2>
                        <div className="flex items-center justify-center">
                            <svg width="200" height="200" viewBox="0 0 200 200">
                                {/* Talk Time */}
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="80"
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="40"
                                    strokeDasharray={`${(stats.totalTalkTime / (stats.totalTalkTime + stats.totalBreaks + stats.totalMeetings)) * 502.65} 502.65`}
                                    strokeDashoffset="0"
                                    transform="rotate(-90 100 100)"
                                />
                                {/* Break Minutes */}
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="80"
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="40"
                                    strokeDasharray={`${(stats.totalBreaks / (stats.totalTalkTime + stats.totalBreaks + stats.totalMeetings)) * 502.65} 502.65`}
                                    strokeDashoffset={`${-(stats.totalTalkTime / (stats.totalTalkTime + stats.totalBreaks + stats.totalMeetings)) * 502.65}`}
                                    transform="rotate(-90 100 100)"
                                />
                                {/* Meeting Minutes */}
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="80"
                                    fill="none"
                                    stroke="#a855f7"
                                    strokeWidth="40"
                                    strokeDasharray={`${(stats.totalMeetings / (stats.totalTalkTime + stats.totalBreaks + stats.totalMeetings)) * 502.65} 502.65`}
                                    strokeDashoffset={`${-((stats.totalTalkTime + stats.totalBreaks) / (stats.totalTalkTime + stats.totalBreaks + stats.totalMeetings)) * 502.65}`}
                                    transform="rotate(-90 100 100)"
                                />
                            </svg>
                        </div>
                        <div className="flex justify-center gap-6 mt-6 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-slate-600">Talk: {(stats.totalTalkTime / 60).toFixed(1)}h</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-slate-600">Breaks: {(stats.totalBreaks / 60).toFixed(1)}h</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                <span className="text-sm text-slate-600">Meetings: {(stats.totalMeetings / 60).toFixed(1)}h</span>
                            </div>
                        </div>
                    </div>

                    {/* Earnings Distribution */}
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
                        <h2 className="text-xl font-bold text-primary mb-6">Top 5 Earnings Distribution</h2>
                        <div className="flex items-center justify-center">
                            <svg width="200" height="200" viewBox="0 0 200 200">
                                {stats.topByEarnings.slice(0, 5).map((employee, idx) => {
                                    const total = stats.topByEarnings.slice(0, 5).reduce((s, c) => s + c.earnings, 0);
                                    const percentage = (employee.earnings / total) * 100;
                                    const circumference = 502.65;
                                    const strokeDash = (percentage / 100) * circumference;
                                    const previousOffset = stats.topByEarnings.slice(0, idx).reduce((s, c) => s + ((c.earnings / total) * circumference), 0);
                                    const pieColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];
                                    
                                    return (
                                        <circle
                                            key={employee.employeeId}
                                            cx="100"
                                            cy="100"
                                            r="80"
                                            fill="none"
                                            stroke={pieColors[idx % pieColors.length]}
                                            strokeWidth="40"
                                            strokeDasharray={`${strokeDash} ${circumference}`}
                                            strokeDashoffset={-previousOffset}
                                            transform="rotate(-90 100 100)"
                                        />
                                    );
                                })}
                            </svg>
                        </div>
                        <div className="mt-6 space-y-2">
                            {stats.topByEarnings.slice(0, 5).map((employee, idx) => {
                                const total = stats.topByEarnings.slice(0, 5).reduce((s, c) => s + c.earnings, 0);
                                const percentage = ((employee.earnings / total) * 100).toFixed(1);
                                const pieColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];
                                
                                return (
                                    <div key={employee.employeeId} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }}></div>
                                            <span className="text-slate-600">{employee.name}</span>
                                        </div>
                                        <span className="font-semibold text-slate-800">{percentage}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Top Performers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Top by Earnings */}
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                        <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                            <TrendingUpIcon className="w-6 h-6" />
                            Highest Payment Obligations
                        </h2>
                        <div className="space-y-4">
                            {stats.topByEarnings.map((employee, idx) => (
                                <div key={employee.employeeId} className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: colors[idx % colors.length] }}>
                                                {idx + 1}
                                            </div>
                                            <span className="font-medium text-slate-800">{employee.name}</span>
                                        </div>
                                        <span className="font-bold text-red-600">${employee.earnings.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{
                                                width: `${(employee.earnings / Math.max(...stats.topByEarnings.map(c => c.earnings))) * 100}%`,
                                                backgroundColor: colors[idx % colors.length],
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top by Hours */}
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                        <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                            <ClockIcon className="w-6 h-6" />
                            Most Active
                        </h2>
                        <div className="space-y-4">
                            {stats.topByHours.map((employee, idx) => (
                                <div key={employee.employeeId} className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: colors[(idx + 3) % colors.length] }}>
                                                {idx + 1}
                                            </div>
                                            <span className="font-medium text-slate-800">{employee.name}</span>
                                        </div>
                                        <span className="font-bold text-blue-600">{employee.hours.toFixed(2)}h</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{
                                                width: `${(employee.hours / Math.max(...stats.topByHours.map(c => c.hours))) * 100}%`,
                                                backgroundColor: colors[(idx + 3) % colors.length],
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Detailed Tables */}
                <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in" style={{ animationDelay: '0.55s' }}>
                    <h2 className="text-xl font-bold text-primary mb-6">Employee Work Details</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-parchment/30">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Employee</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Talk Time</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Wait Time</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Breaks</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Meetings</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Sets</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">Rate</th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-primary uppercase tracking-wider">Earnings</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {stats.byEmployeeStats.map(employee => (
                                    <tr key={employee.employeeId} className="hover:bg-parchment/40 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-semibold text-primary">{employee.name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                                            {formatMinutesAsTime(employee.talkTime || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                                            {formatMinutesAsTime(employee.waitTime || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                                            {formatMinutesAsTime(employee.breakMinutes || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                                            {formatMinutesAsTime(employee.meetingMinutes || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {employee.sets || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            ${(employee.rate || 0).toFixed(2)}/h
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                                            ${(employee.earnings || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EmployeeWorkRecordsStats;
