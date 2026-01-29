"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import { useAuth } from '../../components/AuthProvider';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ChevronLeft, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function NewProposalPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    if (authLoading) return null;
    if (!user) {
        router.push('/login');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/proxy/proposals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    start_time: new Date().toISOString(),
                    end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                })
            });

            if (response.ok) {
                setSuccess(true);
                mutate('/proposals');
                setTimeout(() => {
                    router.push('/proposals');
                }, 2000);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black flex flex-col">
            <Navbar />

            <main className="flex-grow max-w-2xl mx-auto w-full px-6 py-12 pb-32">
                <Link
                    href="/proposals"
                    className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black dark:hover:text-white mb-10 transition-colors group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Hub
                </Link>

                <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 blur-[100px] rounded-full"></div>

                    {success ? (
                        <div className="py-20 text-center animate-in zoom-in-95 duration-500">
                            <div className="h-24 w-24 bg-accent rounded-[35px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-accent/30">
                                <CheckCircle2 size={48} className="text-black" />
                            </div>
                            <h2 className="text-3xl font-black text-black dark:text-white mb-4">Proposal Broadcasted</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg leading-relaxed">
                                Your voice has been encoded onto the Consensus Hub. Redirecting you home...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-4xl font-black text-black dark:text-white tracking-tighter leading-none mb-4">
                                Propose a <span className="text-accent">New Star.</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-12 text-lg leading-relaxed">
                                Define a new global category. If you reach 50 supporters, it becomes an official Star Wall.
                            </p>

                            <div className="space-y-8 mb-12">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Category Identifier</label>
                                    <input
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Best Sci-Fi Series 2026"
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 text-base font-bold outline-none focus:ring-2 ring-accent/30 transition-all dark:text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Consensus Mission</label>
                                    <textarea
                                        required
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={5}
                                        placeholder="What is the goal of this category? Describe the impact..."
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 text-base font-medium outline-none focus:ring-2 ring-accent/30 transition-all dark:text-white leading-relaxed"
                                    ></textarea>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-6 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center hover:shadow-2xl hover:shadow-accent/20 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin text-accent" size={24} />
                                ) : (
                                    "Initialize Consensus"
                                )}
                            </button>

                            <div className="mt-8 flex items-start gap-4 p-4 bg-accent/5 rounded-2xl border border-accent/10">
                                <ShieldCheck className="text-accent shrink-0" size={20} />
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                    Your proposal will require verification from the community. Organizations bypass the 50-signature threshold.
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
