import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function WelcomePage() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-black overflow-hidden">
            <Navbar />

            <main className="flex-grow min-h-screen">
                {/* HERO SECTION */}
                <section className="relative pt-20 pb-32 md:pt-32 md:pb-52 px-4 border-b border-black/5 dark:border-white/5">
                    {/* Subtle Accent Orbs */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl -mr-64 -mt-64 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl -ml-64 -mb-64 pointer-events-none"></div>

                    <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8 animate-fade-in">
                            <ShieldCheck size={14} className="text-accent mr-2" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Immutable Voting Ledger</span>
                        </div>

                        <h1 className="text-5xl md:text-8xl font-black text-black dark:text-white mb-8 tracking-tighter leading-[0.9]">
                            DECIDE THE FUTURE<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-500 to-accent">ON THE STAR WALL.</span>
                        </h1>

                        <p className="text-lg md:text-2xl text-gray-500 dark:text-gray-400 font-medium max-w-3xl mb-12">
                            The world's first financial-grade voting protocol for global categories.
                            Music, Tech, Sports—your voice, verified forever.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
                            <Link
                                href="/categories"
                                className="w-full sm:w-auto px-10 py-5 bg-accent text-black rounded-full font-black uppercase tracking-widest text-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                            >
                                Start Voting
                                <ArrowRight size={18} className="ml-2" />
                            </Link>

                            <Link
                                href="/login"
                                className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-black text-black dark:text-white border-2 border-black/10 dark:border-white/20 rounded-full font-black uppercase tracking-widest text-sm hover:border-accent transition-colors"
                            >
                                Join the Ledger
                            </Link>
                        </div>
                    </div>
                </section>

                {/* FEATURES GRID */}
                <section className="py-24 px-4 md:px-8 bg-gray-50/50 dark:bg-white/5">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <div className="h-12 w-12 rounded-2xl bg-black dark:bg-white flex items-center justify-center mb-6 shadow-lg">
                                <Globe className="text-accent" />
                            </div>
                            <h3 className="text-xl font-bold text-black dark:text-white mb-2 tracking-tighter">Global Democracy</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                Break geographic barriers. Vote on global categories that define our culture and collective future.
                            </p>
                        </div>

                        <div className="flex flex-col items-center md:items-start text-center md:text-left border-l-0 md:border-l border-black/5 dark:border-white/10 md:pl-12">
                            <div className="h-12 w-12 rounded-2xl bg-black dark:bg-white flex items-center justify-center mb-6 shadow-lg">
                                <ShieldCheck className="text-accent" />
                            </div>
                            <h3 className="text-xl font-bold text-black dark:text-white mb-2 tracking-tighter">Anti-Corruption</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                App-only identity verification. Every vote is hard-linked to a verified human, secured by financial-grade hashing.
                            </p>
                        </div>

                        <div className="flex flex-col items-center md:items-start text-center md:text-left border-l-0 md:border-l border-black/5 dark:border-white/10 md:pl-12">
                            <div className="h-12 w-12 rounded-2xl bg-black dark:bg-white flex items-center justify-center mb-6 shadow-lg">
                                <Zap className="text-accent" />
                            </div>
                            <h3 className="text-xl font-bold text-black dark:text-white mb-2 tracking-tighter">Instant Settlement</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                No waiting for tallies. Results settle in real-time as the immutable ledger appends each transaction.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
