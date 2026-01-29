"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../../lib/api';

interface FollowButtonProps {
    targetUserId: string;
    initialIsFollowing?: boolean;
    onUpdate?: () => void;
}

export default function FollowButton({ targetUserId, initialIsFollowing, onUpdate }: FollowButtonProps) {
    const { user } = useAuth();
    const [isPending, setIsPending] = useState(false);
    
    // Internal state for immediate feedback
    const [localIsFollowing, setLocalIsFollowing] = useState<boolean | undefined>(initialIsFollowing);

    // Get current user's follow list to sync (fallback/global state)
    const { data: following, isLoading: followingLoading } = useSWR(user ? `/users/${user.id}/following` : null, fetcher);
    
    // Sync local state with SWR data if it arrives/changes
    useEffect(() => {
        if (following) {
            setLocalIsFollowing(following.includes(targetUserId));
        }
    }, [following, targetUserId]);

    const isFollowing = localIsFollowing ?? following?.includes(targetUserId) ?? false;

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user || isPending) return;

        // Optimistic update
        const nextState = !isFollowing;
        setLocalIsFollowing(nextState);
        setIsPending(true);

        const method = isFollowing ? 'DELETE' : 'POST';

        try {
            const response = await fetch(`/api/proxy/users/${targetUserId}/follow`, {
                method
            });

            if (response.ok) {
                // Sync the global cache
                if (following) {
                    const newFollowing = nextState
                        ? [...following, targetUserId]
                        : following.filter((id: string) => id !== targetUserId);
                    mutate(`/users/${user.id}/following`, newFollowing, false);
                }
                
                // Revalidate
                mutate(`/users/${user.id}/following`);
                if (onUpdate) onUpdate();
            } else {
                // Rollback on error
                setLocalIsFollowing(isFollowing);
            }
        } catch (err) {
            console.error("Follow error:", err);
            setLocalIsFollowing(isFollowing);
        } finally {
            setIsPending(false);
        }
    };

    if (!user || user.id === targetUserId) return null;

    return (
        <button
            onClick={handleToggle}
            disabled={isPending || (followingLoading && localIsFollowing === undefined)}
            className={`flex items-center justify-center space-x-2 px-6 py-2 rounded-full text-xs font-bold transition-all active:scale-95 min-w-[100px] shadow-sm ${
                isFollowing
                    ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-500 hover:border-red-100'
                    : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
            }`}
        >
            {isPending ? (
                <Loader2 size={14} className="animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserCheck size={14} />
                    <span>Following</span>
                </>
            ) : (
                <>
                    <UserPlus size={14} />
                    <span>Follow</span>
                </>
            )}
        </button>
    );
}
