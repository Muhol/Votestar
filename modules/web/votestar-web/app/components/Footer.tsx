import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-black text-white py-20 px-4 md:px-8 border-t border-accent/20">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center space-y-12 md:space-y-0">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter mb-4">
                        VOTESTAR<span className="text-accent">.</span>
                    </h2>
                    <p className="text-gray-400 max-w-sm font-medium">
                        The immutable ledger for a global social democracy.
                        Financial-grade security for the voice of the people.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-12 sm:gap-24">
                    <div>
                        <h3 className="text-accent text-xs font-black uppercase tracking-widest mb-6">Platform</h3>
                        <ul className="space-y-4 text-sm font-bold text-gray-300">
                            <li><Link href="/categories" className="hover:text-white transition-colors">Categories</Link></li>
                            <li><Link href="/leaderboard" className="hover:text-white transition-colors">Leaderboards</Link></li>
                            <li><Link href="/rules" className="hover:text-white transition-colors">Voter Rules</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-accent text-xs font-black uppercase tracking-widest mb-6">Transparency</h3>
                        <ul className="space-y-4 text-sm font-bold text-gray-300">
                            <li><Link href="/ledger" className="hover:text-white transition-colors">Public Ledger</Link></li>
                            <li><Link href="/audit" className="hover:text-white transition-colors">Audit Logs</Link></li>
                            <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between text-xs text-gray-500 font-bold uppercase tracking-widest">
                <p>© 2026 VoteStar Protocol. All rights reserved.</p>
                <div className="flex space-x-8 mt-4 md:mt-0">
                    <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                </div>
            </div>
        </footer>
    );
}
