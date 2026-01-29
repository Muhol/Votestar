"use client";

import { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, Fingerprint, Lock, CheckCircle2, X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import Link from 'next/link';

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: { id: string, name: string };
  category: { id: string, name: string };
  onSuccess: () => void;
}

export default function VotingModal({ isOpen, onClose, candidate, category, onSuccess }: VotingModalProps) {
  const [step, setStep] = useState(1); // 1: Confirm, 2: Signing, 3: Success
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setIdempotencyKey(`v_${category.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    }
  }, [isOpen, category.id]);

  const handleVote = async () => {
    setStep(2);
    setError(null);

    try {
      const response = await fetch('/api/proxy/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category_id: category.id,
          candidate_id: candidate.id,
          device_signature: `v_sig_${Date.now()}`,
          idempotency_key: idempotencyKey
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Voting protocol failed.');
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message);
      setStep(1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="p-10 text-center">
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="h-20 w-20 bg-accent rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-accent/20">
                <ShieldCheck size={40} className="text-black" />
              </div>
              <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter  mb-4">
                Confirm Stake<span className="text-accent">.</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 ">
                You are about to cast your immutable vote for <span className="text-black dark:text-white font-black underline decoration-accent underline-offset-4">{candidate.name}</span> in the <span className="text-black dark:text-white font-black">{category.name}</span> protocol.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-[10px] font-black uppercase tracking-widest ">
                  Error: {error}
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={handleVote}
                  className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-accent hover:text-black transition-all shadow-lg"
                >
                  Authorize Entry
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-5 bg-transparent text-gray-400 font-black uppercase tracking-widest text-xs hover:text-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="py-10 animate-fade-in">
              <div className="relative h-32 w-32 mx-auto mb-10">
                <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-2 border-gray-400 border-b-transparent rounded-full animate-spin-reverse opacity-30"></div>
                <div className="absolute inset-0 flex items-center justify-center text-accent">
                  <ShieldCheck size={48} />
                </div>
              </div>
              <h2 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter  mb-4">
                Encrypting Stake...
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium ">
                Securing your vote on the public ledger.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="py-10 animate-fade-in">
              <div className="h-24 w-24 bg-success rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl shadow-success/20">
                <CheckCircle2 size={48} className="text-white" />
              </div>
              <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter uppercase  mb-4">
                COMMITTED<span className="text-accent underline decoration-4 underline-offset-8">!</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium  mb-10">
                Your vote has been successfully written to the Star Wall. Your receipt is now public on the ledger.
              </p>
              
              <div className="space-y-4">
                <Link 
                  href="/ledger" 
                  className="w-full inline-flex items-center justify-center py-5 bg-accent text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all shadow-lg shadow-accent/20"
                >
                  View Global Ledger
                </Link>
                <button
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className="w-full py-5 bg-transparent text-gray-400 font-black uppercase tracking-widest text-xs hover:text-gray-600 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Financial Grade Badge */}
        <div className="bg-gray-50 dark:bg-white/5 py-4 border-t border-black/5 dark:border-white/5 flex items-center justify-center space-x-2">
          <Lock size={12} className="text-gray-400" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Zero-Trust Security Protocol v1.4</span>
        </div>
      </div>
    </div>
  );
}
