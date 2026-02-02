"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import ChatInterface from '../components/ChatInterface';
import InboxSidebar from '../components/InboxSidebar';
import useSWR from 'swr';
import { Maximize2, Minimize2, MessageSquare } from 'lucide-react';

import { useSearchParams } from 'next/navigation';
import { useSWRConfig } from 'swr';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
};

import { Suspense } from 'react';

function MessagesContent() {
    const { user, login } = useAuth();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isModalMode, setIsModalMode] = useState(false);

    // Fetch conversations (refresh every 30s to reduce load, relying on optimistic updates for active chat)
    const { data: conversations, error, isLoading } = useSWR(
        '/api/proxy/conversations',
        fetcher,
        { refreshInterval: 120000 }
    );

    const searchParams = useSearchParams();
    const startDmId = searchParams.get('start_dm');
    const { mutate: refreshConversations } = useSWRConfig();

    useEffect(() => {
        if (startDmId && conversations) {
            // Check if we already have it
            const existing = (conversations as Array<{ other_user_id: string, id: string }>).find((c) => c.other_user_id === startDmId);
            if (existing) {
                if (activeId !== existing.id) {
                    setTimeout(() => setActiveId(existing.id), 0);
                }
            } else {
                const newId = `new:${startDmId}`;
                if (activeId !== newId) {
                    setTimeout(() => setActiveId(newId), 0);
                }
            }
        }
    }, [startDmId, conversations, activeId]);

    // Debug logging (Moved up to avoid conditional hook call error)
    useEffect(() => {
        console.log('[MessagesPage] State:', { isLoading, hasData: !!conversations, hasError: !!error });
    }, [isLoading, conversations, error]);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <button onClick={login} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold">
                    Login to View Messages
                </button>
            </div>
        );
    }

    const activeConversation = Array.isArray(conversations) ? (conversations as any[]).find((c) => c.id === activeId) : null;

    return (
        <div className="flex h-[100vh] overflow-hidden bg-white dark:bg-black">
            {/* Assumes Navbar is 64px, adjusting viewport height */}

            {/* Sidebar (Pane 1) - Always visible on desktop, visible on mobile if no active modal */}
            <div className="w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-gray-100 dark:border-gray-800 flex">
                <InboxSidebar
                    conversations={conversations || []}
                    activeId={activeId}
                    isLoading={isLoading}
                    error={error}
                    onSelect={(id) => {
                        setActiveId(id);
                    }}
                    onDelete={() => refreshConversations('/api/proxy/conversations')}
                />
            </div>

            {/* Main Chat (Pane 2) - Desktop Only (Non-Modal Mode) */}
            <div className={`flex-grow relative hidden md:flex flex-col bg-white dark:bg-black`}>
                {activeId && !isModalMode ? (
                    <>
                        <div className="absolute top-4 right-4 z-20">
                            <button
                                onClick={() => setIsModalMode(true)}
                                className="p-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-full text-black dark:text-white transition-all shadow-sm backdrop-blur-md"
                                title="Pop out to Modal"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <ChatInterface
                            conversationId={activeId && !activeId.startsWith('new:') ? activeId : null}
                            recipientId={activeId?.startsWith('new:') ? activeId.split(':')[1] : undefined}
                            otherUserName={activeConversation?.name}
                            onClose={() => setActiveId(null)}
                            onConversationCreated={(id) => {
                                setActiveId(id);
                                refreshConversations('/api/proxy/conversations');
                            }}
                            onMessageSent={() => refreshConversations('/api/proxy/conversations')}
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare size={40} />
                        </div>
                        <h3 className="font-bold text-lg text-black dark:text-white">Your Messages</h3>
                        <p className="max-w-xs text-center mt-2">Send create private photos, messages, and consensus to your friends.</p>
                    </div>
                )}
            </div>

            {/* MODAL VIEW - Active on Mobile (if activeId) OR Desktop (if isModalMode) */}
            {activeId && (
                <div className={`fixed inset-0 z-[150] flex items-center justify-center p-4 
                     ${/* Mobile: Always flex if activeId */ 'flex'}
                     ${/* Desktop: Hidden unless isModalMode */ !isModalMode ? 'md:hidden' : 'md:flex'}
                `}>
                    {/* Backdrop with Blur */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => {
                            // On mobile, closing modal means deselecting conversation? 
                            // Or just minimizing? Usually backing out.
                            if (window.innerWidth < 768) {
                                setActiveId(null);
                            } else {
                                setIsModalMode(false);
                            }
                        }}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative w-full h-full max-w-2xl max-h-[85vh] bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">

                        {/* Header Actions for Modal */}
                        <div className="absolute top-4 right-4 z-20 flex gap-2">
                            <button
                                onClick={() => {
                                    if (window.innerWidth < 768) {
                                        setActiveId(null);
                                    } else {
                                        setIsModalMode(false);
                                    }
                                }}
                                className="p-2 bg-white/50 dark:bg-black/50 hover:bg-white/80 dark:hover:bg-black/80 backdrop-blur-md rounded-full text-black dark:text-white shadow-sm border border-gray-100 dark:border-gray-800"
                            >
                                <Minimize2 size={16} />
                            </button>
                        </div>

                        <ChatInterface
                            conversationId={activeId && !activeId.startsWith('new:') ? activeId : null}
                            recipientId={activeId?.startsWith('new:') ? activeId.split(':')[1] : undefined}
                            otherUserName={activeConversation?.name}
                            onClose={() => {
                                if (window.innerWidth < 768) {
                                    setActiveId(null);
                                } else {
                                    setIsModalMode(false);
                                }
                            }}
                            onConversationCreated={(id) => {
                                setActiveId(id);
                                refreshConversations('/api/proxy/conversations');
                            }}
                            onMessageSent={() => refreshConversations('/api/proxy/conversations')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <MessagesContent />
        </Suspense>
    );
}
