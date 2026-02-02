import { Category } from '@/lib/supabase';

interface CategoryCardProps {
    category: Category;
    isActive: boolean;
    onClick: () => void;
}

export default function CategoryCard({ category, isActive, onClick }: CategoryCardProps) {
    return (
        <button
            onClick={onClick}
            className={`
        px-4 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap
        ${isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                    : 'bg-white text-gray-700 hover:bg-secondary-100 border border-secondary-200'
                }
      `}
        >
            {category.name}
            {category.product_count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : 'bg-secondary-100'
                    }`}>
                    {category.product_count}
                </span>
            )}
        </button>
    );
}
