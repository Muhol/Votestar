"use client";

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../../lib/api';
import { useAuth } from '../components/AuthProvider';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Plus, Users, ShieldCheck, ArrowRight, Loader2, CheckCircle2, MessageSquare, Heart } from 'lucide-react';
import Link from 'next/link';
import VerifiedBadge from '../components/VerifiedBadge';
import FollowButton from '../components/FollowButton';
import Avatar from '../components/Avatar';
import FeedItem from '../components/FeedItem';

export default function ProposalHubPage() {
    const { user } = useAuth();
    const { data: proposals, isLoading } = useSWR('/proposals', fetcher);

    const handleSign = async (id: string) => {
        try {
            const response = await fetch(`/api/proxy/proposals/${id}/sign`, {
                method: 'POST'
            });
            if (response.ok) {
                mutate('/proposals');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
                {/* Header */}
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={18} className="text-accent" />
                            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Consensus Hub</span>
                        </div>
                        <h1 className="text-3xl font-bold text-black dark:text-white"> Community Proposals </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Shape the future Wall. Every global category starts with a citizen's idea.
                        </p>
                    </div>

                    {user && (
                        <Link
                            href="/proposals/new"
                            className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                            <Plus size={18} />
                            <span>New Proposal</span>
                        </Link>
                    )}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Feed Section */}
                    <div className="lg:col-span-2 space-y-4">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-48 bg-white dark:bg-white/5 rounded-2xl animate-pulse border border-gray-200 dark:border-gray-800"></div>
                                ))}
                            </div>
                        ) : proposals?.length > 0 ? (
                            proposals.map((item: any) => (
                                <FeedItem
                                    key={item.id}
                                    userId={item.creator_id || 'system'}
                                    userName={item.creator_name || 'System'}
                                    userType={item.creator_type}
                                    isVerified={item.creator_verified}
                                    timestamp={new Date(item.created_at || Date.now()).toLocaleDateString()}
                                    content={
                                        <div className="space-y-3">
                                            <h3 className="text-xl font-bold text-black dark:text-white group-hover:text-accent transition-colors">
                                                {item.name}
                                            </h3>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                {item.description}
                                            </p>

                                            {/* Progress Box */}
                                            <div className="mt-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Support Threshold</span>
                                                    <span className="text-[10px] font-bold text-accent">{item.proposal_signatures} / 50</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${item.has_signed ? 'bg-accent' : 'bg-gray-400'}`}
                                                        style={{ width: `${Math.min((item.proposal_signatures / 50) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                    isActionActive={item.has_signed}
                                    onActionClick={() => handleSign(item.id)}
                                    href={`/proposals/${item.id}`}
                                />
                            ))
                        ) : (
                            <div className="py-20 text-center bg-white dark:bg-white/5 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                                <Users size={40} className="mx-auto text-gray-200 dark:text-white/10 mb-4" />
                                <h3 className="text-lg font-bold text-black dark:text-white mb-2">The Hub is Empty</h3>
                                <p className="text-sm text-gray-500">Be the first to propose a new dimension of global consensus.</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Info */}
                    <aside className="space-y-6">
                        <div className="bg-black text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ShieldCheck size={80} />
                            </div>
                            <h3 className="text-lg font-bold mb-4">Guardrails</h3>
                            <ul className="space-y-4 text-xs font-medium text-gray-400">
                                <li className="flex items-start gap-3">
                                    <div className="h-1 w-1 rounded-full bg-accent mt-1.5 shrink-0"></div>
                                    <span>Citizens & Orgs can propose. Orgs activate instantly.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-1 w-1 rounded-full bg-accent mt-1.5 shrink-0"></div>
                                    <span>Individuals need 50 signatures to promote to Star Wall.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-1 w-1 rounded-full bg-accent mt-1.5 shrink-0"></div>
                                    <span>Every action is signed and auditable on the ledger.</span>
                                </li>
                            </ul>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}
