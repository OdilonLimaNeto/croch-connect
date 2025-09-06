import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/admin-layout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Package, 
  Tag, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  Calendar,
  Eye,
  MessageCircle
} from 'lucide-react';
import { ProductService, PromotionService } from '@/services/api';
import { Product, Promotion } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStock: number;
  totalPromotions: number;
  activePromotions: number;
  averagePrice: number;
  recentProducts: Product[];
  recentPromotions: Promotion[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [products, promotions] = await Promise.all([
          ProductService.getProducts(false), // Get all products
          PromotionService.getPromotions()
        ]);

        const activeProducts = products.filter(p => p.is_active);
        const inactiveProducts = products.filter(p => !p.is_active);
        const outOfStock = products.filter(p => p.stock_quantity === 0);
        const activePromotions = promotions.filter(p => p.is_active);
        
        const totalValue = products.reduce((sum, p) => sum + p.price, 0);
        const averagePrice = products.length > 0 ? totalValue / products.length : 0;

        const dashboardStats: DashboardStats = {
          totalProducts: products.length,
          activeProducts: activeProducts.length,
          inactiveProducts: inactiveProducts.length,
          outOfStock: outOfStock.length,
          totalPromotions: promotions.length,
          activePromotions: activePromotions.length,
          averagePrice,
          recentProducts: products.slice(0, 5),
          recentPromotions: promotions.slice(0, 5)
        };

        setStats(dashboardStats);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar dados</h2>
          <p className="text-muted-foreground">Não foi possível carregar as informações do dashboard.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu negócio e produtos
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Products */}
          <Card className="hover:shadow-soft transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Produtos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Badge variant="secondary" className="text-xs">
                  {stats.activeProducts} ativos
                </Badge>
                {stats.inactiveProducts > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {stats.inactiveProducts} inativos
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Out of Stock */}
          <Card className="hover:shadow-soft transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sem Estoque
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.outOfStock}</div>
              <p className="text-xs text-muted-foreground">
                Produtos que precisam de reposição
              </p>
            </CardContent>
          </Card>

          {/* Active Promotions */}
          <Card className="hover:shadow-soft transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Promoções Ativas
              </CardTitle>
              <Tag className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.activePromotions}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.totalPromotions} promoções total
              </p>
            </CardContent>
          </Card>

          {/* Average Price */}
          <Card className="hover:shadow-soft transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Preço Médio
              </CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                R$ {stats.averagePrice.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor médio dos produtos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produtos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentProducts.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground line-clamp-1">
                          {product.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-semibold text-primary">
                            R$ {product.price.toFixed(2)}
                          </span>
                          <Badge 
                            variant={product.is_active ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {product.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {product.stock_quantity === 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Sem estoque
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(product.created_at), 'dd/MM', { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto cadastrado ainda</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Promotions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Promoções Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentPromotions.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentPromotions.map((promotion) => (
                    <div key={promotion.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">
                          {promotion.discount_percentage}% OFF
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={promotion.is_active ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {promotion.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <div>{format(new Date(promotion.start_date), 'dd/MM', { locale: ptBR })}</div>
                        <div>até {format(new Date(promotion.end_date), 'dd/MM', { locale: ptBR })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma promoção criada ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className="p-4 rounded-lg border border-dashed border-primary/30 text-center hover:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => navigate('/admin/produtos')}
              >
                <Package className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-medium text-foreground">Novo Produto</h3>
                <p className="text-sm text-muted-foreground">Adicionar produto ao catálogo</p>
              </div>
              
              <div 
                className="p-4 rounded-lg border border-dashed border-accent/30 text-center hover:bg-accent/5 transition-colors cursor-pointer"
                onClick={() => navigate('/admin/promocoes')}
              >
                <Tag className="w-8 h-8 text-accent mx-auto mb-2" />
                <h3 className="font-medium text-foreground">Nova Promoção</h3>
                <p className="text-sm text-muted-foreground">Criar oferta especial</p>
              </div>
              
              <div 
                className="p-4 rounded-lg border border-dashed border-success/30 text-center hover:bg-success/5 transition-colors cursor-pointer"
                onClick={() => window.open('/', '_blank')}
              >
                <Eye className="w-8 h-8 text-success mx-auto mb-2" />
                <h3 className="font-medium text-foreground">Ver Site</h3>
                <p className="text-sm text-muted-foreground">Visualizar loja online</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;