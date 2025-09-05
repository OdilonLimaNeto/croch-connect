import React from 'react';
import { Product } from '@/types';
import ProductCard from './product-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onProductClick?: (product: Product) => void;
  className?: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  onProductClick,
  className = ""
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <div className="w-12 h-12 text-muted-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full">
              <path d="M3 3h18v18H3z" />
              <path d="m8 8 8 8" />
              <path d="m16 8-8 8" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum produto encontrado
        </h3>
        <p className="text-muted-foreground">
          Não há produtos disponíveis no momento.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onViewDetails={onProductClick}
          className="animate-fade-in"
        />
      ))}
    </div>
  );
};

export default ProductGrid;