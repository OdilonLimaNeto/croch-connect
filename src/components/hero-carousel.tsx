import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { MessageCircle, Percent, ArrowRight } from 'lucide-react';
import { Promotion, Product } from '@/types';
import { PromotionService, WhatsAppService } from '@/services/api';
import { useNavigate } from 'react-router-dom';

const HeroCarousel = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadActivePromotions = async () => {
      try {
        const activePromotions = await PromotionService.getActivePromotions();
        setPromotions(activePromotions);
      } catch (error) {
        console.error('Error loading active promotions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivePromotions();
  }, []);

  const handleProductClick = (product: Product) => {
    navigate(`/produto/${product.id}`);
  };

  const handleWhatsApp = (product: Product) => {
    WhatsAppService.contactProduct(product);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (promotions.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mx-auto w-fit bg-primary/10 text-primary border-primary/20 mb-4">
            <Percent className="w-4 h-4 mr-2" />
            Promoções Ativas
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Ofertas Especiais
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Aproveite nossas promoções por tempo limitado e leve para casa produtos únicos com desconto especial
          </p>
        </div>

        {/* Estratégia de centralização baseada na quantidade de promoções */}
        <Carousel className={`mx-auto ${
          promotions.length === 1 ? 'max-w-md' : 
          promotions.length === 2 ? 'max-w-3xl' : 
          'max-w-5xl'
        }`}>
          <CarouselContent className={
            promotions.length === 1 ? "flex justify-center" : ""
          }>
            {promotions.map((promotion) => {
              const product = promotion.product;
              if (!product) return null;

              const originalPrice = product.price;
              const discountedPrice = originalPrice * (1 - promotion.discount_percentage / 100);

              // Estratégia de basis baseada na quantidade de promoções
              const getBasisClass = () => {
                if (promotions.length === 1) return "basis-full max-w-sm mx-auto";
                if (promotions.length === 2) return "md:basis-1/2";
                return "md:basis-1/2 lg:basis-1/3";
              };

              return (
                <CarouselItem key={promotion.id} className={getBasisClass()}>
                  <Card className="group hover:shadow-elegant transition-all duration-300 h-full">
                    <div className="relative">
                      <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      
                      <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground shadow-md">
                        -{promotion.discount_percentage}%
                      </Badge>
                    </div>

                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 line-clamp-2">{product.title}</h3>
                        {product.description && (
                          <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground line-through">
                            R$ {originalPrice.toFixed(2)}
                          </span>
                          <span className="text-2xl font-bold text-primary">
                            R$ {discountedPrice.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleProductClick(product)}
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Ver Detalhes
                          </Button>
                          
                          <Button
                            onClick={() => handleWhatsApp(product)}
                            size="sm"
                            className="w-full gap-2 bg-success hover:bg-success/90 text-white"
                            disabled={product.stock_quantity === 0}
                          >
                            <MessageCircle className="w-4 h-4" />
                            Comprar no WhatsApp
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          
          {/* Mostrar controles apenas quando necessário */}
          {promotions.length > 1 && (
            <>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
};

export default HeroCarousel;