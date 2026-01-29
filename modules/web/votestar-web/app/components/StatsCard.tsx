export default function StatsCard({ title, value, trend, icon }: { title: string, value: string, trend?: string, icon?: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
            <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-all">
                    {icon}
                </div>
                {trend && (
                    <div className="px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                        <span className="text-xs font-bold text-green-500">+{trend}</span>
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-3xl font-black text-black dark:text-white mb-1">
                    {value}
                </h3>
                <p className="text-sm font-bold text-gray-400 capitalize">{title}</p>
            </div>
        </div>
    );
}
