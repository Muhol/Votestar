"use client";

import Table from '../../components/Table';
import { ShieldAlert, CheckCircle, Trash2, EyeOff } from 'lucide-react';

const MOCKED_REPORTS = [
    { id: 'rep_001', target: 'Elon Musk (Candidate)', reason: 'Duplicate Profile', reportedBy: 'user_452', date: '2025-10-24' },
    { id: 'rep_002', target: 'Fast Food Tier List (Category)', reason: 'Off-topic/Spam', reportedBy: 'human_98', date: '2025-10-23' },
];

export default function ModerationPage() {
    return (
        <div>
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter ">Moderation Desk</h2>
                    <p className="text-danger mt-1 uppercase text-[10px] font-black tracking-widest flex items-center">
                       <ShieldAlert size={12} className="mr-1" />
                       Action Required: 12 Pending Reviews
                    </p>
                </div>
            </header>

            <Table
                headers={['Id', 'Target Content', 'Reason', 'Reporter', 'Date', 'Actions']}
                data={MOCKED_REPORTS}
                renderRow={(report) => (
                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-black/5 dark:border-white/5">
                        <td className="px-6 py-4 text-[10px] font-black font-mono text-gray-400">{report.id}</td>
                        <td className="px-6 py-4 text-sm font-black text-black dark:text-white uppercase tracking-tight ">{report.target}</td>
                        <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-danger/10 text-danger text-[9px] font-black uppercase tracking-widest border border-danger/10 rounded">
                                {report.reason}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-500">{report.reportedBy}</td>
                        <td className="px-6 py-4 text-xs text-gray-400">{report.date}</td>
                        <td className="px-6 py-4">
                            <div className="flex space-x-2">
                                <button title="Dismiss" className="p-2 hover:bg-success/10 text-gray-400 hover:text-success transition-colors rounded-lg border border-black/5 dark:border-white/5">
                                    <CheckCircle size={14} />
                                </button>
                                <button title="Hide from Public" className="p-2 hover:bg-accent/10 text-gray-400 hover:text-accent transition-colors rounded-lg border border-black/5 dark:border-white/5">
                                    <EyeOff size={14} />
                                </button>
                                <button title="Delete" className="p-2 hover:bg-danger/10 text-gray-400 hover:text-danger transition-colors rounded-lg border border-black/5 dark:border-white/5">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </td>
                    </tr>
                )}
            />
        </div>
    );
}
