"use client";

import { useParams, useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../../../lib/api';
import { useAuth } from '../../components/AuthProvider';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import UserCard from '../../components/UserCard';
import Avatar from '../../components/Avatar';
import { useState } from 'react';
import { ChevronLeft, Heart, ShieldCheck, Info, CheckCircle2, Star, MoreHorizontal, MessageSquare, Settings2 } from 'lucide-react';
import Link from 'next/link';
import BlockButton from '../../components/BlockButton';
import CommentModal from '../../components/CommentModal';
import ChatModal from '../../components/ChatModal';

export default function ProposalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;
    const { user } = useAuth();
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

    // Chat Modal State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [recipientId, setRecipientId] = useState<string | null>(null);
    const [otherUserName, setOtherUserName] = useState<string | undefined>();

    const handleOpenChat = (userId: string, userName?: string) => {
        if (!user) {
            router.push('/login');
            return;
        }

        setOtherUserName(userName);
        setRecipientId(userId);
        setIsChatOpen(true);
    };

    const { data: proposal, isLoading } = useSWR(`/proposals/${id}`, fetcher);

    const handleSign = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            const response = await fetch(`/api/proxy/proposals/${id}/sign`, {
                method: 'POST'
            });
            if (response.ok) {
                mutate(`/proposals/${id}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleComments = async () => {
        if (!user || !proposal || isUpdatingSettings) return;

        setIsUpdatingSettings(true);
        try {
            const newValue = !proposal.comments_disabled;
            const response = await fetch(`/api/proxy/proposals/${id}/settings?comments_disabled=${newValue}`, {
                method: 'PATCH'
            });
            if (response.ok) {
                mutate(`/proposals/${id}`);
                setShowMoreMenu(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdatingSettings(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-white/5 mb-8 rounded"></div>
                    <div className="h-10 w-2/3 bg-gray-200 dark:bg-white/5 mb-4 rounded"></div>
                    <div className="h-32 w-full bg-white dark:bg-white/5 rounded-2xl mb-8"></div>
                </main>
            </div>
        );
    }

    if (!proposal) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <Info size={48} className="mx-auto text-gray-300 mb-4" />
                    <h1 className="text-2xl font-bold text-black dark:text-white">Proposal Not Found</h1>
                    <Link href="/proposals" className="text-accent font-bold mt-4 inline-block hover:underline">Return to Hub</Link>
                </main>
                <Footer />
            </div>
        );
    }

    const progress = Math.min((proposal.proposal_signatures / 50) * 100, 100);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
                {/* Back Link */}
                <Link
                    href="/proposals"
                    className="inline-flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white mb-8 transition-colors group"
                >
                    <ChevronLeft size={18} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                    Consensus Hub
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Primary Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header Section */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="px-2 py-0.5 bg-accent/10 rounded-full">
                                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Community Proposal</span>
                                </div>
                                {proposal.has_signed && (
                                    <div className="px-2 py-0.5 bg-green-500/10 rounded-full flex items-center gap-1">
                                        <CheckCircle2 size={10} className="text-green-500" />
                                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Signed</span>
                                    </div>
                                )}
                            </div>
                            <h1 className="text-4xl font-bold text-black dark:text-white mb-6 leading-tight">
                                {proposal.name}
                            </h1>

                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-grow">
                                    <UserCard
                                        userId={proposal.creator_id || 'system'}
                                        name={proposal.creator_name || 'System'}
                                        userType={proposal.creator_type}
                                        isVerified={proposal.creator_verified}
                                        timestamp={`Proposed on ${new Date(proposal.created_at).toLocaleDateString()}`}
                                        showFollowButton
                                        onMessage={handleOpenChat}
                                        isMessageLoading={false}
                                    />
                                </div>

                                {/* More Menu for Proposal */}
                                {user && proposal.creator_id && user.id !== proposal.creator_id && (
                                    <div className="relative pt-4 pr-4">
                                        <button
                                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                                            className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-full text-gray-400 hover:text-black dark:hover:text-white transition-all shadow-sm"
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>

                                        {showMoreMenu && (
                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl p-2 z-50">
                                                <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-900 mb-1">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Creator Actions</p>
                                                </div>
                                                <BlockButton
                                                    targetUserId={proposal.creator_id}
                                                    isBlocked={proposal.is_blocked}
                                                    onUpdate={() => setShowMoreMenu(false)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Owner Controls */}
                                {user && proposal.creator_id && user.id === proposal.creator_id && (
                                    <div className="relative pt-4 pr-4">
                                        <button
                                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                                            className="p-2 bg-accent/10 border border-accent/20 rounded-full text-accent hover:bg-accent/20 transition-all shadow-sm"
                                        >
                                            <Settings2 size={20} />
                                        </button>

                                        {showMoreMenu && (
                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl p-2 z-50">
                                                <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-900 mb-1">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Proposal Settings</p>
                                                </div>
                                                <button
                                                    onClick={handleToggleComments}
                                                    disabled={isUpdatingSettings}
                                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors text-sm font-bold text-gray-600 dark:text-gray-300"
                                                >
                                                    <span>{proposal.comments_disabled ? "Enable Comments" : "Disable Comments"}</span>
                                                    <MessageSquare size={16} className={proposal.comments_disabled ? "text-green-500" : "text-red-500"} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Description */}
                        <section className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-3xl p-8">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Mission Statement</h2>
                            <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                                {proposal.description}
                            </p>
                        </section>

                        {/* Recent Supporters */}
                        <section>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">Recent Supporters</h2>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                                {((proposal.supporters as any[]) || []).map((sup: { id: string, name: string }) => (
                                    <Link
                                        key={sup.id}
                                        href={`/profile/${sup.id}`}
                                        className="flex flex-col items-center gap-2 group/avatar"
                                    >
                                        <Avatar name={sup.name} size="md" className="border-2 border-gray-200/30 group-hover/avatar:border-accent rounded-full transition-all" />
                                        <span className="text-[10px] font-bold text-gray-500 truncate w-full text-center group-hover/avatar:text-accent transition-colors">{sup.name}</span>
                                    </Link>
                                ))}
                                {(!proposal.supporters || proposal.supporters.length === 0) && (
                                    <p className="col-span-full text-sm text-gray-400 italic py-4">Be the first to bring this vision to life.</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar / Action Column */}
                    <aside>
                        <div className="sticky top-24 space-y-6">
                            {/* Progress & Action Card */}
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <span className="block text-3xl font-bold text-black dark:text-white">
                                            {proposal.proposal_signatures}
                                        </span>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Signatures</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-lg font-bold text-accent">50</span>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Goal</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-3 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mb-8">
                                    <div
                                        className={`h-full transition-all duration-1000 ${proposal.has_signed ? 'bg-accent' : 'bg-gray-400'}`}
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>

                                <button
                                    onClick={handleSign}
                                    disabled={proposal.has_signed}
                                    className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${proposal.has_signed
                                        ? 'bg-green-500/10 text-green-500 cursor-default'
                                        : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-[0.98]'
                                        }`}
                                >
                                    {proposal.has_signed ? (
                                        <>
                                            <CheckCircle2 size={18} />
                                            <span>Already Supported</span>
                                        </>
                                    ) : (
                                        <>
                                            <Heart size={18} className="fill-current" />
                                            <span>Support Vision</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => setIsCommentModalOpen(true)}
                                    className="w-full mt-3 py-3 rounded-2xl font-bold text-sm bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <MessageSquare size={18} />
                                    <span>Discuss Vision</span>
                                </button>

                                <p className="text-[10px] text-gray-400 text-center mt-4 px-2 leading-relaxed font-bold flex items-center justify-center">
                                    By signing, you append your immutable identifier to this proposal on the Votest<Star size={11} className="fill-accent text-accent mx-0.5" />r ledger.
                                </p>
                            </div>

                            {/* Trust Card */}
                            <div className="bg-accent/5 rounded-3xl p-6 border border-accent/10">
                                <div className="flex items-start gap-4">
                                    <ShieldCheck size={24} className="text-accent shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-bold text-black dark:text-white mb-1">Democratic Guardrail</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                            Once a community proposal reaches 50 signatures, it is automatically promoted to the Star Wall for global voting.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
            <CommentModal
                isOpen={isCommentModalOpen}
                onClose={() => setIsCommentModalOpen(false)}
                proposalId={String(id)}
                proposalName={proposal.name}
                commentsDisabled={proposal.comments_disabled}
            />

            {/* Chat Modal */}
            <ChatModal
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                conversationId={activeConversationId}
                recipientId={recipientId || undefined}
                otherUserName={otherUserName}
                onConversationCreated={(id) => setActiveConversationId(id)}
            />
        </div>
    );
}
