"use client";

import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';
import FollowButton from './FollowButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

interface UserCardProps {
    userId: string;
    name: string;
    userType?: "INDIVIDUAL" | "ORGANIZATION" | undefined;
    isVerified?: boolean;
    bio?: string;
    avatarSrc?: string;
    showFollowButton?: boolean;
    timestamp?: string;
    compact?: boolean;
    onMessage?: (userId: string, userName: string) => void;
    isMessageLoading?: boolean;
}

export default function UserCard({
    userId,
    name,
    userType = 'INDIVIDUAL',
    isVerified = false,
    bio,
    avatarSrc,
    showFollowButton = true,
    timestamp,
    compact = false,
    onMessage,
    isMessageLoading = false
}: UserCardProps) {
    const router = useRouter();
    return (
        <div className={`flex items-start gap-3 ${compact ? '' : 'p-4'}`}>
            <Link href={`/profile/${userId}`}>
                <Avatar src={avatarSrc} name={name} size={compact ? 'sm' : 'md'} />
            </Link>

            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/profile/${userId}`} className="hover:underline">
                        <span className={`font-bold text-black dark:text-white ${compact ? 'text-sm' : 'text-base'}`}>
                            {name}
                        </span>
                    </Link>
                    <VerifiedBadge isVerified={isVerified} type={userType} />
                    {timestamp && (
                        <>
                            <span className="text-gray-400">·</span>
                            <span className="text-sm text-gray-500">{timestamp}</span>
                        </>
                    )}
                </div>

                {bio && !compact && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {bio}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-2 items-end">
                {showFollowButton && (
                    <FollowButton targetUserId={userId} />
                )}
                {!compact && (
                    <button 
                        onClick={() => {
                            if (isMessageLoading) return;
                            if (onMessage) {
                                onMessage(userId, name);
                            } else {
                                router.push(`/messages?start_dm=${userId}`);
                            }
                        }}
                        disabled={isMessageLoading}
                        className={`p-2 rounded-full transition-all ${
                            isMessageLoading 
                            ? 'bg-accent/5 text-accent animate-pulse' 
                            : 'text-gray-400 hover:text-accent hover:bg-accent/10'
                        }`}
                        title={isMessageLoading ? "Initializing Chat..." : "Send Message"}
                    >
                        {isMessageLoading ? (
                            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <MessageSquare size={20} />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
