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

            <div className={`h-screen w-64 bg-white dark:bg-black text-black dark:text-white border-r border-gray-100 dark:border-gray-900 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-black dark:text-white">Star<span className="text-accent underline decoration-4 underline-offset-4">Vault</span></h1>
                        <p className="text-[11px] font-bold text-gray-400 capitalize mt-2">Administrative Protocol</p>
                    </div>
                    <button className="lg:hidden p-2 text-black dark:text-white" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onClose}
                                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${isActive
                                    ? 'bg-accent/10 text-accent ring-1 ring-accent/20'
                                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-gray-100 dark:border-gray-900">
                    <div className="flex items-center space-x-3 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                        <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-black text-sm font-black ring-2 ring-white dark:ring-black">
                            AD
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold truncate">Admin User</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Superuser</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
