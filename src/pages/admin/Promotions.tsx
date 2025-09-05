import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { DataTable } from '@/components/ui/data-table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Plus, 
  Tag, 
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Percent
} from 'lucide-react';
import { Promotion, TableColumn } from '@/types';
import { PromotionService } from '@/services/api';
import { toast } from 'sonner';
import { format, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const data = await PromotionService.getPromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Error loading promotions:', error);
      toast.error('Erro ao carregar promoções');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    toast.info(`Editar promoção: ${promotion.discount_percentage}% OFF`);
  };

  const handleDelete = async (promotion: Promotion) => {
    if (window.confirm(`Tem certeza que deseja excluir a promoção de ${promotion.discount_percentage}%?`)) {
      try {
        const result = await PromotionService.deletePromotions([promotion.id]);
        if (result.success) {
          toast.success('Promoção excluída com sucesso');
          loadPromotions();
        } else {
          toast.error(result.error || 'Erro ao excluir promoção');
        }
      } catch (error) {
        toast.error('Erro ao excluir promoção');
      }
    }
  };

  const handleBulkDelete = async (promotions: Promotion[]) => {
    const promotionIds = promotions.map(p => p.id);
    
    if (window.confirm(`Tem certeza que deseja excluir ${promotions.length} promoção(ões)?`)) {
      try {
        const result = await PromotionService.deletePromotions(promotionIds);
        if (result.success) {
          toast.success(`${promotions.length} promoção(ões) excluída(s) com sucesso`);
          loadPromotions();
        } else {
          toast.error(result.error || 'Erro ao excluir promoções');
        }
      } catch (error) {
        toast.error('Erro ao excluir promoções');
      }
    }
  };

  const getPromotionStatus = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    if (!promotion.is_active) {
      return { status: 'inactive', label: 'Inativa', variant: 'outline' as const };
    }

    if (isBefore(now, startDate)) {
      return { status: 'scheduled', label: 'Agendada', variant: 'secondary' as const };
    }

    if (isAfter(now, endDate)) {
      return { status: 'expired', label: 'Expirada', variant: 'destructive' as const };
    }

    return { status: 'active', label: 'Ativa', variant: 'default' as const };
  };

  const columns: TableColumn<Promotion>[] = [
    {
      key: 'discount_percentage',
      label: 'Desconto',
      render: (value, item) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
            <Percent className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-bold text-lg text-accent">{value}%</p>
            <p className="text-xs text-muted-foreground">OFF</p>
          </div>
        </div>
      )
    },
    {
      key: 'product_id',
      label: 'Produto',
      render: (value, item) => (
        item.product ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-md overflow-hidden">
              {item.product.images && item.product.images[0] ? (
                <img
                  src={item.product.images[0]}
                  alt={item.product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Tag className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">{item.product.title}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground line-through">
                  R$ {item.product.price.toFixed(2)}
                </span>
                <span className="text-success font-semibold">
                  R$ {(item.product.price * (1 - value / 100)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">Produto não encontrado</span>
        )
      )
    },
    {
      key: 'start_date',
      label: 'Período',
      render: (value, item) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>De: {format(new Date(value), 'dd/MM/yy', { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Até: {format(new Date(item.end_date), 'dd/MM/yy', { locale: ptBR })}</span>
          </div>
        </div>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value, item) => {
        const { label, variant } = getPromotionStatus(item);
        return <Badge variant={variant}>{label}</Badge>;
      }
    },
    {
      key: 'created_at',
      label: 'Criada em',
      render: (value) => format(new Date(value), 'dd/MM/yy', { locale: ptBR })
    }
  ];

  const stats = {
    total: promotions.length,
    active: promotions.filter(p => getPromotionStatus(p).status === 'active').length,
    scheduled: promotions.filter(p => getPromotionStatus(p).status === 'scheduled').length,
    expired: promotions.filter(p => getPromotionStatus(p).status === 'expired').length,
    averageDiscount: promotions.length > 0 
      ? promotions.reduce((sum, p) => sum + p.discount_percentage, 0) / promotions.length 
      : 0
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Promoções</h1>
            <p className="text-muted-foreground">
              Gerencie ofertas especiais e descontos
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Promoção
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.scheduled}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiradas</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desconto Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {stats.averageDiscount.toFixed(0)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Promotions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Promoções</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={promotions}
              columns={columns}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              getItemId={(promotion) => promotion.id}
              emptyMessage="Nenhuma promoção cadastrada"
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPromotions;