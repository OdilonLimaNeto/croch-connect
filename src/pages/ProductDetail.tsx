import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageCircle, 
  ArrowLeft, 
  Heart, 
  Share2,
  Package,
  Palette,
  Calendar
} from 'lucide-react';
import { Product } from '@/types';
import { ProductService, WhatsAppService } from '@/services/api';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { LoadingScreen } from '@/components/ui/loading-spinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!id) {
      navigate('/produtos');
      return;
    }

    const loadProduct = async () => {
      try {
        const productData = await ProductService.getProduct(id);
        if (!productData) {
          navigate('/produtos');
          return;
        }
        setProduct(productData);
      } catch (error) {
        console.error('Error loading product:', error);
        navigate('/produtos');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, navigate]);

  const handleWhatsAppContact = () => {
    if (product) {
      WhatsAppService.contactProduct(product);
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description || '',
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copy to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Produto não encontrado
          </h1>
          <Link to="/produtos">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Produtos
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const hasPromotion = product.promotional_price && product.promotional_price < product.price;
  const displayPrice = hasPromotion ? product.promotional_price : product.price;
  const originalPrice = hasPromotion ? product.price : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Início</Link>
          <span>/</span>
          <Link to="/produtos" className="hover:text-foreground">Produtos</Link>
          <span>/</span>
          <span className="text-foreground">{product.title}</span>
        </div>
      </div>

      {/* Product Details */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[selectedImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Package className="w-24 h-24" />
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index 
                        ? 'border-primary' 
                        : 'border-transparent hover:border-muted-foreground'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {product.title}
              </h1>
              
              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-primary">
                  R$ {displayPrice.toFixed(2)}
                </span>
                {originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      R$ {originalPrice.toFixed(2)}
                    </span>
                    <Badge className="bg-accent text-accent-foreground">
                      -{Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
                    </Badge>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {product.stock_quantity > 0 ? (
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    <Package className="w-3 h-3 mr-1" />
                    Em estoque ({product.stock_quantity} disponível{product.stock_quantity !== 1 ? 's' : ''})
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    Esgotado
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Descrição</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Materials */}
            {product.materials && product.materials.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Materiais
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.materials.map((material, index) => (
                    <Badge key={index} variant="outline">
                      {material}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Product Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  Adicionado em {format(new Date(product.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                <div className="text-sm text-muted-foreground">
                  Código do produto: {product.id.slice(-8).toUpperCase()}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleWhatsAppContact}
                size="lg"
                className="w-full gap-3 text-lg py-6 bg-success hover:bg-success/90 text-success-foreground"
                disabled={product.stock_quantity === 0}
              >
                <MessageCircle className="w-5 h-5" />
                {product.stock_quantity > 0 ? 'Comprar via WhatsApp' : 'Produto Esgotado'}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex-1 gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </Button>
                
                <Button
                  variant="outline"
                  className="gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Favoritar
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-accent mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      Produto Artesanal
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Cada peça é única e feita à mão com muito carinho. 
                      Pequenas variações fazem parte do charme artesanal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Back to Products */}
      <section className="container mx-auto px-4 py-8">
        <Link to="/produtos">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar aos Produtos
          </Button>
        </Link>
      </section>

      <Footer />
    </div>
  );
};

export default ProductDetail;