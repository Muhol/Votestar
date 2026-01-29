"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
    const pathname = usePathname();

    const links = [
        { href: '/admin', label: 'Overview' },
        { href: '/admin/votes', label: 'Vote Ledger' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/moderation', label: 'Moderation' },
        { href: '/admin/settings', label: 'Settings' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                  className="fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity" 
                  onClick={onClose}
                />
            )}

            <div className={`h-screen w-64 bg-white dark:bg-black text-black dark:text-white border-r border-black/10 dark:border-white/10 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-black dark:text-white">Votestar<span className="text-accent">.</span></h1>
                        <p className="text-sm text-accent uppercase tracking-widest mt-1">Admin</p>
                    </div>
                    <button className="lg:hidden p-2 text-black dark:text-white" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onClose}
                                className={`block px-4 py-3 rounded-r-lg transition-all duration-200 font-bold border-l-4 ${isActive
                                    ? 'border-accent bg-accent text-black shadow-md'
                                    : 'border-transparent text-secondary hover:bg-accent/10 hover:text-black dark:text-white dark:hover:text-white'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-black/10 dark:border-white/10">
                    <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-black text-xs font-bold">
                            AD
                        </div>
                        <div>
                            <p className="text-sm font-bold">Admin User</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Super Admin</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
