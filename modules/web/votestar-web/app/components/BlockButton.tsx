"use client";

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { ShieldOff, ShieldAlert, Loader2 } from 'lucide-react';
import { mutate } from 'swr';

interface BlockButtonProps {
    targetUserId: string;
    isBlocked: boolean;
    onUpdate?: () => void;
    variant?: 'menu-item' | 'button';
}

export default function BlockButton({ targetUserId, isBlocked, onUpdate, variant = 'menu-item' }: BlockButtonProps) {
    const { user } = useAuth();
    const [isPending, setIsPending] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user || isPending) return;

        const confirmMessage = isBlocked 
            ? "Are you sure you want to unblock this citizen? They will be able to see your content again."
            : "Are you sure you want to block this citizen? You will no longer see each other's content, and all existing follows will be removed.";
        
        if (!confirm(confirmMessage)) return;

        setIsPending(true);

        const method = isBlocked ? 'DELETE' : 'POST';

        try {
            const response = await fetch(`/api/proxy/users/${targetUserId}/block`, {
                method
            });

            if (response.ok) {
                // Revalidate profile and follows as blocking affects both
                mutate(`/users/${targetUserId}/profile`);
                mutate(`/users/${user.id}/following`);
                if (onUpdate) onUpdate();
            } else {
                alert("Failed to update block status. Please try again.");
            }
        } catch (err) {
            console.error("Block error:", err);
            alert("An error occurred. Please try again.");
        } finally {
            setIsPending(false);
        }
    };

    if (!user || user.id === targetUserId) return null;

    if (variant === 'menu-item') {
        return (
            <button
                onClick={handleToggle}
                disabled={isPending}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors text-sm font-bold ${
                    isBlocked ? 'text-green-500' : 'text-red-500'
                }`}
            >
                {isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : isBlocked ? (
                    <ShieldOff size={16} />
                ) : (
                    <ShieldAlert size={16} />
                )}
                <span>{isBlocked ? 'Unblock Citizen' : 'Block Citizen'}</span>
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`flex items-center justify-center space-x-2 px-6 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                isBlocked
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20'
                    : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
            }`}
        >
            {isPending ? (
                <Loader2 size={14} className="animate-spin" />
            ) : isBlocked ? (
                <>
                    <ShieldOff size={14} />
                    <span>Unblock</span>
                </>
            ) : (
                <>
                    <ShieldAlert size={14} />
                    <span>Block</span>
                </>
            )}
        </button>
    );
}
