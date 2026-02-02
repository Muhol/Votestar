"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Bell, Search, Star, MessageSquare, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import Avatar from './Avatar';
import useSWR from 'swr';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Categories', href: '/categories' },
    { name: 'Proposals', href: '/proposals' },
    { name: 'Messages', href: '/messages' },
  ];

  // Fetch unread count (polls every 30 seconds for real-time feel)
  const { data: unreadData } = useSWR(
    user ? '/api/proxy/conversations/unread-count' : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return { conversations_with_unread: 0 };
      return res.json();
    },
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );
  const unreadConversations = unreadData?.conversations_with_unread || 0;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  const { data: searchResults } = useSWR(
    debouncedQuery.length >= 2 ? `/api/proxy/users/search?q=${encodeURIComponent(debouncedQuery)}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    }
  );


  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/10 dark:bg-black/10 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-lg font-bold text-black dark:text-white flex items-center">
                Votest<Star size={14} className="fill-accent text-accent mx-[1px]" />r<span className='text-accent font-extrabold'>.</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative text-sm font-semibold transition-colors ${pathname === link.href
                    ? 'text-black dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                    }`}
                >
                  {link.name}
                  {link.name === 'Messages' && unreadConversations > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadConversations > 9 ? '9+' : unreadConversations}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className=" md:block p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <Search size={20} />
                  </button>
                  <Link href="/messages" className="relative md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    <MessageSquare size={20} />
                    {unreadConversations > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ">
                        {unreadConversations > 9 ? '9+' : unreadConversations}
                      </span>
                    )}
                  </Link>
                  <button className=" md:block p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  </button>
                  <div className="relative group hidden md:block">
                    <Link href="/profile" className="flex items-center gap-2 p-1 hover:bg-gray-50 dark:hover:bg-white/5 rounded-full transition-all">
                      <Avatar
                        name={user.email.split('@')[0]}
                        size="sm"
                        className="ring-2 ring-transparent rounded-full group-hover:ring-accent/50 transition-all"
                      />
                    </Link>

                    {/* Hover Submenu */}
                    <div className="absolute right-0 top-full pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                      <div className="w-56 bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl p-2">
                        <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-900 mb-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Authenticated Citizen</p>
                          <p className="text-sm font-bold text-black dark:text-white truncate">{user.email}</p>
                        </div>

                        <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors text-sm font-bold text-gray-600 dark:text-gray-300">
                          View Profile
                        </Link>
                        <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors text-sm font-bold text-gray-600 dark:text-gray-300">
                          Admin Vault
                        </Link>

                        <div className="h-px bg-gray-50 dark:bg-gray-900 my-1 mx-2"></div>

                        <button
                          onClick={() => logout()}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 rounded-2xl transition-colors text-sm font-bold text-red-500"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
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
              {!user && (
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="md:hidden p-2 text-gray-600 dark:text-gray-400"
                >
                  {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              )}
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
                  className={`block py-2 text-base font-semibold ${pathname === link.href
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

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-2xl bg-white dark:bg-black rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <Search className="text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow bg-transparent text-black dark:text-white focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {debouncedQuery.length < 2 && (
                <p className="text-sm text-gray-400 text-center py-8">Type at least 2 characters to search</p>
              )}
              {debouncedQuery.length >= 2 && searchResults?.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No users found</p>
              )}
              {searchResults?.map((user: any) => (
                <button
                  key={user.id}
                  onClick={() => {
                    router.push(`/profile/${user.id}`);
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                >
                  <Avatar name={user.name} size="md" />
                  <div className="flex-grow text-left">
                    <h4 className="text-sm font-bold text-black dark:text-white">{user.name}</h4>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <ChevronLeft size={16} className="text-gray-400 rotate-180" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
