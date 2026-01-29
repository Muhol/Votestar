import { ShieldCheck, BadgeCheck } from 'lucide-react';

interface VerifiedBadgeProps {
    type?: 'INDIVIDUAL' | 'ORGANIZATION';
    isVerified?: boolean;
}

export default function VerifiedBadge({ type = 'INDIVIDUAL', isVerified = false }: VerifiedBadgeProps) {
    if (!isVerified) return null;

    return (
        <div className="inline-flex items-center group cursor-default" title={type === 'ORGANIZATION' ? 'Verified Organization' : 'Verified Citizen'}>
            {type === 'ORGANIZATION' ? (
                <BadgeCheck size={16} className="text-accent fill-accent/10" />
            ) : (
                <ShieldCheck size={14} className="text-success" />
            )}
            <span className="ml-1.5 overflow-hidden w-0 group-hover:w-auto transition-all duration-300 text-[10px] font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {type === 'ORGANIZATION' ? 'Official Org' : 'Verified'}
            </span>
        </div>
    );
}
