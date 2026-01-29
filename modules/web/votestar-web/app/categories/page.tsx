"use client";

import useSWR from 'swr';
import { fetcher } from '../../lib/api';
import CategoryCard from '../components/CategoryCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { TrendingUp, Sparkles } from 'lucide-react';

export default function CategoriesPage() {
    const { data: categories, isLoading } = useSWR('/categories', fetcher);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={20} className="text-accent" />
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Explore Categories
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">
                        Vote on What Matters
                    </h1>
                    <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl">
                        Every category represents a global conversation. Cast your vote and shape the collective voice.
                    </p>
                </header>

                {/* Trending Section */}
                {!isLoading && categories && categories.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp size={18} className="text-accent" />
                            <h2 className="text-lg font-bold text-black dark:text-white">Trending Now</h2>
                        </div>
                    </div>
                )}

                {/* Categories Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-48 rounded-2xl bg-white dark:bg-white/5 animate-pulse border border-gray-200 dark:border-gray-800"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories?.map((cat: any) => (
                            <CategoryCard
                                key={cat.id}
                                id={cat.id}
                                title={cat.name}
                                description={cat.description}
                                totalVotes="..."
                                trending={false}
                                hasVoted={cat.has_voted}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && (!categories || categories.length === 0) && (
                    <div className="py-20 text-center bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl">
                        <Sparkles size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                        <h3 className="text-lg font-bold text-black dark:text-white mb-2">No Categories Yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Be the first to propose a new category
                        </p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
