"use client";

import { Search, Plus, ChevronLeft, X, Check, CheckCheck, Clock, MessageSquare, MoreVertical, Trash2 } from 'lucide-react';
import Avatar from './Avatar';
import Skeleton from './Skeleton';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Conversation {
    id: string;
    name?: string;
    other_user_id: string;
    unread_count: number;
    updated_at: string;
    last_message_is_me?: boolean;
    last_message_status?: string;
    last_message_preview?: string;
}

interface InboxSidebarProps {
    conversations: Conversation[] | null;
    activeId: string | null;
    onSelect: (id: string) => void;
    onDelete?: (id: string) => void;
    isLoading?: boolean;
    error?: unknown;
}

export default function InboxSidebar({ conversations, activeId, onSelect, onDelete, isLoading, error }: InboxSidebarProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [startingDMId, setStartingDMId] = useState<string | null>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch search results
    const { data: searchResults } = useSWR(
        debouncedQuery.length >= 2 ? `/api/proxy/users/search?q=${encodeURIComponent(debouncedQuery)}` : null,
        async (url) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Search failed');
            return res.json();
        }
    );

    const handleStartDM = async (userId: string) => {
        if (startingDMId) return;
        setStartingDMId(userId);
        try {
            // Check if conversation already exists in our list
            const existing = conversations?.find((c) => c.other_user_id === userId);
            if (existing) {
                onSelect(existing.id);
            } else {
                // Lazy: Pass a temporary ID that the parent can catch
                onSelect(`new:${userId}`);
            }
            setSearchQuery('');
            setIsSearching(false);
        } catch (error) {
            console.error('Error starting DM:', error);
        } finally {
            setStartingDMId(null);
        }
    };

    const handleDelete = async (e: React.MouseEvent, convId: string) => {
        e.stopPropagation();
        if (isDeletingId) return;
        if (!window.confirm("Delete this conversation? All messages will be lost.")) return;

        setIsDeletingId(convId);
        try {
            const res = await fetch(`/api/proxy/conversations/${convId}`, { method: 'DELETE' });
            if (res.ok) {
                // Delete from Firestore too (cleanup)
                try {
                    const { doc, deleteDoc, collection, getDocs, writeBatch, query } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase');
                    
                    // Cleanup messages in Firestore
                    const messagesRef = collection(db, 'conversations', convId, 'messages');
                    const snapshot = await getDocs(query(messagesRef));
                    const batch = writeBatch(db);
                    snapshot.forEach(child => batch.delete(child.ref));
                    await batch.commit();

                    // Delete conversation doc
                    await deleteDoc(doc(db, 'conversations', convId));
                } catch (fiErr) {
                    console.warn('Firestore cleanup failed during delete:', fiErr);
                }

                onDelete?.(convId);
                if (activeId === convId) onSelect('');
            } else {
                alert("Failed to delete conversation");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while deleting.");
        } finally {
            setIsDeletingId(null);
            setActionMenuId(null);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-black border-r border-gray-100 dark:border-gray-800">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/50 dark:bg-black/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.back()}
                        className="md:hidden p-1 -ml-1 text-black dark:text-white"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-xl font-black text-black dark:text-white">Messages</h2>
                </div>
                <button
                    onClick={() => setIsSearching(!isSearching)}
                    className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:opacity-80 transition-opacity shadow-lg"
                >
                    {isSearching ? <X size={20} /> : <Plus size={20} />}
                </button>
            </div>

            {/* Search */}
            {isSearching && (
                <div className="p-4 pt-0 mt-4">
                    <div className="relative bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent focus-within:border-accent transition-colors">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm focus:outline-none text-black dark:text-white"
                            autoFocus
                        />
                    </div>

                    {/* Search Results */}
                    {debouncedQuery.length >= 2 && (
                        <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                            {searchResults?.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-4">No users found</p>
                            )}
                            {searchResults?.map((user: { id: string, name: string, email: string }) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleStartDM(user.id)}
                                        disabled={startingDMId === user.id}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                                            startingDMId === user.id ? 'bg-accent/5 animate-pulse' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <Avatar name={user.name} size="sm" />
                                        <div className="flex-grow text-left">
                                            <h4 className="text-sm font-bold text-black dark:text-white">{user.name}</h4>
                                            <p className="text-xs text-gray-400">{user.email}</p>
                                        </div>
                                        {startingDMId === user.id ? (
                                            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <MessageSquare size={16} className="text-gray-400" />
                                        )}
                                    </button>
                            ))}
                        </div> 
                    )}
                </div>
            )}

            {/* Conversations List */}
            <div className="flex-grow overflow-y-auto px-2 space-y-1 pb-4">
                {error ? (
                    <div className="p-4 text-center">
                        <p className="text-red-500 text-sm font-medium mb-2">Failed to load conversations</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="text-xs px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : isLoading ? (
                    // Loading Skeletons
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3">
                            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                            <div className="flex-grow space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-12" />
                                </div>
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    ))
                ) : (
                    (conversations || []).map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={`w-full group flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer relative ${activeId === conv.id
                                ? 'bg-accent/10'
                                : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <div className="relative">
                                <Avatar name={conv.name || "Unknown"} size="md" />
                                {conv.unread_count > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                        {conv.unread_count > 99 ? '99+' : conv.unread_count}
                                    </span>
                                )}
                            </div>
                            <div className="flex-grow text-left overflow-hidden min-w-0 pr-6">
                                <div className="flex justify-between items-baseline">
                                    <h4 className={`text-sm font-bold truncate ${conv.unread_count > 0 ? 'text-black dark:text-white' : activeId === conv.id ? 'text-accent' : 'text-black dark:text-white'}`}>
                                        {conv.name || "Conversation"}
                                    </h4>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {new Date(conv.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                    {conv.last_message_is_me && (
                                        <span className={conv.last_message_status === 'read' ? 'text-accent' : 'text-gray-400'}>
                                            {conv.last_message_status === 'pending' ? <Clock size={12} /> :
                                             conv.last_message_status === 'read' ? <CheckCheck size={12} /> :
                                             conv.last_message_status === 'delivered' ? <CheckCheck size={12} /> :
                                             <Check size={12} />}
                                        </span>
                                    )}
                                    <p className={`text-xs truncate ${conv.unread_count > 0 ? 'text-black dark:text-white font-semibold' : activeId === conv.id ? 'text-gray-600 dark:text-gray-300 font-medium' : 'text-gray-400'}`}>
                                        {conv.last_message_preview || "View conversation"}
                                    </p>
                                </div>
                            </div>
                            
                            {/* More Actions Icon */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActionMenuId(actionMenuId === conv.id ? null : conv.id);
                                    }}
                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-400"
                                >
                                    <MoreVertical size={16} />
                                </button>
                                
                                {actionMenuId === conv.id && (
                                    <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl p-1 z-[20] animate-in fade-in zoom-in-95 duration-100">
                                        <button
                                            onClick={(e) => handleDelete(e, conv.id)}
                                            disabled={isDeletingId === conv.id}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            {isDeletingId === conv.id ? (
                                                <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 size={14} />
                                            )}
                                            {isDeletingId === conv.id ? 'Deleting...' : 'Delete Chat'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {!isLoading && conversations?.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        No messages yet
                    </div>
                )}
            </div>
        </div>
    );
}
