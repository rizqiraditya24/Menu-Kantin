import { Product } from '@/lib/supabase';

interface ProductCardProps {
    product: Product;
    onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl shadow-lg overflow-hidden card-hover border border-secondary-100 ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
        >
            {/* Image */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-secondary-100 to-secondary-200">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">🍽️</span>
                    </div>
                )}
                {/* Price Tag */}
                <div className="absolute bottom-3 right-3 bg-primary-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    {formatPrice(product.price)}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">
                    {product.name}
                </h3>
                {product.category && (
                    <span className="inline-block bg-secondary-100 text-secondary-700 text-xs font-medium px-2 py-1 rounded-full mb-2">
                        {product.category.name}
                    </span>
                )}
                {product.description && (
                    <p className="text-gray-500 text-sm line-clamp-2">
                        {product.description}
                    </p>
                )}
            </div>
        </div>
    );
}
