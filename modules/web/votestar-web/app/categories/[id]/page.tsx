"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../../../lib/api';
import { useAuth } from '../../components/AuthProvider';
import VotingModal from '../../components/VotingModal';
import { ChevronLeft, Heart, Share2, Trophy, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';

export default function CategoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;
    const { user } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<{ id: string, name: string } | null>(null);

    const { data: category, isLoading: catLoading } = useSWR(`/categories/${id}`, fetcher);
    const { data: leaderboardData, isLoading: boardLoading } = useSWR(`/categories/${id}/leaderboard`, fetcher);

    const isLoading = catLoading || boardLoading;

    const handleVoteClick = (candidate: { id: string, name: string }) => {
        if (!user) {
            router.push('/login');
            return;
        }
        setSelectedCandidate(candidate);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-white/5 mb-8 rounded"></div>
                    <div className="h-10 w-2/3 bg-gray-200 dark:bg-white/5 mb-4 rounded"></div>
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-white/5 mb-12 rounded"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white dark:bg-white/5 rounded-2xl"></div>)}
                    </div>
                </main>
            </div>
        );
    }

    const hasVoted = leaderboardData?.has_voted;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
                {/* Back Button */}
                <Link
                    href="/categories"
                    className="inline-flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-6 transition-colors group"
                >
                    <ChevronLeft size={18} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                    Categories
                </Link>

                {/* Category Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="px-2 py-1 bg-accent/10 rounded-full">
                            <span className="text-xs font-semibold text-accent">Live Voting</span>
                        </div>
                        {hasVoted && (
                            <div className="px-2 py-1 bg-green-500/10 rounded-full flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-green-500" />
                                <span className="text-xs font-semibold text-green-500">You voted</span>
                            </div>
                        )}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {leaderboardData?.total_votes?.toLocaleString()} total votes
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">
                        {category?.name}
                    </h1>
                    <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl">
                        {category?.description}
                    </p>
                </header>

                {/* Leaderboard */}
                <div className="space-y-3 mb-12">
                    {leaderboardData?.leaderboard?.map((candidate: any) => (
                        <div
                            key={candidate.candidate_id}
                            className={`relative bg-white dark:bg-white/5 border rounded-2xl p-5 transition-all duration-200 hover:shadow-md ${candidate.user_voted_for
                                    ? 'border-green-500/50 bg-green-500/5 shadow-sm'
                                    : candidate.rank === 1
                                        ? 'border-accent/50 shadow-sm'
                                        : 'border-gray-200 dark:border-gray-800'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                {/* Rank */}
                                <div className="flex-shrink-0 w-8 text-center">
                                    {candidate.rank === 1 ? (
                                        <Trophy size={20} className="text-accent mx-auto" />
                                    ) : (
                                        <span className="text-lg font-bold text-gray-400">
                                            {candidate.rank}
                                        </span>
                                    )}
                                </div>

                                {/* Candidate Avatar */}
                                <div className="flex-shrink-0">
                                    <div className={`h-14 w-14 rounded-full flex items-center justify-center overflow-hidden ${candidate.user_voted_for ? 'ring-2 ring-green-500' : 'bg-gradient-to-br from-accent/20 to-accent/40'
                                        }`}>
                                        <span className="text-xl font-bold text-black">
                                            {candidate.name.charAt(0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Candidate Info */}
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-black dark:text-white truncate">
                                            {candidate.name}
                                        </h3>
                                        {candidate.user_voted_for && (
                                            <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Your Choice</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {candidate.votes?.toLocaleString()} votes
                                        </span>
                                        <span className="text-sm font-semibold text-accent">
                                            {candidate.percentage}%
                                        </span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-2">
                                        <div
                                            className={`h-full transition-all duration-1000 ${candidate.user_voted_for ? 'bg-green-500' : candidate.rank === 1 ? 'bg-accent' : 'bg-gray-400'
                                                }`}
                                            style={{ width: `${candidate.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Vote Button */}
                                <button
                                    onClick={() => !hasVoted && handleVoteClick({ id: candidate.candidate_id, name: candidate.name })}
                                    disabled={hasVoted}
                                    className={`flex-shrink-0 p-3 rounded-full transition-all ${candidate.user_voted_for
                                            ? 'bg-green-500 text-white shadow-lg'
                                            : hasVoted
                                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                                : candidate.rank === 1
                                                    ? 'bg-accent hover:bg-accent/90 text-black'
                                                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-accent hover:text-black text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    <Heart size={20} className={candidate.user_voted_for ? "fill-current" : ""} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info Card */}
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Share2 size={20} className="text-accent" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-black dark:text-white mb-1">
                                Transparent & Immutable
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                All votes are recorded on an append-only ledger. Once cast, your vote is permanent and auditable by anyone.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {selectedCandidate && category && (
                <VotingModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    candidate={selectedCandidate}
                    category={{ id: category.id, name: category.name }}
                    onSuccess={() => {
                        mutate(`/categories/${id}/leaderboard`);
                        mutate(`/categories/${id}`); // Update has_voted
                    }}
                />
            )}

            <Footer />
        </div>
    );
}
