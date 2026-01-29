"use client";

import StatsCard from '../components/StatsCard';
import useSWR from 'swr';
import { fetcher } from '../../lib/api';
import { Activity, Users, Globe, PieChart, Star, ArrowUpRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const { data: stats } = useSWR('/stats/summary', fetcher);
    // Mocking community proposals that hit the 50-signature threshold
    const { data: hotProposals } = useSWR('/proposals?status=PROPOSAL', fetcher);
    const starWallQueue = hotProposals?.filter((p: any) => p.proposal_signatures >= 50) || [];

    return (
        <div className="space-y-12">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-2 w-2 bg-accent rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protocol Monitor Live</span>
                </div>
                <h1 className="text-4xl font-black text-black dark:text-white">Consensus Hub</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard 
                    title="Total ledger entries" 
                    value={stats?.total_votes?.toLocaleString() || "..."} 
                    trend="12%" 
                    icon={<Activity size={24} />}
                />
                <StatsCard 
                    title="Verified Citizens" 
                    value={stats?.active_users?.toLocaleString() || "..."} 
                    trend="5%" 
                    icon={<Users size={24} />}
                />
                <StatsCard 
                    title="Active Protocols" 
                    value={stats?.open_elections || "..."} 
                    icon={<Globe size={24} />}
                />
                <StatsCard 
                    title="Social Reach" 
                    value="1.2M" 
                    trend="8%" 
                    icon={<PieChart size={24} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Star Wall Promotion Queue */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
                            <Star size={20} className="text-accent fill-accent" />
                            Star Wall Promotion Queue
                        </h3>
                        <Link href="/admin/moderation" className="text-xs font-bold text-accent hover:underline">View All</Link>
                    </div>

                    <div className="space-y-4">
                        {starWallQueue.length > 0 ? (
                            starWallQueue.map((proposal: any) => (
                                <div key={proposal.id} className="bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-accent/30 transition-all group">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Threshold Exceeded</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">· {proposal.proposal_signatures} Signatures</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-black dark:text-white mb-1">{proposal.name}</h4>
                                        <p className="text-sm text-gray-500 line-clamp-1">{proposal.description}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="px-6 py-2.5 bg-accent text-black rounded-full font-bold text-xs hover:shadow-lg transition-all active:scale-95">
                                            Promote to Wall
                                        </button>
                                        <button className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-full hover:bg-gray-200 transition-all">
                                            <ArrowUpRight size={18} className="text-gray-500" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-100 dark:border-gray-900 rounded-[40px]">
                                <Star size={40} className="mx-auto text-gray-200 dark:text-white/10 mb-4" />
                                <h4 className="text-lg font-bold text-black dark:text-white mb-2">Queue is Empty</h4>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">Citizen proposals that reach 50 signatures will appear here for promotion to the global Star Wall.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* System Integrity / Trust Score */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-black dark:text-white px-2">Integrity Score</h3>
                    <div className="bg-black text-white p-8 rounded-[40px] relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <ShieldCheck size={20} className="text-accent" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Protocol Trust</span>
                            </div>
                            <h4 className="text-5xl font-black mb-2">99.8<span className="text-accent">%</span></h4>
                            <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                Current consensus layer stability. All ledger nodes are reporting healthy shard propagation.
                            </p>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
                    </div>

                    <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 p-8 rounded-[40px]">
                        <h4 className="text-sm font-bold text-black dark:text-white mb-4">Node Distribution</h4>
                        <div className="space-y-4">
                            {[
                                { name: 'Vanguard Node', status: 'Healthy', color: 'bg-green-500' },
                                { name: 'Echelon Shard', status: 'Healthy', color: 'bg-green-500' },
                                { name: 'Apex Relay', status: 'Syncing', color: 'bg-accent' },
                            ].map((node) => (
                                <div key={node.name} className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">{node.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-black dark:text-white uppercase">{node.status}</span>
                                        <div className={`h-2 w-2 rounded-full ${node.color}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
