"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Bell, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from './AuthProvider';
import Avatar from './Avatar';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Categories', href: '/categories' },
    { name: 'Proposals', href: '/proposals' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-lg">V</span>
            </div>
            <span className="text-lg font-bold text-black dark:text-white hidden sm:block">
              Votestar
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-semibold transition-colors ${
                  pathname === link.href 
                    ? 'text-black dark:text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button className="hidden md:block p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  <Search size={20} />
                </button>
                <button className="hidden md:block p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors relative">
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full"></span>
                </button>
                <Link href="/profile" className="hidden md:block">
                  <Avatar 
                    name={user.email.split('@')[0]} 
                    size="sm"
                  />
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden md:block px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block py-2 text-base font-semibold ${
                  pathname === link.href 
                    ? 'text-black dark:text-white' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 py-3"
                  >
                    <Avatar name={user.email.split('@')[0]} size="sm" />
                    <span className="font-semibold text-black dark:text-white">
                      {user.email.split('@')[0]}
                    </span>
                  </Link>
                  <button
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="w-full text-left py-2 text-sm text-gray-600 dark:text-gray-400 font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
