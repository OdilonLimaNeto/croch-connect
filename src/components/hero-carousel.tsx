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
  CarouselApi,
} from '@/components/ui/carousel';
import { MessageCircle, Percent, ArrowRight, Star, Tag } from 'lucide-react';
import { Promotion, Product } from '@/types';
import { PromotionService, WhatsAppService } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import Autoplay from 'embla-carousel-autoplay';

const HeroCarousel = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
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

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

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
    <section className="relative py-20 overflow-hidden">
      {/* Background with elegant gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--accent),0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(var(--primary),0.08),transparent_50%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-accent/10 to-primary/10 backdrop-blur-sm border border-accent/20 rounded-full px-6 py-3 mb-6">
            <Star className="w-5 h-5 text-accent fill-accent/30" />
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              Promoções Exclusivas
            </span>
            <Star className="w-5 h-5 text-accent fill-accent/30" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6">
            Ofertas Especiais
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            Descubra nossa coleção de produtos artesanais em promoção. Peças únicas feitas com amor e técnica tradicional, 
            agora com preços especiais por tempo limitado.
          </p>
        </div>

        {/* Carousel elegante com estratégia de centralização */}
        <Carousel 
          setApi={setApi}
          className={`mx-auto ${
            promotions.length === 1 ? 'max-w-lg' : 
            promotions.length === 2 ? 'max-w-4xl' : 
            'max-w-6xl'
          }`}
          plugins={promotions.length > 1 ? [
            Autoplay({
              delay: 5000,
              stopOnInteraction: true,
            }),
          ] : []}
          opts={{
            align: "center",
            loop: promotions.length > 2,
            skipSnaps: false,
          }}
        >
          <CarouselContent className={`${
            promotions.length === 1 ? "flex justify-center" : ""
          } -ml-4`}>
            {promotions.map((promotion) => {
              const product = promotion.product;
              if (!product) return null;

              const originalPrice = product.price;
              const discountedPrice = originalPrice * (1 - promotion.discount_percentage / 100);

              // Estratégia de basis baseada na quantidade de promoções
              const getBasisClass = () => {
                if (promotions.length === 1) return "basis-full max-w-md mx-auto pl-4";
                if (promotions.length === 2) return "md:basis-1/2 pl-4";
                return "md:basis-1/2 lg:basis-1/3 pl-4";
              };

              return (
                <CarouselItem key={promotion.id} className={getBasisClass()}>
                  <div 
                    className="group cursor-pointer h-full"
                    onClick={() => handleProductClick(product)}
                  >
                    <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/80 backdrop-blur-sm border-0 shadow-soft hover:shadow-elegant transition-all duration-500 hover:scale-[1.02] h-full">
                      {/* Item em Promoção Tag */}
                      <div className="absolute top-4 left-4 z-20">
                        <Badge className="bg-gradient-to-r from-accent to-accent-light text-white shadow-lg border-0 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">
                          <Tag className="w-3 h-3 mr-1.5" />
                          Item em Promoção
                        </Badge>
                      </div>

                      {/* Discount Badge */}
                      <div className="absolute top-4 right-4 z-20">
                        <div className="bg-gradient-to-br from-destructive to-destructive/80 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transform rotate-12 group-hover:rotate-6 transition-transform duration-500">
                          <div className="text-center">
                            <div className="text-xs font-bold leading-none">-{promotion.discount_percentage}%</div>
                            <div className="text-xs opacity-90 leading-none">OFF</div>
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="aspect-[4/3] bg-gradient-to-br from-muted/30 to-muted/60 overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 ease-out"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted-foreground/20 flex items-center justify-center">
                              <span className="text-muted-foreground text-sm font-medium opacity-60">Sem imagem</span>
                            </div>
                          )}
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                    </div>

                      <CardContent className="p-6 space-y-4">
                        {/* Product Info */}
                        <div className="space-y-3">
                          <h3 className="text-xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
                            {product.title}
                          </h3>
                          {product.description && (
                            <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                              {product.description}
                            </p>
                          )}
                        </div>

                        {/* Materials */}
                        {product.materials && product.materials.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {product.materials.slice(0, 3).map((material, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-secondary/60 hover:bg-secondary transition-colors">
                                {material}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Pricing */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-lg text-muted-foreground line-through opacity-70">
                              R$ {originalPrice.toFixed(2)}
                            </span>
                            <div className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                              <span className="text-3xl font-bold">
                                R$ {discountedPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-success font-medium">
                            Economia de R$ {(originalPrice - discountedPrice).toFixed(2)}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductClick(product);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Detalhes
                          </Button>
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWhatsApp(product);
                            }}
                            size="sm"
                            className="flex-1 gap-2 bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success/80 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                            disabled={product.stock_quantity === 0}
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          
          {/* Controles elegantes */}
          {promotions.length > 1 && (
            <>
              <CarouselPrevious className="hidden md:flex -left-12 bg-white/90 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-white shadow-elegant transition-all duration-300" />
              <CarouselNext className="hidden md:flex -right-12 bg-white/90 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-white shadow-elegant transition-all duration-300" />
            </>
          )}
        </Carousel>

        {/* Indicadores elegantes */}
        {promotions.length > 1 && (
          <div className="flex justify-center mt-8 space-x-3">
            {promotions.map((_, index) => (
              <button
                key={index}
                className={`relative transition-all duration-500 ${
                  index === current
                    ? 'w-8 h-3'
                    : 'w-3 h-3 hover:scale-125'
                }`}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Ir para slide ${index + 1}`}
              >
                <div className={`w-full h-full rounded-full transition-all duration-500 ${
                  index === current
                    ? 'bg-gradient-to-r from-primary to-accent shadow-lg'
                    : 'bg-primary/30 hover:bg-primary/60'
                }`} />
                {index === current && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse opacity-30" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroCarousel;