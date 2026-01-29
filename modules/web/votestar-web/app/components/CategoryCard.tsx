import Link from 'next/link';
import { ArrowRight, TrendingUp, Users, CheckCircle2 } from 'lucide-react';

interface CategoryCardProps {
  id: string;
  title: string;
  description: string;
  totalVotes: string;
  image?: string;
  trending?: boolean;
  hasVoted?: boolean;
}

export default function CategoryCard({ id, title, description, totalVotes, image, trending, hasVoted }: CategoryCardProps) {
  return (
    <Link 
      href={`/categories/${id}`}
      className="group relative bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-accent hover:shadow-md transition-all duration-300"
    >
      {/* Image/Cover (if provided) */}
      {image && (
        <div className="h-32 bg-gradient-to-br from-accent/20 to-accent/5 overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className="p-5">
        {/* Header with trending/voted badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {trending && (
              <div className="px-2 py-1 rounded-full bg-accent/10 flex items-center gap-1">
                <TrendingUp size={12} className="text-accent" />
                <span className="text-xs font-semibold text-accent">Trending</span>
              </div>
            )}
            {hasVoted && (
              <div className="px-2 py-1 rounded-full bg-green-500/10 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-green-500" />
                <span className="text-xs font-semibold text-green-500">Voted</span>
              </div>
            )}
          </div>
          <ArrowRight size={18} className="text-gray-400 group-hover:text-accent group-hover:translate-x-1 transition-all" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-black dark:text-white mb-2 line-clamp-2 group-hover:text-accent transition-colors">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {totalVotes} votes
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
