"use client";

import { useState } from 'react';
import Link from 'next/link';
import { User, Shield, Clock, ExternalLink, Award, Settings, Users, Grid, List, X, ShieldOff } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../components/AuthProvider';
import useSWR from 'swr';
import { fetcher } from '../../lib/api';
import VerifiedBadge from '../components/VerifiedBadge';
import Avatar from '../components/Avatar';
import BlockButton from '../components/BlockButton';

export default function ProfilePage() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showBlockedList, setShowBlockedList] = useState(false);
    const { user, logout, isLoading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'ledger' | 'activity'>('ledger');

    // Fetch voting history
    const { data: history, isLoading: historyLoading } = useSWR(
        user ? `/users/${user.id}/votes` : null,
        fetcher
    );

    // Fetch followers list
    const { data: followers } = useSWR(
        user ? `/users/${user.id}/followers` : null,
        fetcher
    );

    // Fetch blocked users
    const { data: blockedUsers, mutate: mutateBlocked } = useSWR(
        user ? `/users/me/blocks` : null,
        fetcher
    );

    if (authLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-semibold text-gray-400">Loading Profile...</span>
            </div>
        </div>
    );

    if (!user) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Unauthorized Access</div>;

    const stats = {
        name: user.email.split('@')[0],
        totalVotes: history?.length || 0,
        followers: followers?.length || 0,
        reputation: 100,
        joinDate: 'Jan 2026'
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <Navbar />

            {/* Blocked List Modal */}
            {showBlockedList && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBlockedList(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-900 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-black dark:text-white">Blocked Citizens</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manage Restricted Accounts</p>
                            </div>
                            <button 
                                onClick={() => setShowBlockedList(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {blockedUsers?.length > 0 ? (
                                <div className="space-y-2">
                                    {blockedUsers.map((b: any) => (
                                        <div key={b.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={b.name} size="md" />
                                                <span className="font-bold text-black dark:text-white">{b.name}</span>
                                            </div>
                                            <BlockButton 
                                                targetUserId={b.id} 
                                                isBlocked={true} 
                                                variant="button"
                                                onUpdate={() => mutateBlocked()}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <ShieldOff size={40} className="mx-auto text-gray-200 dark:text-white/10 mb-4" />
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No Restricted Accounts</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-4xl mx-auto pb-20 min-h-screen">
                {/* Profile Header / Cover */}
                <div className="h-48 md:h-64 bg-gradient-to-r from-accent/20 via-accent/5 to-transparent relative border-b border-gray-100 dark:border-gray-900">
                    <div className="absolute -bottom-16 left-6 md:left-12">
                        <Avatar 
                          name={stats.name} 
                          size="xxl" 
                          className="h-50 flex justify-center rounded-full"
                        />
                    </div>
                </div>

                <div className="pt-20 px-6 md:px-12 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-black dark:text-white">{stats.name}</h1>
                            <VerifiedBadge isVerified={user.isVerified || user.isVerifiedOrg} type={user.userType} />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-4">
                            Active Star Citizen since {stats.joinDate}
                        </p>
                        
                        <div className="flex flex-wrap gap-6 mt-4">
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-black dark:text-white uppercase">{stats.followers}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Followers</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-black dark:text-white uppercase">{stats.totalVotes}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Votes Cast</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-black dark:text-white uppercase">{stats.reputation}%</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reputation</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto relative">
                        <button className="flex-grow md:flex-none px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-sm hover:opacity-90 transition-opacity">
                            Edit Profile
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className={`p-2.5 border rounded-full transition-all ${isSettingsOpen ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-lg' : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                            >
                                <Settings size={20} />
                            </button>

                            {/* Settings Menu */}
                            {isSettingsOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)}></div>
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Settings</p>
                                        <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors text-sm font-bold text-gray-600 dark:text-gray-300">
                                            Edit Identity
                                        </button>
                                        <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors text-sm font-bold text-gray-600 dark:text-gray-300">
                                            Privacy Controls
                                        </button>
                                        <button 
                                            onClick={() => { setShowBlockedList(true); setIsSettingsOpen(false); }}
                                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors text-sm font-bold text-gray-600 dark:text-gray-300"
                                        >
                                            Blocked Citizens
                                        </button>
                                        <div className="h-px bg-gray-50 dark:bg-gray-900 my-1 mx-2"></div>
                                        <button
                                            onClick={() => logout()}
                                            className="w-full text-left px-4 py-2.5 hover:bg-red-500/10 rounded-2xl transition-colors text-sm font-bold text-red-500"
                                        >
                                            Logout Session
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-12 border-b border-gray-100 dark:border-gray-900 flex justify-center gap-12">
                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`pb-4 text-sm font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${activeTab === 'ledger' ? 'text-black dark:text-white border-black dark:border-white' : 'text-gray-400 border-transparent'
                            }`}
                    >
                        <Grid size={16} />
                        Ledger
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`pb-4 text-sm font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${activeTab === 'activity' ? 'text-black dark:text-white border-black dark:border-white' : 'text-gray-400 border-transparent'
                            }`}
                    >
                        <List size={16} />
                        Activity
                    </button>
                </div>

                {/* Content Section */}
                <div className="mt-8 px-4 max-w-3xl mx-auto">
                    {activeTab === 'ledger' ? (
                        <div className="space-y-4">
                            {historyLoading ? (
                                <div className="py-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">Querying Ledger...</div>
                            ) : history?.length > 0 ? history.map((tx: any) => (
                                <div
                                    key={tx.id}
                                    className="group flex flex-col md:flex-row justify-between bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 transition-all"
                                >
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">TX {tx.id.slice(0, 8)}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">• {new Date(tx.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-black dark:text-white mb-1">
                                            Cast vote for <span className="text-accent">{tx.candidate_name}</span>
                                        </h3>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{tx.category_name} Election</p>
                                    </div>

                                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center mt-6 md:mt-0 gap-4">
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Audit Hash</p>
                                            <code className="text-[10px] bg-white dark:bg-black text-gray-500 px-2 py-1 rounded border border-gray-100 dark:border-gray-900 font-mono">
                                                {tx.vote_hash?.slice(0, 8)}...
                                            </code>
                                        </div>
                                        <Link href={`/ledger/${tx.id}`} className="p-2.5 rounded-full hover:bg-accent transition-colors">
                                            <ExternalLink size={16} className="text-gray-400 group-hover:text-black" />
                                        </Link>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                    <Clock size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No ledger entries found</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <Shield size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                            <h3 className="text-lg font-bold text-black dark:text-white mb-2">Platform Activity</h3>
                            <p className="text-sm text-gray-500">Your recent follows, proposals, and interactions will appear here.</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
