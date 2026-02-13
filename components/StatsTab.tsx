import React, { useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import TrendingUpIcon from './icons/TrendingUpIcon';
import DollarSignIcon from './icons/DollarSignIcon';
import ClockIcon from './icons/ClockIcon';
import UsersIcon from './icons/UsersIcon';

const StatsTab: React.FC = () => {
    const { hourLogEntries, clients } = useApp();

    const stats = useMemo(() => {
        const candidates = clients.flatMap(c => c.candidates).filter(cand => ['Training', 'Probation'].includes(cand.status));
        
        // Total calculations
        const totalHours = hourLogEntries.reduce((sum, e) => sum + (Number(e.hours_added) || 0), 0);
        const totalBreaks = hourLogEntries.reduce((sum, e) => sum + (Number((e as any).break_hours ?? 0) || 0), 0);
        const totalMeetings = hourLogEntries.reduce((sum, e) => sum + (Number((e as any).meetings_hours ?? 0) || 0), 0);
        const totalSets = hourLogEntries.reduce((sum, e) => sum + (Number(e.sets_added ?? 0) || 0), 0);
        const totalPayment = hourLogEntries.reduce((sum, e) => {
            const h = Number(e.hours_added) || 0;
            const b = Number((e as any).break_hours ?? 0) || 0;
            const m = Number((e as any).meetings_hours ?? 0) || 0;
            const r = Number(e.rate_per_hour) || 0;
            const s = Number(e.sets_added ?? 0) || 0;
            return sum + ((h + b + m) * r + s * 5);
        }, 0);

        const totalBalancePaid = hourLogEntries.reduce((sum, e) => sum + (Number(e.balance_paid) || 0), 0);
        const remainingToCollect = Math.max(0, totalPayment - totalBalancePaid);

        // By candidate stats
        const byCandidateStats = candidates.map(candidate => {
            const entries = hourLogEntries.filter(e => e.candidate_id === candidate.id);
            const hours = entries.reduce((s, e) => s + (Number(e.hours_added) || 0), 0);
            const breaks = entries.reduce((s, e) => s + (Number((e as any).break_hours ?? 0) || 0), 0);
            const meetings = entries.reduce((s, e) => s + (Number((e as any).meetings_hours ?? 0) || 0), 0);
            const sets = entries.reduce((s, e) => s + (Number(e.sets_added ?? 0) || 0), 0);
            const payment = entries.reduce((s, e) => {
                const h = Number(e.hours_added) || 0;
                const b = Number((e as any).break_hours ?? 0) || 0;
                const m = Number((e as any).meetings_hours ?? 0) || 0;
                const r = Number(e.rate_per_hour) || 0;
                const se = Number(e.sets_added ?? 0) || 0;
                return s + ((h + b + m) * r + se * 5);
            }, 0);
            return {
                name: candidate.name,
                hours,
                breaks,
                meetings,
                sets,
                payment,
                entries: entries.length,
                rate: Number(candidate.rate_per_hour || 0),
            };
        });

        // Top performers
        const topByPayment = [...byCandidateStats].sort((a, b) => b.payment - a.payment).slice(0, 3);
        const topByHours = [...byCandidateStats].sort((a, b) => (b.hours + b.breaks + b.meetings) - (a.hours + a.breaks + a.meetings)).slice(0, 3);

        return {
            totalHours,
            totalBreaks,
            totalMeetings,
            totalSets,
            totalPayment,
            totalCandidates: candidates.length,
            totalEntries: hourLogEntries.length,
            byCandidateStats,
            topByPayment,
            topByHours,
        };
    }, [hourLogEntries, clients]);

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
            <main className="px-4 sm:px-6 lg:px-8 py-8">
                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Total Hours */}
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium opacity-90">Total Hours</h3>
                            <ClockIcon className="w-6 h-6 opacity-70" />
                        </div>
                        <p className="text-3xl font-bold">{(stats.totalHours + stats.totalBreaks + stats.totalMeetings).toFixed(2)}</p>
                        <p className="text-xs opacity-75 mt-2">{stats.totalHours.toFixed(1)} work + {(stats.totalBreaks + stats.totalMeetings).toFixed(1)} breaks/meetings</p>
                    </div>

                    {/* Total Payment */}
                    <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium opacity-90">Total Payment</h3>
                            <DollarSignIcon className="w-6 h-6 opacity-70" />
                        </div>
                        <p className="text-3xl font-bold">${stats.totalPayment.toFixed(2)}</p>
                        <p className="text-xs opacity-75 mt-2">Across all employees</p>
                    </div>

                    {/* Total Sets */}
                    <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium opacity-90">Total Sets</h3>
                            <span className="text-2xl">📊</span>
                        </div>
                        <p className="text-3xl font-bold">{stats.totalSets}</p>
                        <p className="text-xs opacity-75 mt-2">{(stats.totalSets * 20).toFixed(2)} earned from sets</p>
                    </div>

                    {/* Total Employees */}
                    <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium opacity-90">Total Employees</h3>
                            <UsersIcon className="w-6 h-6 opacity-70" />
                        </div>
                        <p className="text-3xl font-bold">{stats.totalCandidates}</p>
                        <p className="text-xs opacity-75 mt-2">{stats.totalEntries} entries logged</p>
                    </div>
                </div>

                    {/* Payment Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSignIcon className="w-6 h-6 text-purple-500" />
                                <h3 className="text-sm font-medium text-slate-600">Balance Paid</h3>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">${totalBalancePaid.toFixed(2)}</p>
                            <p className="text-xs opacity-75 mt-2">Amount already paid to candidates</p>
                        </div>

                        <div className={`bg-white rounded-xl shadow-lg p-6 ${remainingToCollect > 0 ? 'border-2 border-yellow-200' : 'border-2 border-green-200'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{remainingToCollect > 0 ? '⚠️' : '✓'}</span>
                                <h3 className="text-sm font-medium text-slate-700">Remaining to Collect</h3>
                            </div>
                            <p className={`text-2xl font-bold ${remainingToCollect > 0 ? 'text-yellow-600' : 'text-green-600'}`}>${remainingToCollect.toFixed(2)}</p>
                            <p className="text-xs opacity-75 mt-2">Total payment minus amounts already recorded</p>
                        </div>
                    </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Payment by Employee Bar Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
                        <h2 className="text-xl font-bold text-primary mb-6">Payment by Employee</h2>
                        <div className="space-y-4">
                            {stats.byCandidateStats.sort((a, b) => b.payment - a.payment).slice(0, 8).map((candidate, idx) => {
                                const maxPayment = Math.max(...stats.byCandidateStats.map(c => c.payment));
                                const barWidth = (candidate.payment / maxPayment) * 100;
                                const gradients = [
                                    'from-blue-400 to-blue-600',
                                    'from-purple-400 to-purple-600',
                                    'from-pink-400 to-pink-600',
                                    'from-green-400 to-green-600',
                                    'from-orange-400 to-orange-600',
                                    'from-indigo-400 to-indigo-600',
                                    'from-cyan-400 to-cyan-600',
                                    'from-red-400 to-red-600',
                                ];
                                return (
                                    <div key={candidate.name}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-slate-700">{candidate.name}</span>
                                            <span className="text-sm font-bold text-green-600">${candidate.payment.toFixed(2)}</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${gradients[idx % gradients.length]} shadow-lg`}
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hours Worked by Employee */}
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                        <h2 className="text-xl font-bold text-primary mb-6">Hours Worked by Employee</h2>
                        <div className="space-y-4">
                            {stats.byCandidateStats.sort((a, b) => (b.hours + b.breaks + b.meetings) - (a.hours + a.breaks + a.meetings)).slice(0, 8).map((candidate, idx) => {
                                const totalTime = candidate.hours + candidate.breaks + candidate.meetings;
                                const maxTime = Math.max(...stats.byCandidateStats.map(c => c.hours + c.breaks + c.meetings));
                                const barWidth = (totalTime / maxTime) * 100;
                                const gradients = [
                                    'from-blue-400 to-blue-600',
                                    'from-purple-400 to-purple-600',
                                    'from-pink-400 to-pink-600',
                                    'from-green-400 to-green-600',
                                    'from-orange-400 to-orange-600',
                                    'from-indigo-400 to-indigo-600',
                                    'from-cyan-400 to-cyan-600',
                                    'from-red-400 to-red-600',
                                ];
                                return (
                                    <div key={candidate.name}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-slate-700">{candidate.name}</span>
                                            <span className="text-sm font-bold text-blue-600">{totalTime.toFixed(2)}h</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${gradients[idx % gradients.length]} shadow-lg`}
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Pie Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Hours Breakdown Pie Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in" style={{ animationDelay: '0.45s' }}>
                        <h2 className="text-xl font-bold text-primary mb-6">Hours Breakdown</h2>
                        <div className="flex items-center justify-center">
                            <svg width="200" height="200" viewBox="0 0 200 200">
                                {/* Work Hours */}
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="80"
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="40"
                                    strokeDasharray={`${(stats.totalHours / (stats.totalHours + stats.totalBreaks + stats.totalMeetings)) * 502.65} 502.65`}
                                    strokeDashoffset="0"
                                    transform="rotate(-90 100 100)"
                                />
                                {/* Break Hours */}
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="80"
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="40"
                                    strokeDasharray={`${(stats.totalBreaks / (stats.totalHours + stats.totalBreaks + stats.totalMeetings)) * 502.65} 502.65`}
                                    strokeDashoffset={`${-(stats.totalHours / (stats.totalHours + stats.totalBreaks + stats.totalMeetings)) * 502.65}`}
                                    transform="rotate(-90 100 100)"
                                />
                                {/* Meeting Hours */}
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="80"
                                    fill="none"
                                    stroke="#a855f7"
                                    strokeWidth="40"
                                    strokeDasharray={`${(stats.totalMeetings / (stats.totalHours + stats.totalBreaks + stats.totalMeetings)) * 502.65} 502.65`}
                                    strokeDashoffset={`${-((stats.totalHours + stats.totalBreaks) / (stats.totalHours + stats.totalBreaks + stats.totalMeetings)) * 502.65}`}
                                    transform="rotate(-90 100 100)"
                                />
                            </svg>
                        </div>
                        <div className="flex justify-center gap-6 mt-6 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-slate-600">Work: {stats.totalHours.toFixed(1)}h</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-slate-600">Breaks: {stats.totalBreaks.toFixed(1)}h</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                <span className="text-sm text-slate-600">Meetings: {stats.totalMeetings.toFixed(1)}h</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Distribution Pie Chart */}
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in" style={{ animationDelay: '0.45s' }}>
                        <h2 className="text-xl font-bold text-primary mb-6">Top 5 Earnings Distribution</h2>
                        <div className="flex items-center justify-center">
                            <svg width="200" height="200" viewBox="0 0 200 200">
                                {stats.topByPayment.slice(0, 5).map((candidate, idx) => {
                                    const total = stats.topByPayment.slice(0, 5).reduce((s, c) => s + c.payment, 0);
                                    const percentage = (candidate.payment / total) * 100;
                                    const circumference = 502.65;
                                    const strokeDash = (percentage / 100) * circumference;
                                    const previousOffset = stats.topByPayment.slice(0, idx).reduce((s, c) => s + ((c.payment / total) * circumference), 0);
                                    const pieColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];
                                    
                                    return (
                                        <circle
                                            key={candidate.name}
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
                            {stats.topByPayment.slice(0, 5).map((candidate, idx) => {
                                const total = stats.topByPayment.slice(0, 5).reduce((s, c) => s + c.payment, 0);
                                const percentage = ((candidate.payment / total) * 100).toFixed(1);
                                const pieColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];
                                
                                return (
                                    <div key={candidate.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[idx % pieColors.length] }}></div>
                                            <span className="text-slate-600">{candidate.name}</span>
                                        </div>
                                        <span className="font-semibold text-slate-800">{percentage}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Top by Payment */}
                    <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg p-6 animate-fade-in border border-green-100" style={{ animationDelay: '0.55s' }}>
                        <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                            <TrendingUpIcon className="w-6 h-6" />
                            Top Earners
                        </h2>
                        <div className="space-y-4">
                            {stats.topByPayment.map((candidate, idx) => (
                                <div key={candidate.name} className="relative group">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: colors[idx % colors.length] }}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <span className="font-medium text-slate-800 block">{candidate.name}</span>
                                                <span className="text-xs text-slate-500">{candidate.entries} entries</span>
                                            </div>
                                        </div>
                                        <span className="font-bold text-green-600 group-hover:text-green-700 transition-colors">${candidate.payment.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out shadow-lg"
                                            style={{
                                                width: `${(candidate.payment / Math.max(...stats.topByPayment.map(c => c.payment))) * 100}%`,
                                                backgroundColor: colors[idx % colors.length],
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top by Hours */}
                    <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-6 animate-fade-in border border-blue-100" style={{ animationDelay: '0.6s' }}>
                        <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                            <ClockIcon className="w-6 h-6" />
                            Most Active
                        </h2>
                        <div className="space-y-4">
                            {stats.topByHours.map((candidate, idx) => {
                                const totalTime = candidate.hours + candidate.breaks + candidate.meetings;
                                return (
                                    <div key={candidate.name} className="relative group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: colors[(idx + 3) % colors.length] }}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-800 block">{candidate.name}</span>
                                                    <span className="text-xs text-slate-500">{candidate.entries} entries</span>
                                                </div>
                                            </div>
                                            <span className="font-bold text-blue-600 group-hover:text-blue-700 transition-colors">{totalTime.toFixed(2)}h</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700 ease-out shadow-lg"
                                                style={{
                                                    width: `${((candidate.hours + candidate.breaks + candidate.meetings) / Math.max(...stats.topByHours.map(c => c.hours + c.breaks + c.meetings))) * 100}%`,
                                                    backgroundColor: colors[(idx + 3) % colors.length],
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Detailed Employee Stats Table */}
                {stats.byCandidateStats.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6 animate-fade-in" style={{ animationDelay: '0.65s' }}>
                        <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                            <span>📊</span>
                            Employee Statistics
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-gradient-to-r from-parchment to-parchment/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">Hours</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">Breaks</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">Meetings</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">Sets</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">Entries</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">Avg/Entry</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-primary uppercase tracking-wider">Total Earned</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {stats.byCandidateStats.map((candidate, idx) => (
                                        <tr key={candidate.name} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{candidate.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{candidate.hours.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{candidate.breaks.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">{candidate.meetings.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">{candidate.sets}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{candidate.entries}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {candidate.entries > 0 ? ((candidate.hours + candidate.breaks + candidate.meetings) / candidate.entries).toFixed(2) : 0}h
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1 rounded-lg">${candidate.payment.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StatsTab;
