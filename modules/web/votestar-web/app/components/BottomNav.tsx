"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, FileText, User } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function BottomNav() {
    const { user } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    const navLinks = [
        { icon: Home, href: '/', label: 'Home' },
        { icon: Compass, href: '/categories', label: 'Explore' },
        { icon: FileText, href: '/proposals', label: 'Hub' },
        { icon: User, href: '/profile', label: 'Profile' }
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/5 dark:bg-black/5 backdrop-blur-2xl border-t border-gray-100 dark:border-gray-900 pb-safe shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto relative">
                {/* Home & Explore */}
                <Link
                    href={navLinks[0].href}
                    className={`flex flex-col items-center gap-1 transition-all ${pathname === navLinks[0].href ? 'text-accent' : 'text-gray-400'}`}
                >
                    <Home size={22} className={pathname === navLinks[0].href ? 'fill-accent/10' : ''} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{navLinks[0].label}</span>
                </Link>

                <Link
                    href={navLinks[1].href}
                    className={`flex flex-col items-center gap-1 transition-all ${pathname === navLinks[1].href ? 'text-accent' : 'text-gray-400'}`}
                >
                    <Compass size={22} className={pathname === navLinks[1].href ? 'fill-accent/10' : ''} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{navLinks[1].label}</span>
                </Link>

                {/* Central Propose Button */}
                <div className="relative -top-3">
                    <Link
                        href="/proposals/new"
                        className="flex items-center justify-center h-14 w-14 bg-accent backdrop-blur  text-white dark:text-black rounded-full shadow-lg shadow-accent/20 active:scale-90 active:bg-accent/60 transition-all group"
                    >
                        <Plus size={28} className="transition-transform group-hover:rotate-90" />
                    </Link>
                </div>

                {/* Proposals & Profile */}
                <Link
                    href={navLinks[2].href}
                    className={`flex flex-col items-center gap-1 transition-all ${pathname === navLinks[2].href ? 'text-accent' : 'text-gray-400'}`}
                >
                    <FileText size={22} className={pathname === navLinks[2].href ? 'fill-accent/10' : ''} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{navLinks[2].label}</span>
                </Link>

                <Link
                    href={navLinks[3].href}
                    className={`flex flex-col items-center gap-1 transition-all ${pathname === navLinks[3].href ? 'text-accent' : 'text-gray-400'}`}
                >
                    <User size={22} className={pathname === navLinks[3].href ? 'fill-accent/10' : ''} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{navLinks[3].label}</span>
                </Link>
            </div>
        </nav>
    );
}
