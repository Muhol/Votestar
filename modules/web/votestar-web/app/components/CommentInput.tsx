"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, X, Smile } from 'lucide-react';
import Avatar from './Avatar';
import { useAuth } from './AuthProvider';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';

interface CommentInputProps {
    onSend: (content: string, parentId?: string) => Promise<void>;
    placeholder?: string;
    disabled?: boolean;
    replyingTo?: { id: string; userName: string } | null;
    onCancelReply?: () => void;
}

export default function CommentInput({
    onSend,
    placeholder = "Add a comment...",
    disabled = false,
    replyingTo = null,
    onCancelReply
}: CommentInputProps) {
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { user } = useAuth();
    // Detect system dark mode for initial render, could be improved with a theme context
    const isDarkMode = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Auto-focus on mount and when replying
    useEffect(() => {
        if (!disabled && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [replyingTo, disabled]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSending || disabled) return;

        setIsSending(true);
        try {
            await onSend(content.trim(), replyingTo?.id);
            setContent('');
            if (onCancelReply) onCancelReply();
            setShowEmojiPicker(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const emoji = emojiData.emoji;
        const newText = content.substring(0, start) + emoji + content.substring(end);

        setContent(newText);

        // Return focus to textarea and set cursor after emoji
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        }, 0);
        // Optional: Close picker after selection? Keeping it open allows multiple emojis.
    };

    if (!user) return null;

    return (
        <form onSubmit={handleSubmit} className="flex gap-3 items-center w-full relative">
            <Avatar name={user.email.split('@')[0]} size="sm" />
            <div className="flex-grow flex flex-col gap-1">
                {replyingTo && (
                    <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1 rounded-full w-fit animate-in slide-in-from-left-2 duration-200 mb-1">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Replying to {replyingTo.userName}</span>
                        <button
                            type="button"
                            onClick={onCancelReply}
                            className="text-accent hover:text-black dark:hover:text-white p-0.5"
                        >
                            <X size={12} />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <div className="relative flex-grow flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-2xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-accent transition-all">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={disabled ? "Comments are disabled" : (replyingTo ? `Replying...` : placeholder)}
                            disabled={disabled || isSending}
                            rows={1}
                            className="flex-grow bg-transparent border-none text-sm focus:outline-none resize-none min-h-[32px] max-h-[120px] text-black dark:text-white font-medium py-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />

                        {!replyingTo && (
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`p-1.5 rounded-full transition-all ${showEmojiPicker ? 'bg-accent text-black' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                disabled={disabled}
                            >
                                <Smile size={18} />
                            </button>
                        )}

                        {/* Emoji Picker Popover */}
                        {showEmojiPicker && (
                            <div className="absolute bottom-full right-0 mb-3 z-50 animate-in zoom-in-95 duration-200 origin-bottom-right">
                                <div className="shadow-2xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                                    <EmojiPicker
                                        theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                                        onEmojiClick={onEmojiClick}
                                        width={320}
                                        height={400}
                                        lazyLoadEmojis={true}
                                        previewConfig={{ showPreview: false }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!content.trim() || isSending || disabled}
                        className="p-3 bg-accent text-black rounded-full hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 shadow-lg"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </form>
    );
}
