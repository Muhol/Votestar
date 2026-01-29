"use client";

import Table from '../../components/Table';
import { UserCheck, UserX, ShieldCheck } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '../../../lib/api';

const MOCK_USERS = [
    { id: 'u1', name: 'mohol_star', status: 'verified', tier: 'Citizen', power: '2.5x', joinDate: '2025-10-12' },
    { id: 'u2', name: 'alpha_voter', status: 'pending', tier: 'Free', power: '1.0x', joinDate: '2025-10-14' },
    { id: 'u3', name: 'democracy_fan', status: 'suspended', tier: 'Free', power: '0.0x', joinDate: '2025-09-30' },
];

export default function UsersPage() {
    // In final version, replace with real API
    // const { data: users, error } = useSWR('/admin/users', fetcher);

    const users = MOCK_USERS;

    return (
        <div>
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter ">Human Ledger</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 uppercase text-[10px] font-bold tracking-widest">Verified Global Citizens</p>
                </div>
                <div className="flex space-x-3 w-full sm:w-auto">
                    <div className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-black/10">
                        Total Humans: 12,402
                    </div>
                </div>
            </header>

            <Table
                headers={['Cid', 'Identity', 'Status', 'Tier', 'Power', 'Actions']}
                data={users}
                renderRow={(user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-black/5 dark:border-white/5">
                        <td className="px-6 py-4 text-[10px] font-black font-mono text-gray-400">{user.id}</td>
                        <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 rounded bg-accent/20 flex items-center justify-center border border-accent/20">
                                    <span className="text-[10px] font-black text-accent">{user.name[0].toUpperCase()}</span>
                                </div>
                                <span className="text-sm font-black text-black dark:text-white uppercase tracking-tight ">{user.name}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${user.status === 'verified' ? 'bg-success/10 text-success border border-success/20' :
                                    user.status === 'suspended' ? 'bg-danger/10 text-danger border border-danger/20' :
                                        'bg-gray-100 dark:bg-white/10 text-gray-500'
                                }`}>
                                {user.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-black text-black dark:text-white uppercase tracking-widest">{user.tier}</td>
                        <td className="px-6 py-4 text-sm font-black text-accent tabular-nums tracking-tighter ">{user.power}</td>
                        <td className="px-6 py-4">
                            <div className="flex space-x-2">
                                <button className="p-2 hover:bg-success/10 text-gray-400 hover:text-success transition-colors rounded-lg border border-black/5 dark:border-white/5">
                                    <UserCheck size={14} />
                                </button>
                                <button className="p-2 hover:bg-danger/10 text-gray-400 hover:text-danger transition-colors rounded-lg border border-black/5 dark:border-white/5">
                                    <UserX size={14} />
                                </button>
                            </div>
                        </td>
                    </tr>
                )}
            />
        </div>
    );
}
