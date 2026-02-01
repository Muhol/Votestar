"use client";

import { ShieldCheck, Fingerprint, Lock, Mail, ArrowRight, Loader2, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LoginPage() {
    const [idNumber, setIdNumber] = useState('');
    const [step, setStep] = useState(1); // 1: Welcome, 2: ID Binding, 3: Success
    const [isVerifying, setIsVerifying] = useState(false);
    const router = useRouter();
    const { user, login } = useAuth();

    // If user returns from Auth0, automatically move to Step 2 (ID Binding)
    // unless they were already signed in and just arrived here.
    useEffect(() => {
        if (user && step === 1) {
            setStep(2);
        }
    }, [user, step]);

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        login(); // Trigger actual Auth0 login
    };

    const simulateVerification = () => {
        if (idNumber.length < 5) return;
        setIsVerifying(true);
        setTimeout(() => {
            setIsVerifying(false);
            setStep(3);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black flex flex-col">
            <Navbar />

            <main className="flex-grow flex items-center justify-center p-4 min-h-[80vh]">
                <div className="max-w-md w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-[40px] p-10 shadow-2xl relative overflow-hidden transition-all duration-500">
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 blur-[100px] rounded-full"></div>

                    {step === 1 && (
                        <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="h-16 w-16 bg-accent/10 rounded-3xl flex items-center justify-center mb-8 border border-accent/20">
                                <ShieldCheck size={32} className="text-accent" />
                            </div>
                            <h1 className="text-4xl font-black text-black dark:text-white leading-none mb-4 flex flex-col items-start">
                                Welcome to <h1 className="text-4xl font-black text-black dark:text-white leading-none mb-4 flex items-center">Votest<Star size={26} className="fill-accent text-accent mx-0.5" />r</h1>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 text-lg leading-relaxed">
                                Join the global consensus protocol. Your identity is your power.
                            </p>

                            <button
                                onClick={handleStart}
                                className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-bold text-sm flex items-center justify-center hover:opacity-90 transition-all group"
                            >
                                Get Started
                                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="mt-8 text-center text-xs text-gray-400 font-medium">
                                Already have an identifier? <span className="text-accent font-bold hover:underline cursor-pointer" onClick={() => login()}>Sign In</span>
                            </p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="relative z-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center text-black font-black text-xs">
                                    02
                                </div>
                                <h2 className="text-xl font-bold text-black dark:text-white">Verify Identity</h2>
                            </div>

                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 leading-relaxed">
                                Please provide your National ID number. This is used to generate a unique, anonymous hash on the ledger.
                            </p>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">ID NUMBER / SERIAL</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={idNumber}
                                        onChange={(e) => setIdNumber(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 py-6 px-8 rounded-3xl text-2xl font-mono tracking-[0.5em] outline-none focus:ring-2 ring-accent/30 transition-all dark:text-white"
                                    />
                                </div>

                                <button
                                    onClick={simulateVerification}
                                    disabled={isVerifying || idNumber.length < 5}
                                    className={`w-full py-5 rounded-3xl font-bold text-sm flex items-center justify-center transition-all ${isVerifying
                                            ? 'bg-gray-100 text-gray-400 cursor-wait'
                                            : 'bg-accent text-black hover:shadow-xl hover:shadow-accent/20 active:scale-95 disabled:opacity-50'
                                        }`}
                                >
                                    {isVerifying ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Hashing Identity...</span>
                                        </div>
                                    ) : (
                                        "Bind to Account"
                                    )}
                                </button>

                                <p className="text-[10px] text-center text-gray-400 font-medium px-4 leading-relaxed">
                                    Your raw ID number is never stored. We only use its cryptographic hash to ensure the integrity of the consensus wall.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="relative z-10 text-center animate-in zoom-in-95 duration-500">
                            <div className="mb-8 flex justify-center">
                                <div className="h-24 w-24 bg-green-500 rounded-[35px] flex items-center justify-center shadow-2xl shadow-green-500/30">
                                    <ShieldCheck size={48} className="text-white" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-black text-black dark:text-white mb-4">
                                Identity Bound
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 text-lg leading-relaxed px-2">
                                Your identifier has been correctly appended to the global ledger. You are now authorized to vote.
                            </p>
                            <button
                                onClick={() => router.push('/categories')}
                                className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-bold text-sm hover:opacity-90 transition-all"
                            >
                                Enter Star Wall
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
