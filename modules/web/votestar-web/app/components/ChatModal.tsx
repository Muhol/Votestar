"use client";

import React from 'react';
import ChatInterface from './ChatInterface';
import { Minimize2 } from 'lucide-react';

interface ChatModalProps {
    isOpen: boolean;
    conversationId: string | null;
    recipientId?: string;
    otherUserName?: string;
    onClose: () => void;
    onConversationCreated?: (id: string) => void;
    onMessageSent?: () => void;
}

export default function ChatModal({ 
    isOpen, 
    conversationId, 
    recipientId, 
    otherUserName, 
    onClose,
    onConversationCreated,
    onMessageSent
}: ChatModalProps) {
    if (!isOpen || (!conversationId && !recipientId)) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:flex">
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full h-full max-w-2xl max-h-[85vh] bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">

                {/* Header Actions for Modal */}
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/50 dark:bg-black/50 hover:bg-white/80 dark:hover:bg-black/80 backdrop-blur-md rounded-full text-black dark:text-white shadow-sm border border-gray-100 dark:border-gray-800"
                        title="Minimize"
                    >
                        <Minimize2 size={16} />
                    </button>
                </div>

                <ChatInterface
                    conversationId={conversationId}
                    recipientId={recipientId}
                    otherUserName={otherUserName}
                    onClose={onClose}
                    onConversationCreated={onConversationCreated}
                    onMessageSent={onMessageSent}
                />
            </div>
        </div>
    );
}
