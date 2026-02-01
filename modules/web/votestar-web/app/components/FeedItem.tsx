"use client";

import { MessageSquare, Heart, Share2, MoreHorizontal } from 'lucide-react';
import UserCard from './UserCard';
import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FeedItemProps {
    userId: string;
    userName: string;
    userType?: 'INDIVIDUAL' | 'ORGANIZATION';
    isVerified?: boolean;
    timestamp: string;
    content: ReactNode;
    actions?: ReactNode;
    isActionActive?: boolean;
    isActionDisabled?: boolean;
    actionLabel?: string;
    onActionClick?: () => void;
    href?: string;
    comments_disabled?: boolean;
}

import CommentModal from './CommentModal';

export default function FeedItem({
    userId,
    userName,
    userType,
    isVerified,
    timestamp,
    content,
    actions,
    isActionActive,
    isActionDisabled,
    actionLabel = "Support",
    onActionClick,
    href,
    comments_disabled = false
}: FeedItemProps) {
    const router = useRouter();
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

    const handleCardClick = () => {
        if (href) {
            router.push(href);
        }
    };

    const CardContent = (
        <div className="p-4">
            <div className="flex justify-between items-start mb-4">
                <div onClick={(e) => e.stopPropagation()}>
                    <UserCard
                        userId={userId}
                        name={userName}
                        userType={userType}
                        isVerified={isVerified}
                        timestamp={timestamp}
                        compact
                        showFollowButton={true}
                    />
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors relative z-10"
                >
                    <MoreHorizontal size={20} />
                </button>
            </div>

            <div className="px-1 text-gray-800 dark:text-gray-200">
                {content}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-6 px-1">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onActionClick) {
                            onActionClick();
                        }
                    }}
                    disabled={isActionDisabled}
                    className={`flex items-center gap-2 transition-colors relative z-10 ${isActionActive
                        ? 'text-accent'
                        : isActionDisabled
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:text-accent'
                        }`}
                >
                    <Heart size={20} className={isActionActive ? "fill-current" : ""} />
                    <span className="text-xs font-semibold">{isActionActive ? "Supported" : actionLabel}</span>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsCommentModalOpen(true); }}
                    className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors relative z-10"
                >
                    <MessageSquare size={20} />
                    <span className="text-xs font-semibold">Discuss</span>
                </button>
                <button
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors ml-auto relative z-10"
                >
                    <Share2 size={20} />
                </button>
            </div>
        </div>
    );

    return (
        <>
        <div
            onClick={handleCardClick}
            className={`bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-4 transition-all relative ${href ? 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-700' : ''}`}
        >
            {CardContent}
        </div>
        <CommentModal 
            isOpen={isCommentModalOpen} 
            onClose={() => setIsCommentModalOpen(false)} 
            proposalId={href?.split('/').pop() || ""}
            proposalName={userName + "'s Proposal"}
            commentsDisabled={comments_disabled}
        />
        </>
    );
}
