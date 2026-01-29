export default function Table({
    headers,
    data,
    renderRow
}: {
    headers: string[],
    data: any[],
    renderRow: (item: any) => React.ReactNode
}) {
    return (
        <div className="overflow-x-auto bg-white dark:bg-black rounded-xl shadow-sm border border-black/10 dark:border-white/10">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/50 dark:bg-white/5 border-b-2 border-accent">
                        {headers.map((h, i) => (
                            <th key={i} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-black dark:text-white">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10">
                    {data && data.length > 0 ? (
                        data.map((item, i) => renderRow(item))
                    ) : (
                        <tr>
                            <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-500 uppercase text-[10px] font-black tracking-widest ">
                                Synchronizing ledger ...
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
