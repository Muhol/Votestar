"use client";

import { useEffect, useState } from 'react';
import { X, MessageSquare, Trash2, Clock, Heart, Reply } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '../../lib/api';
import { useAuth } from './AuthProvider';
import Avatar from './Avatar';
import CommentInput from './CommentInput';

interface Comment {
    id: string;
    userId: string;
    auth0Sub: string;
    userName: string;
    content: string;
    timestamp: string;
    likesCount: number;
    isLiked: boolean;
    parentId?: string;
}

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposalId: string;
    proposalName: string;
    commentsDisabled?: boolean;
}

export default function CommentModal({
    isOpen,
    onClose,
    proposalId,
    proposalName,
    commentsDisabled = false
}: CommentModalProps) {
    const { user } = useAuth();
    const { data: comments, mutate, isLoading } = useSWR<Comment[]>(
        isOpen ? `/comments/proposals/${proposalId}` : null,
        fetcher
    );
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

    const handleAddComment = async (content: string, parentId?: string) => {
        try {
            const response = await fetch(`/api/proxy/comments/proposals/${proposalId}`, {
                method: 'POST',
                body: JSON.stringify({ content, parent_id: parentId })
            });

            if (!response.ok) throw new Error('Failed to post comment');
            mutate(); // Revalidate SWR
            setReplyingTo(null);
        } catch (error) {
            console.error(error);
            alert("Failed to post comment. Connection lost or interaction blocked.");
        }
    };

    const handleLike = async (commentId: string) => {
        if (!comments) return;

        // Optimistic Update
        const updatedComments = comments.map(c => {
            if (c.id === commentId) {
                return {
                    ...c,
                    isLiked: !c.isLiked,
                    likesCount: c.isLiked ? c.likesCount - 1 : c.likesCount + 1
                };
            }
            return c;
        });

        mutate(updatedComments, false); // Update locally without revalidation yet

        try {
            const response = await fetch(`/api/proxy/comments/${commentId}/like`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error('Like failed');
            mutate(); // Revalidate with server truth
        } catch (error) {
            console.error(error);
            mutate(); // Rollback on error
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("Delete this comment?")) return;
        try {
            const response = await fetch(`/api/proxy/comments/${commentId}`, {
                method: 'DELETE'
            });
            if (response.ok) mutate();
        } catch (error) {
            console.error(error);
        }
    };

    // Recursive component for rendering comments and their replies
    const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
        const isCurrentUser = user && (String(user.id) === String(comment.auth0Sub) || String(user.id) === String(comment.userId));
        const replies = comments?.filter(c => c.parentId === comment.id) || [];
        const [showReplies, setShowReplies] = useState(false);

        return (
            <div className="space-y-4">
                <div
                    className={`group flex gap-4 animate-in slide-in-from-bottom-2 duration-300 ${isCurrentUser ? 'flex-row-reverse text-right' : ''}`}
                    style={{
                        paddingLeft: !isCurrentUser && depth > 0 ? `${Math.min(depth * 1.5, 4)}rem` : 0,
                        paddingRight: isCurrentUser && depth > 0 ? `${Math.min(depth * 1.5, 4)}rem` : 0
                    }}
                >
                    <Avatar name={comment.userName} size="sm" />
                    <div className={`flex-grow min-w-0 ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                        <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : 'justify-between'}`}>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isCurrentUser ? 'text-accent' : 'text-black dark:text-white'}`}>
                                    {comment.userName}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">• {new Date(comment.timestamp).toLocaleDateString()}</span>
                            </div>
                            {isCurrentUser && (
                                <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        <div className={`max-w-[90%] rounded-2xl px-4 py-3 border relative overflow-hidden transition-all ${isCurrentUser
                                ? 'bg-accent/10 border-accent/20 rounded-tr-none text-black dark:text-white'
                                : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-gray-800 rounded-tl-none text-gray-700 dark:text-gray-300'
                            }`}>
                            <p className="text-sm leading-relaxed font-medium">
                                {comment.content}
                            </p>
                        </div>
                        <div className={`flex items-center gap-4 mt-1.5 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                            <button
                                onClick={() => handleLike(comment.id)}
                                className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-125 ${comment.isLiked ? 'text-rose-500' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <Heart
                                    size={12}
                                    className={`transition-all duration-300 ${comment.isLiked ? 'scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]' : ''}`}
                                    fill={comment.isLiked ? "currentColor" : "none"}
                                />
                                <span className="tabular-nums">{comment.likesCount > 0 ? comment.likesCount : 'Like'}</span>
                            </button>
                            <button
                                onClick={() => setReplyingTo(comment)}
                                className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
                            >
                                <Reply size={12} className="-scale-x-100" />
                                <span>Reply</span>
                            </button>
                        </div>

                        {replies.length > 0 && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className={`flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-black dark:hover:text-white uppercase tracking-widest transition-colors mt-3 ${isCurrentUser ? 'ml-auto flex-row-reverse' : ''}`}
                            >
                                <div className="w-8 h-[1px] bg-gray-300 dark:bg-gray-700"></div>
                                <span>{showReplies ? 'Hide' : `View ${replies.length}`} Replies</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Render children recursively if valid and toggled */}
                {showReplies && replies.map(reply => (
                    <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                ))}
            </div>
        );
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    // Filter top-level comments for the initial render
    const rootComments = comments?.filter(c => !c.parentId) || [];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-900 flex justify-between items-center bg-white/50 dark:bg-black/50 backdrop-blur-xl rounded-t-[2.5rem]">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <MessageSquare size={14} className="text-accent" />
                            <h2 className="text-lg font-black text-black dark:text-white truncate">Consensus Feedback</h2>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{proposalName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-grow overflow-y-auto p-6 space-y-8">
                    {isLoading ? (
                        <div className="py-12 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">Accessing discussion ledger...</div>
                    ) : rootComments.length > 0 ? (
                        rootComments.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} />
                        ))
                    ) : (
                        <div className="py-12 text-center">
                            <Clock size={40} className="mx-auto text-gray-100 dark:text-white/5 mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Be the first to start a discussion</p>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-gray-50 dark:border-gray-900 bg-white/50 dark:bg-black/50 backdrop-blur-xl rounded-b-[2.5rem]">
                    <CommentInput
                        onSend={handleAddComment}
                        disabled={commentsDisabled}
                        placeholder={commentsDisabled ? "Comments are currently disabled" : "Add to the discussion..."}
                        replyingTo={replyingTo ? { id: replyingTo.id, userName: replyingTo.userName } : null}
                        onCancelReply={() => setReplyingTo(null)}
                    />
                </div>
            </div>
        </div>
    );
}

// Small helper for UUID string comparison if needed
function str(val: any) { return String(val); }
