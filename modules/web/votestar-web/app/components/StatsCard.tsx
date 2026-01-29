export default function StatsCard({ title, value, trend, icon }: { title: string, value: string, trend?: string, icon?: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-black p-6 rounded-xl shadow-sm border border-black/10 dark:border-white/10 hover:border-accent transition-all duration-300 group">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wide">{title}</p>
                    <h3 className="text-3xl font-bold mt-2 text-black dark:text-white">{value}</h3>
                </div>
                {icon && <div className="p-2 bg-accent/5 rounded-lg text-accent border border-accent/20 group-hover:bg-accent group-hover:text-black dark:group-hover:text-black transition-all duration-300">{icon}</div>}
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className="text-accent font-bold mr-1">↑ {trend}</span>
                    <span className="text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-widest">vs last month</span>
                </div>
            )}
        </div>
    );
}
