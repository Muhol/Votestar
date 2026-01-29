"use client";

import Table from '../../components/Table';
import { UserCheck, UserX, ShieldCheck, Search, Users, ExternalLink } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '../../../lib/api';
import Avatar from '../../components/Avatar';

const MOCK_USERS = [
    { id: 'u1', name: 'mohol_star', status: 'verified', tier: 'Citizen', power: '2.5x', joinDate: '2025-10-12' },
    { id: 'u2', name: 'alpha_voter', status: 'pending', tier: 'Free', power: '1.0x', joinDate: '2025-10-14' },
    { id: 'u3', name: 'democracy_fan', status: 'suspended', tier: 'Free', power: '0.0x', joinDate: '2025-09-30' },
];

export default function UsersPage() {
    const users = MOCK_USERS;

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={14} className="text-accent" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Citizen Directory</span>
                    </div>
                    <h2 className="text-4xl font-black text-black dark:text-white">Human Ledger</h2>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Find citizen..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-full text-sm focus:ring-2 ring-accent/30 outline-none transition-all"
                        />
                    </div>
                    <div className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-xs whitespace-nowrap">
                        12,402 Total
                    </div>
                </div>
            </header>

            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-[40px] overflow-hidden">
                <Table
                    headers={['Cid', 'Identity', 'Reputation', 'Tier', 'Decision Power', 'Actions']}
                    data={users}
                    renderRow={(user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-50 dark:border-gray-900/50 last:border-none group">
                            <td className="px-8 py-6">
                                <span className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-tighter">#{user.id}</span>
                            </td>
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                    <Avatar name={user.name} size="md" className="ring-2 ring-transparent group-hover:ring-accent transition-all" />
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-bold text-black dark:text-white">{user.name}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Joined {user.joinDate}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    user.status === 'verified' ? 'bg-green-500/10 text-green-500' :
                                    user.status === 'suspended' ? 'bg-red-500/10 text-red-500' :
                                    'bg-gray-100 dark:bg-white/10 text-gray-500'
                                }`}>
                                    {user.status}
                                </span>
                            </td>
                            <td className="px-8 py-6">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{user.tier}</span>
                            </td>
                            <td className="px-8 py-6 text-sm font-black text-accent tabular-nums tracking-tighter">
                                {user.power}
                            </td>
                            <td className="px-8 py-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button title="Verify" className="p-2.5 hover:bg-green-500/10 text-gray-400 hover:text-green-500 transition-colors rounded-xl">
                                        <UserCheck size={18} />
                                    </button>
                                    <button title="Suspend" className="p-2.5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors rounded-xl">
                                        <UserX size={18} />
                                    </button>
                                    <button title="View Details" className="p-2.5 text-gray-300">
                                        <ExternalLink size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )}
                />
            </div>
        </div>
    );
}
