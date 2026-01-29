"use client";

import useSWR from 'swr';
import { fetcher } from '../../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ShieldCheck, Activity, Search, Filter, ExternalLink } from 'lucide-react';

export default function LedgerPage() {
    const { data: votes, isLoading } = useSWR('/votes', fetcher, {
        refreshInterval: 5000 // Poll every 5s for the "live" feel
    });

    console.log(votes);

    return (
        <div className="min-h-screen bg-white dark:bg-black font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-16 md:py-24">
                {/* Header Section */}
                <header className="mb-16 md:mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                    <div className="flex-grow">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded mb-6">
                            <Activity size={14} className="text-accent animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest ">Live Transaction Tape</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-black dark:text-white tracking-tighter uppercase  leading-[0.8] mb-6">
                            THE LEDGER<span className="text-accent underline decoration-4 underline-offset-8">.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium max-w-2xl  leading-relaxed">
                            Full cryptographic transparency. Every entry on this tape represents a verified human choice, appended to the immutable Star-Trust protocol.
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 p-8 rounded-3xl shrink-0 min-w-[280px]">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ">Global Integrity Status</p>
                        <div className="flex items-center space-x-3 mb-6">
                            <ShieldCheck size={24} className="text-success" />
                            <span className="text-2xl font-black text-black dark:text-white tracking-tighter uppercase ">Operational</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                <span className="text-gray-400">Total Entries</span>
                                <span className="text-black dark:text-white">{votes?.length || "..."}</span>
                            </div>
                            <div className="w-full h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-accent w-[85%]"></div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Ledger Table / Tape */}
                <section className="relative">
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="relative flex-grow">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="SEARCH HASH OR USER CID..."
                                className="w-full bg-transparent border-2 border-black/5 dark:border-white/10 rounded-2xl py-4 pl-12 pr-6 text-xs font-black uppercase tracking-widest focus:border-accent outline-none transition-colors dark:text-white"
                            />
                        </div>
                        <button className="flex items-center justify-center space-x-2 px-8 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-white hover:border-accent transition-colors">
                            <Filter size={14} />
                            <span>Filter Protocols</span>
                        </button>
                    </div>

                    {/* Tape Interface */}
                    <div className="overflow-hidden border border-black/5 dark:border-white/10 rounded-3xl shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black dark:bg-white text-white dark:text-black border-b border-accent">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest ">Sequence</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest ">Citizen CID</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest ">Protocol</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest ">Staked Choice</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest ">Entry Artifact (Hash)</th>
                                        <th className="px-8 py-6"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-black divide-y divide-black/5 dark:divide-white/10">
                                    {isLoading ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={6} className="px-8 py-6 bg-gray-50/50 dark:bg-white/5 h-16"></td>
                                            </tr>
                                        ))
                                    ) : votes?.map((vote: any, index: number) => (
                                        <tr key={vote.id} className="hover:bg-accent/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-mono font-black text-gray-300">
                                                    #{(votes.length - index).toString().padStart(6, '0')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-black dark:text-white uppercase tracking-tighter ">
                                                    {vote.user_id.slice(0, 8)}...
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1 bg-gray-100 dark:bg-white/10 text-[9px] font-black uppercase tracking-widest text-gray-500 rounded border border-black/5">
                                                    {vote.category_id.slice(0, 8)}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-black text-accent uppercase tracking-tighter ">
                                                    {vote.candidate_id.slice(0, 12)}...
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <code className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5">
                                                    {vote.vote_hash ? `${vote.vote_hash.slice(0, 24)}...` : "PENDING_BLOCK"}
                                                </code>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-2 border border-black/5 dark:border-white/10 rounded-lg text-gray-400 hover:text-accent hover:border-accent transition-all group-hover:scale-110">
                                                    <ExternalLink size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {!isLoading && (!votes || votes.length === 0) && (
                        <div className="py-32 text-center bg-gray-50 dark:bg-white/5 border-2 border-dashed border-black/5 dark:border-white/10 rounded-3xl mt-8">
                            <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-xs ">
                                Standby // Awaiting initial ledger commit ...
                            </p>
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}
