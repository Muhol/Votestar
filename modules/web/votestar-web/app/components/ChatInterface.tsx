"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Check, CheckCheck, Heart, Reply as ReplyIcon, X, Clock, ChevronLeft, MoreVertical, Trash2, Eraser } from 'lucide-react';
import useSWR from 'swr';
import { useAuth } from './AuthProvider';
import Avatar from './Avatar';
import Skeleton from './Skeleton';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    sender_name: string;
    timestamp: string;
    is_me: boolean;
    status?: 'pending' | 'sent' | 'delivered' | 'read';
    likes_count: number;
    is_liked: boolean;
    reply_to?: {
        id: string;
        content: string;
        sender_name: string;
    };
}

interface ChatInterfaceProps {
    conversationId: string | null;
    recipientId?: string; // For NEW conversations
    otherUserName?: string;
    onClose?: () => void; // For modal model
    onConversationCreated?: (id: string) => void;
    onMessageSent?: () => void; // To refresh previews
}

const fetcher = async (url: string) => {
    console.log('[DEBUG-FETCH] Fetching:', url);
    const res = await fetch(url);
    if (!res.ok) {
        console.error('[DEBUG-FETCH] Error:', res.status, res.statusText);
        throw new Error('Failed to fetch');
    }
    const data = await res.json();
    console.log('[DEBUG-FETCH] Data received:', data);
    return data;
};

