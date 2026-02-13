import React, { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import CalendarIcon from './icons/CalendarIcon';
import ClockIcon from './icons/ClockIcon';
import DollarSignIcon from './icons/DollarSignIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import PaymentModal from './PaymentModal';
import TrashIcon from './icons/TrashIcon';

// Helper function to convert HH:MM:SS format to minutes
const parseTimeToMinutes = (timeValue: any): number => {
    if (typeof timeValue === 'number') {
        return Math.max(0, timeValue);
    }
    if (typeof timeValue === 'string') {
        const parts = timeValue.split(':');
        if (parts.length === 3) {
            const hours = Math.max(0, parseInt(parts[0], 10) || 0);
            const minutes = Math.max(0, parseInt(parts[1], 10) || 0);
            const seconds = Math.max(0, parseInt(parts[2], 10) || 0);
            return hours * 60 + minutes + Math.round(seconds / 60);
        }
    }
    return 0;
};

// Helper function to safely parse dates
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

const ClientPaymentSummary: React.FC = () => {
    const { workRecords, currentClient, markRecordsAsPaid } = useApp();
    const [period, setPeriod] = useState<'day' | 'week' | 'biweekly' | 'month'>('month');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPaidHistory, setShowPaidHistory] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Get current client's employee IDs
    const clientEmployeeIds = useMemo(() => {
        if (!currentClient || !currentClient.candidates) return new Set<string>();
        return new Set(currentClient.candidates.map(c => c.id).filter(Boolean));
    }, [currentClient]);

    // Filter entries based on selected period and payment_status (pending or paid)
    const filteredEntries = useMemo(() => {
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

        const filtered = workRecords.filter((record) => {
            // Filter by payment_status: paid or not paid
            const paymentStatus = record.payment_status ?? 'pending';
            const statusMatch = showPaidHistory
                ? paymentStatus === 'paid'
                : paymentStatus !== 'paid'; // NOT paid (pending or unpaid)
            if (!statusMatch) return false;
            // Date range filter
            const recordDate = safeParseDate(record.date);
            if (!(recordDate >= startDate && recordDate <= endDate)) return false;
            // Only include records for this client's employees
            if (!clientEmployeeIds.has(record.employeeId)) return false;
            return true;
        });
        return filtered;
    }, [workRecords, period, selectedDate, currentClient, showPaidHistory, clientEmployeeIds]);

    // Calculate totals from sf_work_records
    const summaryData = useMemo(() => {
        console.log('[Summary] Calculating totals for', filteredEntries.length, 'entries');
        
        const totalTalkTimeMinutes = filteredEntries.reduce((sum, record) => sum + parseTimeToMinutes(record.talkTime), 0);
        const totalWaitTimeMinutes = filteredEntries.reduce((sum, record) => sum + parseTimeToMinutes(record.waitTime), 0);
        const totalBreaksMinutes = filteredEntries.reduce((sum, record) => sum + parseTimeToMinutes(record.breakMinutes), 0);
        const totalMeetingsMinutes = filteredEntries.reduce((sum, record) => sum + parseTimeToMinutes(record.meetingMinutes), 0);
        const totalSets = filteredEntries.reduce((sum, record) => sum + (Number(record.setsAdded) || 0), 0);
        
        // Calculate total: (talkTime + waitTime + breaks + meetings) * rate + (sets * 20)
        const total = filteredEntries.reduce((sum, record) => {
            const talkHours = minutesToHours(parseTimeToMinutes(record.talkTime));
            const waitHours = minutesToHours(parseTimeToMinutes(record.waitTime));
            const breakHours = minutesToHours(parseTimeToMinutes(record.breakMinutes));
            const meetingHours = minutesToHours(parseTimeToMinutes(record.meetingMinutes));
            const rate = Number(record.ratePerHour) || 0;
            const sets = Number(record.setsAdded) || 0;
            const recordTotal = ((talkHours + waitHours + breakHours + meetingHours) * rate) + (sets * 20);
            if (filteredEntries.length < 5) {
                console.log('[Summary] Record calc:', { rate, talkHours, waitHours, breakHours, meetingHours, sets, recordTotal });
            }
            return sum + recordTotal;
        }, 0);

        // Get moes_total from records
        const moes_total = filteredEntries.reduce((sum, record) => sum + (Number((record as any).moes_total) || 0), 0);
        
        // Combined total = total + moes_total
        const last_total = total + moes_total;

        console.log('[Summary] Totals:', { total, moes_total, last_total, recordCount: filteredEntries.length });

        return {
            totalTalkTime: formatMinutesAsTime(totalTalkTimeMinutes),
            totalWaitTime: formatMinutesAsTime(totalWaitTimeMinutes),
            totalBreaks: formatMinutesAsTime(totalBreaksMinutes),
            totalMeetings: formatMinutesAsTime(totalMeetingsMinutes),
            totalSets,
            total,
            moes_total,
            last_total,
            periodLabel: `${period.charAt(0).toUpperCase() + period.slice(1)} - ${new Date(selectedDate).toLocaleDateString()}`,
            recordCount: filteredEntries.length,
        };
    }, [filteredEntries, selectedDate, period]);

    // Create payment stats from the summary data
    const paymentStats = useMemo(() => {
        return {
            total: summaryData.total,
            moes_total: summaryData.moes_total,
            last_total: summaryData.last_total,
        };
    }, [summaryData]);

    const handlePaymentSubmit = async (amount: number) => {
        if (summaryData.recordCount === 0) {
            alert('No records found for this period');
            return;
        }
        setIsProcessing(false);
    };

    const handleClearPayment = async () => {
        if (!currentClient) return;
        setIsProcessing(false);
    };

    const handleMarkAsPaid = async () => {
        if (filteredEntries.length === 0) {
            alert('No pending records found for this period');
            return;
        }

        try {
            setIsProcessing(true);
            const recordIds = filteredEntries.map(record => record.id);
            console.log(`[Payment] Marking ${recordIds.length} records as paid:`, recordIds);
            await markRecordsAsPaid(recordIds);
            
            // Show success message
            setSuccessMessage('Payment confirmed. Records have been archived.');
            
            // Auto-hide success message after 5 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 5000);
        } catch (error) {
            console.error('Error marking records as paid:', error);
            alert('Failed to mark records as paid: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Success Message */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 flex items-center gap-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">{successMessage}</span>
                </div>
            )}

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
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm text-slate-600 font-medium mb-2">Date:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        {/* Show Paid History Toggle */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="showPaidHistory"
                                checked={showPaidHistory}
                                onChange={(e) => setShowPaidHistory(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <label htmlFor="showPaidHistory" className="text-sm text-slate-600 font-medium cursor-pointer">
                                Show Paid History
                            </label>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-slate-500 mt-4">
                    {showPaidHistory 
                        ? `Selected period: ${summaryData.periodLabel} (PAID RECORDS)` 
                        : `Selected period: ${summaryData.periodLabel}`}
                </p>
            </div>

            {/* Summary Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${showPaidHistory ? 'opacity-80 bg-slate-100' : ''}`} style={showPaidHistory ? { position: 'relative' } : {}}>
                {/* PAID Watermark */}
                {showPaidHistory && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                        pointerEvents: 'none',
                        opacity: 0.15,
                        fontSize: '5rem',
                        fontWeight: 'bold',
                        color: '#64748b',
                        textShadow: '2px 2px 8px #fff',
                    }}>
                        PAID
                    </div>
                )}
                {/* Total Talk Time */}
                <div className={`rounded-xl shadow-lg p-6 ${showPaidHistory ? 'bg-slate-200 text-slate-700' : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Total Talk Time</h3>
                        <ClockIcon className="w-6 h-6 opacity-70" />
                    </div>
                    <p className="text-3xl font-bold font-mono">{summaryData.totalTalkTime}</p>
                    <p className="text-xs opacity-75 mt-2">Billable hours</p>
                </div>

                {/* Total Wait Time */}
                <div className={`rounded-xl shadow-lg p-6 ${showPaidHistory ? 'bg-slate-200 text-slate-700' : 'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Total Wait Time</h3>
                        <ClockIcon className="w-6 h-6 opacity-70" />
                    </div>
                    <p className="text-3xl font-bold font-mono">{summaryData.totalWaitTime}</p>
                    <p className="text-xs opacity-75 mt-2">Active wait hours</p>
                </div>

                {/* Break Time */}
                <div className={`rounded-xl shadow-lg p-6 ${showPaidHistory ? 'bg-slate-200 text-slate-700' : 'bg-gradient-to-br from-green-400 to-green-600 text-white'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Break Time</h3>
                        <span className="text-2xl">☕</span>
                    </div>
                    <p className="text-3xl font-bold font-mono">{summaryData.totalBreaks}</p>
                    <p className="text-xs opacity-75 mt-2">Total break hours</p>
                </div>

                {/* Total Sets */}
                <div className={`rounded-xl shadow-lg p-6 ${showPaidHistory ? 'bg-slate-200 text-slate-700' : 'bg-gradient-to-br from-purple-400 to-purple-600 text-white'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Total Sets</h3>
                        <TrendingUpIcon className="w-6 h-6 opacity-70" />
                    </div>
                    <p className="text-3xl font-bold">{summaryData.totalSets}</p>
                    <p className="text-xs opacity-75 mt-2">Total sets completed</p>
                </div>
            </div>

            {/* Payment Totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Amount */}
                <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Total</h3>
                        <DollarSignIcon className="w-6 h-6 opacity-70" />
                    </div>
                    <p className="text-3xl font-bold">${paymentStats.total.toFixed(2)}</p>
                    <p className="text-xs opacity-75 mt-2">Talk + Wait time billing</p>
                </div>

                {/* Moes Total */}
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Moes Total</h3>
                        <DollarSignIcon className="w-6 h-6 opacity-70" />
                    </div>
                    <p className="text-3xl font-bold">${paymentStats.moes_total.toFixed(2)}</p>
                    <p className="text-xs opacity-75 mt-2">Moes earnings</p>
                </div>

                {/* Last Total (Combined) */}
                <div className={`${showPaidHistory ? 'bg-slate-400 text-white' : 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'} rounded-xl shadow-lg p-6`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium opacity-90">Last Total</h3>
                        <DollarSignIcon className="w-6 h-6 opacity-70" />
                    </div>
                    <p className="text-3xl font-bold">${paymentStats.last_total.toFixed(2)}</p>
                    <p className="text-xs opacity-75 mt-2">
                        {showPaidHistory ? 'Total Already Paid' : 'Total + Moes Total'}
                    </p>
                </div>
            </div>

            {/* Payment Summary */}
            {summaryData.recordCount > 0 && !showPaidHistory && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-bold text-primary mb-4">Payment Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-700 font-semibold">Total Amount:</span>
                            <span className="text-2xl font-bold text-cyan-600">${paymentStats.total.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-700 font-semibold">Moes Total:</span>
                            <span className="text-2xl font-bold text-orange-600">${paymentStats.moes_total.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-700 font-bold">Last Total:</span>
                            <span className="text-2xl font-bold text-emerald-600">${paymentStats.last_total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-300">
                        <p className="text-sm text-slate-700"><span className="font-semibold">Records in Period:</span> {summaryData.recordCount}</p>
                    </div>
                    {/* Mark as Paid Button */}
                    <button
                        onClick={handleMarkAsPaid}
                        disabled={isProcessing}
                        className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg"
                    >
                        {isProcessing ? 'Processing...' : '✓ Confirm & Mark as Paid'}
                    </button>
                </div>
            )}

            {/* Payment Summary - Paid History View */}
            {summaryData.recordCount > 0 && showPaidHistory && (
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl shadow-lg p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-700 mb-4">Paid History</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-700 font-semibold">Total Amount:</span>
                            <span className="text-2xl font-bold text-cyan-600">${paymentStats.total.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-700 font-semibold">Moes Total:</span>
                            <span className="text-2xl font-bold text-orange-600">${paymentStats.moes_total.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-700 font-bold">Last Total:</span>
                            <span className="text-2xl font-bold text-emerald-600">${paymentStats.last_total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-slate-100 rounded-lg border border-slate-300">
                        <p className="text-sm text-slate-700"><span className="font-semibold">Paid Records in Period:</span> {summaryData.recordCount}</p>
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

export default ClientPaymentSummary;
