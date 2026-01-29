"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import { ShieldCheck, Fingerprint, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: Verification, 3: Success
    const [isVerifying, setIsVerifying] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(); // Now redirects to /api/auth/login
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black flex flex-col">
            <Navbar />

            <main className="flex-grow flex items-center justify-center p-4 min-h-screen">
                <div className="max-w-md w-full bg-white dark:bg-black border border-black/5 dark:border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/20 blur-[100px] rounded-full"></div>

                    {step === 1 && (
                        <div className="relative z-10 animate-fade-in">
                            <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-accent/40">
                                <Lock size={32} className="text-black" />
                            </div>
                            <h1 className="text-4xl font-black text-black dark:text-white tracking-tighter uppercase  leading-none mb-4">
                                Verify Identity<span className="text-accent">.</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 ">
                                Enter your registered global identifier to access your immutable ledger.
                            </p>

                            <form onSubmit={handleEmailSubmit} className="space-y-6">
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        placeholder="EMAIL@ADDRESS.COM"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10 py-5 pl-12 pr-6 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-accent transition-all dark:text-white"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center hover:bg-accent hover:text-black transition-all group"
                                >
                                    Continue
                                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="relative z-10 text-center animate-fade-in">
                            <div className="mb-8 flex justify-center">
                                <div className={`h-24 w-24 rounded-full border-4 flex items-center justify-center transition-all ${isVerifying ? 'border-accent border-t-transparent animate-spin' : 'border-accent'}`}>
                                    {!isVerifying && <Fingerprint size={48} className="text-accent" />}
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-black dark:text-white tracking-tighter uppercase  mb-2">
                                {isVerifying ? "Binding Device..." : "Biometric Check"}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 ">
                                {isVerifying
                                    ? "Generating Zero-Knowledge cryptographic identity proof."
                                    : "Please verify your hardware ID to sign in."}
                            </p>

                            {!isVerifying && (
                                <button
                                    onClick={simulateVerification}
                                    className="w-full py-5 bg-accent text-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-accent/20"
                                >
                                    Confirm Hardware ID
                                </button>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="relative z-10 text-center animate-fade-in">
                            <div className="mb-8 flex justify-center">
                                <div className="h-24 w-24 bg-success rounded-full flex items-center justify-center shadow-lg shadow-success/30">
                                    <ShieldCheck size={48} className="text-white" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-black text-black dark:text-white tracking-tighter uppercase  mb-4">
                                Access Granted<span className="text-accent">!</span>
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 ">
                                Identity link established. Redirecting to your secure voting terminal...
                            </p>
                            {setTimeout(() => router.push('/categories'), 2000) && null}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