export default function ChatInterface({ 
    conversationId, 
    recipientId, 
    otherUserName, 
    onClose, 
    onConversationCreated,
    onMessageSent 
}: ChatInterfaceProps) {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeCid, setActiveCid] = useState<string | null>(conversationId);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [isCheckingExisting, setIsCheckingExisting] = useState(false);

    // Sync activeCid when conversationId prop changes
    useEffect(() => {
        setActiveCid(conversationId);
    }, [conversationId]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch messages with debug logs
    const { data: serverMessages, mutate, isLoading: swrLoading, error } = useSWR<Message[]>(
        activeCid ? `/api/proxy/conversations/${activeCid}/messages` : null,
        fetcher,
        {
            revalidateOnFocus: true,
            revalidateOnMount: true,
            dedupingInterval: 0,
        }
    );

    // Debug Render
    console.log('[ChatInterface] Render:', {
        conversationId,
        swrLoading,
        hasServerMessages: !!serverMessages,
        messagesLen: serverMessages?.length,
        error: !!error
    });

    if (!activeCid && !recipientId) {
        console.warn('[ChatInterface] No conversationId or recipientId provided!');
    }

    // Sync server messages to local state
    const [messages, setMessages] = useState<Message[] | undefined>(undefined);

    useEffect(() => {
        if (serverMessages) {
            console.log('[ChatInterface] Syncing server messages to local state', serverMessages.length);
            setMessages(serverMessages);
        }
    }, [serverMessages]);

    // Simplified loading state
    const isLoading = (swrLoading && !messages) || isCheckingExisting;
    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!activeCid && recipientId) {
            const findDM = async () => {
                setIsCheckingExisting(true);
                try {
                    const res = await fetch('/api/proxy/conversations');
                    if (res.ok) {
                        const conversations = await res.json() as Array<{ id: string, other_user_id: string }>;
                        const existing = conversations.find((c) => c.other_user_id === recipientId);
                        if (existing) {
                            console.log('[ChatInterface] Found existing DM:', existing.id);
                            setActiveCid(existing.id);
                        }
                    }
                } catch (e) {
                    console.error("Failed to check for existing DM", e);
                } finally {
                    setIsCheckingExisting(false);
                }
            };
            findDM();
        }
    }, [activeCid, recipientId]);

    // Auto-focus input on mount and when replying
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [replyingTo, conversationId]); // Re-focus when switching chats or replying

    // Mark messages as read when viewing conversation
    useEffect(() => {
        if (!conversationId || !user) return;
        const cid = conversationId;

        // Small delay to ensure we're actually viewing the chat
        const timer = setTimeout(async () => {
            try {
                // 1. Update PostgreSQL (Source of Truth)
                await fetch(`/api/proxy/conversations/${cid}/read`, {
                    method: 'POST'
                });
                console.log('[Read] Marked messages as read in DB');

                // 2. Update Firestore (Real-time Sync)
                import('firebase/firestore').then(async ({ collection, query, where, getDocs, writeBatch }) => {
                    const { db } = await import('@/lib/firebase');
                    const messagesRef = collection(db, 'conversations', cid as string, 'messages');

                    const q = query(
                        messagesRef,
                        where('status', '!=', 'read')
                    );

                    const snapshot = await getDocs(q);
                    if (snapshot.empty) return;

                    const batch = writeBatch(db);
                    let count = 0;

                    snapshot.forEach((doc) => {
                        const data = doc.data();
                        if (data.sender_id !== user.id && data.status !== 'read') {
                            batch.update(doc.ref, { status: 'read' });
                            count++;
                        }
                    });

                    if (count > 0) {
                        await batch.commit();
                    }
                });

            } catch (error) {
                console.error('[Read] Failed to mark as read:', error);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [conversationId, user]);

    // Firestore real-time listener
    useEffect(() => {
        if (!conversationId || !user || !serverMessages) return;
        const cid = conversationId;

        console.log('[Firestore] Setting up real-time listener for conversation:', cid);

        let unsubscribe: (() => void) | undefined;

        const setupListener = async () => {
            try {
                const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                const messagesRef = collection(db, 'conversations', cid as string, 'messages');
                const q = query(messagesRef, orderBy('created_at', 'asc'));

                unsubscribe = onSnapshot(q, (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            const firestoreMsg = change.doc.data();

                            if (firestoreMsg.sender_id !== user.id && firestoreMsg.status !== 'read') {
                                import('firebase/firestore').then(({ updateDoc }) => {
                                    updateDoc(change.doc.ref, { status: 'read' });
                                });
                                fetch(`/api/proxy/conversations/${cid}/read`, { method: 'POST' });
                            }

                            mutate((current) => {
                                if (!current || current.some(m => m.id === firestoreMsg.id)) return current;

                                const enrichedMessage: Message = {
                                    id: firestoreMsg.id,
                                    content: firestoreMsg.content,
                                    sender_id: firestoreMsg.sender_id,
                                    sender_name: firestoreMsg.sender_name,
                                    timestamp: firestoreMsg.timestamp,
                                    is_me: firestoreMsg.sender_id === user.id,
                                    status: firestoreMsg.status,
                                    likes_count: 0,
                                    is_liked: false,
                                    reply_to: firestoreMsg.reply_to
                                };

                                return [...current, enrichedMessage];
                            }, false);
                        } else if (change.type === 'modified') {
                            const firestoreMsg = change.doc.data();
                            mutate((current) => {
                                if (!current) return current;
                                return current.map(m =>
                                    m.id === firestoreMsg.id
                                        ? { ...m, status: firestoreMsg.status }
                                        : m
                                );
                            }, false);
                        }
                    });
                });
            } catch (err) {
                console.error('Failed to setup listener', err);
            }
        };

        setupListener();
        return () => unsubscribe?.();
    }, [conversationId, user, mutate, serverMessages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!content.trim() || isSending || !user) return;
        if (!activeCid && !recipientId) return;

        setIsSending(true);
        let cid = activeCid;
        const replyId = replyingTo?.id;
        const messageContent = content.trim();
        const tempId = `temp-${Date.now()}`;

        // Lazy DM Initialization if needed
        if (!cid && recipientId) {
            try {
                console.log('[LazyInit] Creating conversation with:', recipientId);
                const res = await fetch('/api/proxy/conversations/dm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recipient_id: recipientId })
                });
                if (!res.ok) throw new Error('Failed to create conversation');
                const data = await res.json();
                cid = data.id;
                setActiveCid(cid);
                onConversationCreated?.(cid as string);
            } catch (err) {
                console.error('[LazyInit] Error:', err);
                setIsSending(false);
                alert("Failed to start conversation. Please try again.");
                return;
            }
        }

        const pendingMessage: Message = {
            id: tempId,
            content: messageContent,
            sender_id: user.id,
            sender_name: user.email?.split('@')[0] || 'User',
            timestamp: new Date().toISOString(),
            is_me: true,
            status: 'pending',
            likes_count: 0,
            is_liked: false,
            reply_to: replyingTo ? {
                id: replyingTo.id,
                content: replyingTo.content,
                sender_name: replyingTo.sender_name
            } : undefined
        };

        mutate((current) => current ? [...current, pendingMessage] : [pendingMessage], false);
        setContent('');
        setReplyingTo(null);
        setShowEmoji(false);

        try {
            const res = await fetch(`/api/proxy/conversations/${cid}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: messageContent,
                    reply_to_id: replyId
                })
            });

            if (!res.ok) throw new Error('Failed to send message');
            const savedMessage = await res.json();

            mutate((current) => {
                if (!current) return current;
                return current.map(m =>
                    m.id === tempId ? { ...m, id: savedMessage.id, status: 'sent' as const } : m
                );
            }, false);

            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const messagesRef = collection(db, 'conversations', cid as string, 'messages');
            await addDoc(messagesRef, {
                id: savedMessage.id,
                content: messageContent,
                sender_id: user.id,
                sender_name: user.email?.split('@')[0] || 'User',
                timestamp: savedMessage.timestamp,
                status: savedMessage.status,
                reply_to: replyingTo ? {
                    id: replyingTo.id,
                    content: replyingTo.content,
                    sender_name: replyingTo.sender_name
                } : null,
                created_at: serverTimestamp()
            });
            onMessageSent?.();
        } catch (error) {
            console.error("Failed to send", error);
            mutate((current) => current?.filter(m => m.id !== tempId), false);
        } finally {
            setIsSending(false);
        }
    };

    const handleLike = async (messageId: string) => {
        if (!messages) return;

        // Optimistic Update
        const updatedMessages = messages.map(m => {
            if (m.id === messageId) {
                return {
                    ...m,
                    is_liked: !m.is_liked,
                    likes_count: m.is_liked ? m.likes_count - 1 : m.likes_count + 1
                };
            }
            return m;
        });
        mutate(updatedMessages, false);

        try {
            await fetch(`/api/proxy/messages/${messageId}/like`, { method: 'POST' });
            mutate(); // Revalidate
        } catch (error) {
            console.error("Failed to like", error);
            mutate(); // Rollback
        }
    };

    const handleClearChat = async () => {
        if (!activeCid || !window.confirm("Are you sure you want to clear all messages? This cannot be undone.")) return;
        
        setIsClearing(true);
        try {
            // 1. Backend PostgreSQL clear
            const res = await fetch(`/api/proxy/conversations/${activeCid}/clear`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to clear chat in DB");

            // 2. Local state clear
            mutate([], false);
            setShowMoreMenu(false);

            // 3. Firestore clear (simplified batch delete)
            const { collection, getDocs, writeBatch, query } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const messagesRef = collection(db, 'conversations', activeCid, 'messages');
            const snapshot = await getDocs(query(messagesRef));
            
            const batch = writeBatch(db);
            snapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            console.log('[Clear] Chat history cleared successfully');
            onMessageSent?.(); // Update preview
        } catch (error) {
            console.error("Failed to clear chat:", error);
            alert("Failed to clear chat. Please try again.");
        } finally {
            setIsClearing(false);
        }
    };

    const handleDeleteChat = async () => {
        if (!activeCid || !window.confirm("Are you sure you want to delete this conversation? All messages will be lost.")) return;

        setIsDeleting(true);
        try {
            // 1. Backend PostgreSQL delete
            const res = await fetch(`/api/proxy/conversations/${activeCid}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to delete conversation in DB");

            // 2. Firestore delete (cascading delete for messages handled by client or just cleanup)
            const { collection, getDocs, writeBatch, query, deleteDoc, doc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            
            // Delete messages first
            const messagesRef = collection(db, 'conversations', activeCid, 'messages');
            const snapshot = await getDocs(query(messagesRef));
            const batch = writeBatch(db);
            snapshot.forEach(child => batch.delete(child.ref));
            await batch.commit();

            // Delete conversation doc if it exists
            const convRef = doc(db, 'conversations', activeCid);
            await deleteDoc(convRef);

            setShowMoreMenu(false);
            onMessageSent?.(); // Update previews
            onClose?.(); // Close the modal / navigate away
            
            // Trigger inbox refresh
            mutate();

            console.log('[Delete] Conversation deleted successfully');
        } catch (error) {
            console.error("Failed to delete chat:", error);
            alert("Failed to delete chat. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setContent(prev => prev + emojiData.emoji);
    };

    const scrollToMessage = (id: string) => {
        const el = document.getElementById(`msg-${id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    if (!user) return <div className="p-4 text-center">Please login to chat.</div>;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black w-full relative">
            {/* Header (optional if handled by parent, but good for context) */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-black/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    {onClose && (
                        <button onClick={onClose} className="p-1 -ml-2 mr-1 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white rounded-full transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <Avatar name={otherUserName || "User"} size="sm" />
                    <div>
                        <h3 className="font-bold text-sm text-black dark:text-white">{otherUserName || "Chat"}</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Now</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* More Actions Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all"
                            title="More actions"
                        >
                            <MoreVertical size={20} />
                        </button>

                        {showMoreMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-[100]"
                                    onClick={() => setShowMoreMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-1 z-[110] animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        onClick={handleClearChat}
                                        disabled={isClearing || isDeleting}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {isClearing ? (
                                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Eraser size={16} />
                                        )}
                                        {isClearing ? 'Clearing...' : 'Clear History'}
                                    </button>
                                    <button
                                        onClick={handleDeleteChat}
                                        disabled={isClearing || isDeleting}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                        {isDeleting ? 'Deleting...' : 'Delete Chat'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Close button for desktop */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="hidden md:flex p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all"
                            title="Close chat"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-6 scroll-smooth bg-[url('/grid-pattern.svg')] bg-fixed">
                {isLoading ? (
                    // Loading Skeletons for Messages
                    <div className="space-y-6 mt-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={`flex flex-col gap-1 max-w-[70%] ${i % 2 === 0 ? 'ml-auto items-end' : 'items-start'}`}>
                                <div className={`flex items-end gap-2 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                                    <Skeleton className="w-8 h-8 rounded-full" />
                                    <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
                                </div>
                                <Skeleton className="h-3 w-16 opacity-50" />
                            </div>
                        ))}
                    </div>
                ) : (messages?.length === 0 || (!activeCid && !isLoading)) ? (
                    <div className="text-center py-10 opacity-50">
                        <Avatar name={otherUserName || "?"} size="lg" className="mx-auto mb-4" />
                        <p className="text-sm text-gray-400">
                            {!activeCid 
                                ? `Start a new conversation with ${otherUserName || 'this user'}` 
                                : `No previous messages with ${otherUserName || 'this user'}`
                            }
                        </p>
                    </div>
                ) : null}

                {messages?.map((msg, i) => {
                    const isSequential = i > 0 && messages[i - 1].sender_id === msg.sender_id;
                    return (
                        <div id={`msg-${msg.id}`} key={msg.id} className={`flex w-full ${msg.is_me ? 'justify-end' : 'justify-start'} ${isSequential ? 'mt-2' : 'mt-6'}`}>
                            <div className={`max-w-[85%] md:max-w-[70%] group relative flex flex-col ${msg.is_me ? 'items-end' : 'items-start'}`}>

                                {/* Reply Preview Badge */}
                                {msg.reply_to && (
                                    <button
                                        onClick={() => scrollToMessage(msg.reply_to!.id)}
                                        className={`mb-1 px-3 py-1 rounded-full text-[10px] bg-gray-100 dark:bg-white/10 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors flex items-center gap-1 max-w-full truncate ${msg.is_me ? 'mr-2' : 'ml-2'}`}
                                    >
                                        <ReplyIcon size={10} className="scale-x-[-1]" />
                                        <span className="font-bold">{msg.reply_to.sender_name}</span>
                                        <span className="truncate opacity-70">: {msg.reply_to.content}</span>
                                    </button>
                                )}

                                {/* Main Bubble */}
                                <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed backdrop-blur-md shadow-sm border transition-all hover:shadow-md
                                    ${msg.is_me
                                        ? 'bg-accent/10 border-accent/20 text-black dark:text-white rounded-tr-none'
                                        : 'bg-white/60 dark:bg-white/5 border-gray-200 dark:border-white/10 text-black dark:text-white rounded-tl-none'
                                    }
                                `}>
                                    {msg.content}

                                    {/* Interaction Toolbar (Hover Only) */}
                                    <div className={`absolute -bottom-8 ${msg.is_me ? 'right-0' : 'left-0'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-1`}>
                                        <button
                                            onClick={() => handleLike(msg.id)}
                                            className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${msg.is_liked ? 'text-red-500' : 'text-gray-400'}`}
                                            title="Like"
                                        >
                                            <Heart size={14} fill={msg.is_liked ? "currentColor" : "none"} />
                                        </button>
                                        <button
                                            onClick={() => setReplyingTo(msg)}
                                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
                                            title="Reply"
                                        >
                                            <ReplyIcon size={14} className="scale-x-[-1]" />
                                        </button>
                                    </div>

                                    {/* Message Info inside Bubble (Bottom Right) */}
                                    <div className="flex items-center justify-end gap-1 mt-1 select-none">
                                        <span className="text-[9px] text-gray-400/80 font-medium">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {msg.likes_count > 0 && (
                                            <div className="flex items-center gap-0.5 bg-white/50 dark:bg-black/20 rounded-full px-1.5 py-0.5 ml-1">
                                                <Heart size={8} className="text-red-500" fill="currentColor" />
                                                <span className="text-[8px] font-bold opacity-70">{msg.likes_count}</span>
                                            </div>
                                        )}
                                        {msg.is_me && (
                                            msg.status === 'pending' ? (
                                                <Clock size={12} className="text-gray-400/80 ml-0.5 animate-pulse" />
                                            ) : msg.status === 'read' ? (
                                                <CheckCheck size={14} className="text-accent ml-0.5" />
                                            ) : msg.status === 'delivered' ? (
                                                <CheckCheck size={12} className="text-gray-400/80 ml-0.5" />
                                            ) : (
                                                <Check size={12} className="text-gray-400/80 ml-0.5" />
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {/* Spacer */}
                <div className="h-4" />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                {replyingTo && (
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-t-2xl mb-2 text-xs border border-gray-100 dark:border-white/5 mx-2">
                        <div className="flex flex-col gap-0.5 min-w-0 w-full">
                            <div className="flex items-center gap-2">
                                <ReplyIcon size={12} className="text-accent scale-x-[-1]" />
                                <span className="font-bold text-gray-600 dark:text-gray-300">Replying to {replyingTo.sender_name}</span>
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 truncate text-[11px] pl-2 border-l-2 border-accent/50 ml-1 opacity-80">
                                {replyingTo.content}
                            </div>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-black dark:hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-gray-50 dark:bg-white/5 p-2 rounded-3xl border border-transparent focus-within:border-accent transition-colors">
                    <button
                        type="button"
                        onClick={() => setShowEmoji(!showEmoji)}
                        className={`p-2 rounded-full transition-colors self-center ${showEmoji ? 'text-accent' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Smile size={20} />
                    </button>

                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
                        className="flex-grow bg-transparent outline-none border-none focus:ring-0 text-sm max-h-32 min-h-[40px] py-2.5 resize-none text-black dark:text-white placeholder:text-gray-400"
                        rows={1}
                    />

                    <button
                        type="submit"
                        disabled={!content.trim() || isSending}
                        className="p-2.5 rounded-full bg-accent text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-center"
                    >
                        <Send size={18} />
                    </button>

                    {/* Emoji Popover */}
                    {showEmoji && (
                        <div className="absolute bottom-full left-0 mb-4 z-50">
                            <div className="shadow-2xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    width={300}
                                    height={400}
                                    theme={Theme.AUTO}
                                    skinTonesDisabled
                                />
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
