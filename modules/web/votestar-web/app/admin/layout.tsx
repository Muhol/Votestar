"use client";

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Menu, X } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-900 bg-white dark:bg-black sticky top-0 z-40">
                <h1 className="text-xl font-black text-black dark:text-white">Star<span className="text-accent underline decoration-2 underline-offset-4">Vault</span></h1>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-black dark:text-white"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar with mobile support */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content */}
            <div className="lg:ml-64 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
