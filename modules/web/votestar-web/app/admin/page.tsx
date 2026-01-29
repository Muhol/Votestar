"use client";

import StatsCard from '../components/StatsCard';
import useSWR from 'swr';
import { fetcher } from '../../lib/api';

export default function AdminDashboard() {
    const { data: stats } = useSWR('/stats/summary', fetcher);

    return (
        <div>
            <header className="mb-10">
                <h2 className="text-4xl font-black text-black dark:text-white tracking-tight uppercase ">Control Center</h2>
                <div className="h-1 w-20 bg-accent mt-2"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-4 font-black uppercase text-[10px] tracking-[0.2em]">Real-time system integrity</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard title="Total ledger entries" value={stats?.total_votes?.toLocaleString() || "..."} trend="12%" />
                <StatsCard title="Verified Humans" value={stats?.active_users?.toLocaleString() || "..."} trend="5%" />
                <StatsCard title="Active Protocols" value={stats?.open_elections || "..."} />
                <StatsCard title="Platform Revenue" value={stats?.revenue || "..."} trend="8%" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Placeholder for real charts */}
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border_color h-96 flex items-center justify-center">
                    <p className="text-secondary">Vote Velocity Chart (Coming Soon)</p>
                </div>
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border_color h-96 flex items-center justify-center">
                    <p className="text-secondary">User Growth Chart (Coming Soon)</p>
                </div>
            </div>
        </div>
    );
}
