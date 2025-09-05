import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MessageCircle, Star, Heart, Award, User } from 'lucide-react';
import { Product } from '@/types';
import { ProductService, WhatsAppService } from '@/services/api';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ProductGrid from '@/components/products/product-grid';
import heroImage from '@/assets/hero-image.jpg';
import productBabySet from '@/assets/product-baby-set.jpg';
import productBlanket from '@/assets/product-blanket.jpg';

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const products = await ProductService.getProducts();
        // Show first 3 products as featured
        setFeaturedProducts(products.slice(0, 3));
      } catch (error) {
        console.error('Error loading featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProducts();
  }, []);

  const handleProductClick = (product: Product) => {
    navigate(`/produto/${product.id}`);
  };

  const handleWhatsAppContact = () => {
    const message = "Olá! Gostaria de conhecer mais produtos artesanais da Nó de Duas. Poderia me ajudar?";
    WhatsAppService.openWhatsApp("5511999999999", message);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center bg-gradient-subtle">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={heroImage}
            alt="Produtos artesanais de crochê"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
            <Badge className="mx-auto w-fit bg-accent/20 text-accent-foreground border-accent/30">
              <Heart className="w-4 h-4 mr-2" />
              Feito com Amor
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-primary leading-tight">
              Nó de Duas
            </h1>
            
            <p className="text-xl md:text-2xl text-primary/80 font-medium">
              Produtos Artesanais em Crochê
            </p>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Criamos peças únicas e especiais para sua família. Cada produto é feito 
              com carinho e dedicação, usando os melhores materiais.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/produtos">
                <Button size="lg" className="gap-2 shadow-elegant">
                  Ver Produtos
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              
              <Button
                variant="outline"
                size="lg"
                onClick={handleWhatsAppContact}
                className="gap-2 bg-success/10 border-success/30 text-success hover:bg-success hover:text-success-foreground"
              >
                <MessageCircle className="w-5 h-5" />
                Falar no WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">Por que escolher a Nó de Duas?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trabalhamos com dedicação para oferecer o melhor em produtos artesanais
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center group hover:shadow-soft transition-all duration-300">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Heart className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Feito com Amor</h3>
                <p className="text-muted-foreground">
                  Cada produto é criado com carinho e atenção aos detalhes
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center group hover:shadow-soft transition-all duration-300">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Qualidade Premium</h3>
                <p className="text-muted-foreground">
                  Utilizamos apenas materiais de alta qualidade e duráveis
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center group hover:shadow-soft transition-all duration-300">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                  <Star className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Peças Únicas</h3>
                <p className="text-muted-foreground">
                  Produtos exclusivos que você não encontra em outro lugar
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">Produtos em Destaque</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Conheça alguns dos nossos produtos mais queridos pelas famílias
            </p>
          </div>
          
          {featuredProducts.length > 0 ? (
            <ProductGrid
              products={featuredProducts}
              loading={loading}
              onProductClick={handleProductClick}
              className="max-w-4xl mx-auto"
            />
          ) : (
            /* Fallback when no products in database */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300">
                <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                  <img
                    src={productBabySet}
                    alt="Kit Bebê Completo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Kit Bebê Completo</h3>
                  <p className="text-muted-foreground mb-4">
                    Conjunto completo com toquinha, luvinhas e sapatinhos para seu bebê
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">R$ 89,90</span>
                    <Button onClick={handleWhatsAppContact} className="gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Comprar
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300">
                <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                  <img
                    src={productBlanket}
                    alt="Manta Aconchegante"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Manta Aconchegante</h3>
                  <p className="text-muted-foreground mb-4">
                    Manta super macia em tons terrosos, perfeita para momentos de carinho
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">R$ 159,90</span>
                    <Button onClick={handleWhatsAppContact} className="gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Comprar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link to="/produtos">
              <Button variant="outline" size="lg" className="gap-2">
                Ver Todos os Produtos
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;