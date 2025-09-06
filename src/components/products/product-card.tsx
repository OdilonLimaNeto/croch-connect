import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Eye, Tag } from 'lucide-react';
import { Product } from '@/types';
import { WhatsAppService } from '@/services/api';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onViewDetails,
  className 
}) => {
  const hasPromotion = product.hasActivePromotion;
  const displayPrice = hasPromotion ? product.promotional_price! : product.price;
  const originalPrice = hasPromotion ? product.price : null;
  
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    WhatsAppService.contactProduct(product);
  };

  const handleViewDetails = () => {
    onViewDetails?.(product);
  };

  return (
    <Card className={cn(
      "group cursor-pointer transition-all duration-300 hover:shadow-elegant hover:-translate-y-1",
      className
    )}>
      <div className="relative overflow-hidden rounded-t-lg">
        {/* Product Image */}
        <div className="aspect-square bg-muted">
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Eye className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Item em Promoção Tag */}
        {hasPromotion && (
          <Badge className="absolute top-2 left-2 bg-gradient-to-r from-accent to-accent-light text-white shadow-md border-0 px-2 py-1 text-xs font-semibold uppercase tracking-wide z-10">
            <Tag className="w-3 h-3 mr-1" />
            Item em Promoção
          </Badge>
        )}

        {/* Promotion Badge */}
        {hasPromotion && (
          <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground shadow-md">
            -{Math.round(((originalPrice! - displayPrice!) / originalPrice!) * 100)}%
          </Badge>
        )}

        {/* Stock Status */}
        {product.stock_quantity === 0 && (
          <Badge variant="destructive" className="absolute top-12 right-2">
            Esgotado
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Product Title */}
        <h3 className="font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Materials */}
        {product.materials && product.materials.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.materials.slice(0, 2).map((material, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {material}
              </Badge>
            ))}
            {product.materials.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{product.materials.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            R$ {displayPrice!.toFixed(2)}
          </span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              R$ {originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Action Buttons - Mobile First */}
        <div className="flex flex-col gap-2 pt-3">
          <Button
            onClick={handleViewDetails}
            variant="outline"
            size="sm"
            className="w-full gap-2 h-9 hover:bg-muted/50 border-muted-foreground/20 hover:border-primary/50 transition-all duration-200 text-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="font-medium">Ver Detalhes</span>
          </Button>
          
          <Button
            onClick={handleWhatsApp}
            size="sm"
            className="w-full gap-2 h-9 bg-success hover:bg-success/90 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 text-sm"
            disabled={product.stock_quantity === 0}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;