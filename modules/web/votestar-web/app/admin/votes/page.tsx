"use client";

import useSWR from 'swr';
import { fetcher } from '../../../lib/api';
import Table from '../../components/Table';

export default function VotesPage() {
    const { data: votes, error } = useSWR('/votes', fetcher);

    return (
        <div>
            <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter ">Vote Ledger</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 uppercase text-[10px] font-bold tracking-widest">Immutable Transaction History</p>
                </div>
                <button className="w-full sm:w-auto bg-accent hover:opacity-90 text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border border-black/10">
                    Export Ledger
                </button>
            </header>

            <Table
                headers={['ID', 'Human', 'Area', 'Candidate', 'Staked', 'Entry Hash']}
                data={votes}
                renderRow={(vote) => (
                    <tr key={vote.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-black/5 dark:border-white/5">
                        <td className="px-6 py-4 text-[10px] font-black font-mono text-gray-400">#{vote.id.slice(0, 8)}</td>
                        <td className="px-6 py-4">
                            <span className="text-sm font-black text-black dark:text-white uppercase tracking-tight ">{vote.user_id}</span>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{vote.category_id}</td>
                        <td className="px-6 py-4 text-sm font-black text-accent uppercase tracking-tighter ">{vote.candidate_id}</td>
                        <td className="px-6 py-4 text-[10px] font-black text-gray-500 dark:text-gray-400">{new Date(vote.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4 text-[10px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-white/10 rounded px-2 py-1">{vote.vote_hash ? `${vote.vote_hash.slice(0, 16)}...` : "UNVERIFIED"}</td>
                    </tr>
                )}
            />
        </div>
    );
}
