"use client";

import { useAuth } from './components/AuthProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../lib/api';
import FeedItem from './components/FeedItem';
import { Sparkles, TrendingUp, Star } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Fetch data for the feed
  const { data: proposals, isLoading: proposalsLoading } = useSWR('/proposals', fetcher);
  const { data: trending } = useSWR('/categories', fetcher); // Placeholder for trending

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/welcome');
    }
  }, [user, authLoading, router]);

  const handleSign = async (id: string) => {
    try {
      const response = await fetch(`/api/proxy/proposals/${id}/sign`, {
        method: 'POST'
      });
      if (response.ok) {
        mutate('/proposals');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Synchronizing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 md:flex md:gap-8 min-h-screen">
        {/* Main Feed Column */}
        <div className="flex-grow md:max-w-2xl">
          {/* Create Post/Proposal CTA */}
          <div className="hidden md:flex bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-6 items-center gap-4">
            <Link href="/profile">
              <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center font-bold">
                {user.email[0].toUpperCase()}
              </div>
            </Link>
            <Link
              href="/proposals"
              className="flex-grow bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors rounded-full px-5 py-2.5 text-gray-500 text-sm font-medium text-left"
            >
              Propose a new category for the Wall...
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={20} className="text-accent" />
            <h2 className="text-xl font-bold text-black dark:text-white">Global Consensus Feed</h2>
          </div>

          {proposalsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-white dark:bg-white/5 rounded-2xl animate-pulse border border-gray-200 dark:border-gray-800"></div>
              ))}
            </div>
          ) : proposals && proposals.length > 0 ? (
            <div className="space-y-4">
              {(proposals as any[]).map((item) => (
                <FeedItem
                  key={item.id}
                  userId={item.creator_id || 'system'}
                  userName={item.creator_name || 'System'}
                  userType={item.creator_type}
                  isVerified={item.creator_verified}
                  timestamp={new Date(item.created_at).toLocaleDateString()}
                  isActionActive={item.has_signed}
                  onActionClick={() => handleSign(item.id)}
                  href={`/proposals/${item.id}`}
                  content={
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-black dark:text-white">
                        {item.name}
                      </h3>
                      <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-gray-500 uppercase">Support Milestone</span>
                          <span className="text-xs font-bold text-accent">{item.proposal_signatures} / 50</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ${item.has_signed ? 'bg-accent' : 'bg-gray-400'}`}
                            style={{ width: `${Math.min((item.proposal_signatures / 50) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white dark:bg-white/5 border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
              <p className="text-gray-400 font-medium">The feed is quiet. Start a new conversation.</p>
              <Link href="/proposals" className="inline-block mt-4 text-accent font-bold hover:underline">
                New Proposal
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <aside className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Trending Sections */}
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={20} className="text-accent" />
                <h3 className="text-lg font-bold text-black dark:text-white">Trending categories</h3>
              </div>
              <div className="space-y-4">
                {trending?.slice(0, 5).map((cat: any) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.id}`}
                    className="block group"
                  >
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Global Wall</p>
                    <h4 className="text-sm font-bold text-black dark:text-white group-hover:text-accent transition-colors">
                      {cat.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-1">Sovereign Topic</p>
                  </Link>
                ))}
              </div>
              <Link href="/categories" className="block mt-8 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm font-bold text-accent hover:underline">
                Show more
              </Link>
            </div>

            {/* Footer Links (Lite) */}
            <div className="px-4 text-[11px] text-gray-400 leading-6 flex flex-wrap items-center">
              <p className="flex items-center">© 2026 Votest<Star size={11} className="fill-accent text-accent mx-0.5" />r Protocol • Decentered Governance • Terms of Service • Privacy Policy • Cookie Policy • Accessibility • Ads info • More •</p>
            </div>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}
