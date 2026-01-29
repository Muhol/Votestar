"use client";

import { useParams } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../../../lib/api';
import { useAuth } from '../../components/AuthProvider';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Avatar from '../../components/Avatar';
import VerifiedBadge from '../../components/VerifiedBadge';
import FollowButton from '../../components/FollowButton';
import { useState } from 'react';
import { Vote, Users, Award, TrendingUp, ShieldCheck, Grid, List } from 'lucide-react';

export default function SocialProfilePage() {
    const params = useParams();
    const id = params.id;
    const { user: me } = useAuth();
    const [activeTab, setActiveTab] = useState<'votes' | 'activity'>('votes');

    const { data: profile, isLoading: profileLoading } = useSWR(`/users/${id}/profile`, fetcher);
    const { data: votes, isLoading: votesLoading } = useSWR(`/users/${id}/votes`, fetcher);

    const isLoading = profileLoading || votesLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
                    <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-white/5 mb-6"></div>
                    <div className="h-8 w-48 bg-gray-200 dark:bg-white/5 mb-4 rounded"></div>
                    <div className="h-4 w-64 bg-gray-200 dark:bg-white/5 mb-12 rounded"></div>
                </main>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center">
                <Navbar />
                <h1 className="text-2xl font-bold text-gray-400">Citizen Not Found</h1>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <Navbar />

            <main className="max-w-4xl mx-auto pb-20 min-h-screen">
                {/* Profile Header / Cover */}
                <div className="h-48 md:h-64 bg-gradient-to-r from-accent/20 via-accent/5 to-transparent relative border-b border-gray-100 dark:border-gray-900">
                    <div className="absolute -bottom-16 left-6 md:left-12">
                        <Avatar 
                          name={profile.name} 
                          size="xxl" 
                          className="h-50 flex justify-center ring-4 ring-white dark:ring-black shadow-2xl"
                        />
                    </div>
                </div>

                <div className="pt-20 px-6 md:px-12 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-black dark:text-white">{profile.name}</h1>
                            <VerifiedBadge isVerified={profile.is_verified_org} type={profile.user_type} />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-4">
                            {profile.user_type === 'ORGANIZATION' 
                                ? `Official Verified Organization · Shapers of the Star Wall`
                                : `Active Star Citizen · Contributing to Global Consensus`
                            }
                        </p>
                        
                        <div className="flex flex-wrap gap-8 mt-4">
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-black dark:text-white uppercase">{profile.follower_count?.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Followers</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-black dark:text-white uppercase">{profile.total_votes?.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Votes Cast</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-black dark:text-white uppercase">{profile.following_count?.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Following</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-2">
                        {!profile.is_me && (
                            <FollowButton 
                                targetUserId={profile.id} 
                                initialIsFollowing={profile.is_following}
                                onUpdate={() => mutate(`/users/${id}/profile`)}
                            />
                        )}
                        <button className="px-6 py-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-all">
                            Message
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-12 border-b border-gray-100 dark:border-gray-900 flex justify-center gap-12">
                    <button 
                      onClick={() => setActiveTab('votes')}
                      className={`pb-4 text-sm font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'votes' ? 'text-black dark:text-white border-black dark:border-white' : 'text-gray-400 border-transparent'
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
                    {activeTab === 'votes' ? (
                        <div className="space-y-4">
                            {votes?.length > 0 ? (
                                votes.map((vote: any) => (
                                    <div key={vote.id} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-accent/40">
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                                {new Date(vote.timestamp).toLocaleDateString()} · Consolidated Ledger
                                            </span>
                                            <h3 className="text-lg font-bold text-black dark:text-white mb-1">
                                                Voted in <span className="text-accent">{vote.category_name}</span>
                                            </h3>
                                            <p className="text-sm text-gray-500 font-medium">
                                                Supported Candidate: <span className="text-black dark:text-white italic">{vote.candidate_name}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-1 bg-accent/10 rounded-full border border-accent/20">
                                                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Verified Vote</span>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
                                                <Award size={16} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                    <Vote size={40} className="mx-auto text-gray-200 dark:text-white/10 mb-4" />
                                    <h3 className="text-lg font-bold text-black dark:text-white mb-2">No Votes Yet</h3>
                                    <p className="text-sm text-gray-500">This citizen has not yet appended their choices to the ledger.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <TrendingUp size={48} className="mx-auto text-gray-200 dark:text-white/10 mb-4" />
                            <h3 className="text-lg font-bold text-black dark:text-white mb-2">Platform Activity</h3>
                            <p className="text-sm text-gray-500">Recent follows, proposals, and interactions will appear here once indexed.</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
