"use client";

import useSWR from 'swr';
import { fetcher } from '../../../lib/api';
import Table from '../../components/Table';
import { Database, Download, ShieldCheck, ChevronRight, Search } from 'lucide-react';

export default function VotesPage() {
    const { data: votes, error } = useSWR('/votes', fetcher);

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Database size={14} className="text-accent" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Immutable Ledger</span>
                    </div>
                    <h2 className="text-4xl font-black text-black dark:text-white">Transaction History</h2>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex-grow md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-full font-bold text-xs hover:bg-gray-50 transition-all">
                        <Download size={16} />
                        Export Data
                    </button>
                    <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-xs hover:opacity-90 transition-all">
                        Audit Ledger
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-[40px] overflow-hidden">
                <Table
                    headers={['Reference', 'Identity', 'Decision Area', 'Integrity Hash', 'Status']}
                    data={votes}
                    renderRow={(vote) => (
                        <tr key={vote.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-50 dark:border-gray-900/50 last:border-none group">
                            <td className="px-8 py-6">
                                <span className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-tighter">#{vote.id.slice(0, 8)}</span>
                            </td>
                            <td className="px-8 py-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-black dark:text-white truncate max-w-[120px]">{vote.user_id}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(vote.timestamp).toLocaleDateString()}</p>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-accent">{vote.candidate_id.slice(0, 8)}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{vote.category_id.slice(0, 8)}</p>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-2">
                                    <code className="text-[10px] font-mono text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded">
                                        {vote.vote_hash ? `${vote.vote_hash.slice(0, 12)}...` : "PENDING"}
                                    </code>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-green-500">Committed</span>
                                    </div>
                                    <ChevronRight size={14} className="text-gray-300 group-hover:text-accent translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                </div>
                            </td>
                        </tr>
                    )}
                />
            </div>
        </div>
    );
}
