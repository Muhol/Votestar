"use client";

import { useState } from 'react';
import Link from 'next/link';
import { User, Shield, Clock, ExternalLink, Award, Settings, Users, Grid, List } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../components/AuthProvider';
import useSWR from 'swr';
import { fetcher } from '../../lib/api';
import VerifiedBadge from '../components/VerifiedBadge';
import Avatar from '../components/Avatar';

export default function ProfilePage() {
    const { user, isLoading: authLoading } = useAuth();
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

            <main className="max-w-4xl mx-auto pb-20 min-h-screen">
                {/* Profile Header / Cover */}
                <div className="h-48 md:h-64 bg-gradient-to-r from-accent/20 via-accent/5 to-transparent relative border-b border-gray-100 dark:border-gray-900">
                    <div className="absolute -bottom-16 left-6 md:left-12">
                        <Avatar 
                          name={stats.name} 
                          size="xxl" 
                          className="h-50 flex justify-center"
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

                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-grow md:flex-none px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-sm hover:opacity-90 transition-opacity">
                            Edit Profile
                        </button>
                        <button className="p-2.5 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <Settings size={20} className="text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-12 border-b border-gray-100 dark:border-gray-900 flex justify-center gap-12">
                    <button 
                      onClick={() => setActiveTab('ledger')}
                      className={`pb-4 text-sm font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'ledger' ? 'text-black dark:text-white border-black dark:border-white' : 'text-gray-400 border-transparent'
                      }`}
                    >
                        <Grid size={16} />
                        Ledger
                    </button>
                    <button 
                      onClick={() => setActiveTab('activity')}
                      className={`pb-4 text-sm font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'activity' ? 'text-black dark:text-white border-black dark:border-white' : 'text-gray-400 border-transparent'
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
