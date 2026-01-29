"use client";

import Table from '../../components/Table';
import { ShieldAlert, CheckCircle, Trash2, EyeOff, MoreHorizontal, Search, Filter } from 'lucide-react';

const MOCKED_REPORTS = [
    { id: 'rep_001', target: 'Elon Musk (Candidate)', reason: 'Duplicate Profile', reportedBy: 'user_452', date: '2025-10-24', priority: 'High' },
    { id: 'rep_002', target: 'Fast Food Tier List (Category)', reason: 'Off-topic/Spam', reportedBy: 'human_98', date: '2025-10-23', priority: 'Medium' },
    { id: 'rep_003', target: 'Global Consensus Protocol', reason: 'Impersonation', reportedBy: 'citizen_12', date: '2025-10-22', priority: 'Critical' },
];

export default function ModerationPage() {
    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert size={14} className="text-red-500" />
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Integrity Enforcement</span>
                    </div>
                    <h2 className="text-4xl font-black text-black dark:text-white">Moderation Queue</h2>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search reports..." 
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-full text-sm focus:ring-2 ring-accent/30 outline-none transition-all"
                        />
                    </div>
                    <button className="p-2.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-full hover:bg-gray-50 transition-all">
                        <Filter size={18} className="text-gray-500" />
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-[40px] overflow-hidden">
                <Table
                    headers={['Reference', 'Target Content', 'Reason', 'Priority', 'Actions']}
                    data={MOCKED_REPORTS}
                    renderRow={(report) => (
                        <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-50 dark:border-gray-900/50 last:border-none">
                            <td className="px-8 py-6">
                                <span className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-tighter">#{report.id}</span>
                            </td>
                            <td className="px-8 py-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-black dark:text-white">{report.target}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reported by {report.reportedBy}</p>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <span className="px-3 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-[10px] font-bold rounded-full">
                                    {report.reason}
                                </span>
                            </td>
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-2">
                                    <div className={`h-1.5 w-1.5 rounded-full ${
                                        report.priority === 'Critical' ? 'bg-red-500' : report.priority === 'High' ? 'bg-orange-500' : 'bg-accent'
                                    }`}></div>
                                    <span className="text-xs font-bold text-gray-500">{report.priority}</span>
                                </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button title="Dismiss" className="p-2.5 hover:bg-green-500/10 text-gray-400 hover:text-green-500 transition-colors rounded-xl border border-transparent hover:border-green-500/20">
                                        <CheckCircle size={18} />
                                    </button>
                                    <button title="Hide from Public" className="p-2.5 hover:bg-accent/10 text-gray-400 hover:text-accent transition-colors rounded-xl border border-transparent hover:border-accent/20">
                                        <EyeOff size={18} />
                                    </button>
                                    <button title="Delete" className="p-2.5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors rounded-xl border border-transparent hover:border-red-500/20">
                                        <Trash2 size={18} />
                                    </button>
                                    <button className="p-2.5 text-gray-300">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )}
                />
            </div>
            
            <div className="flex items-center justify-between px-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider italic">Showing 3 of 12 pending cases</p>
                <div className="flex gap-2">
                    <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition-colors">Previous</button>
                    <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-accent hover:underline">Next Page</button>
                </div>
            </div>
        </div>
    );
}
