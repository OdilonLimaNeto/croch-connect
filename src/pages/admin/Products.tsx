import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { DataTable } from '@/components/ui/data-table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProductForm } from '@/components/admin/product-form';
import { 
  Plus, 
  Package, 
  Eye, 
  Edit, 
  Trash2,
  AlertCircle,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import { Product, TableColumn } from '@/types';
import { ProductService } from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    products: Product[];
  }>({ open: false, products: [] });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await ProductService.getProducts(false); // Get all products
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (product: Product) => {
    setDeleteDialog({
      open: true,
      products: [product],
    });
  };

  const handleBulkDelete = (products: Product[]) => {
    setDeleteDialog({
      open: true,
      products,
    });
  };

  const confirmDelete = async () => {
    const { products } = deleteDialog;
    const productIds = products.map(p => p.id);
    
    try {
      const result = await ProductService.deleteProducts(productIds);
      if (result.success) {
        toast.success(`${products.length} produto(s) excluído(s) com sucesso`);
        loadProducts();
      } else {
        toast.error(result.error || 'Erro ao excluir produtos');
      }
    } catch (error) {
      toast.error('Erro ao excluir produtos');
    } finally {
      setDeleteDialog({ open: false, products: [] });
    }
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    loadProducts();
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const result = await ProductService.toggleProductStatus(product.id, !product.is_active);
      if (result.success) {
        toast.success(`Produto ${!product.is_active ? 'ativado' : 'desativado'} com sucesso`);
        loadProducts();
      } else {
        toast.error(result.error || 'Erro ao alterar status do produto');
      }
    } catch (error) {
      toast.error('Erro ao alterar status do produto');
    }
  };

  const columns: TableColumn<Product>[] = [
    {
      key: 'title',
      label: 'Produto',
      render: (value, item) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-muted rounded-md overflow-hidden">
            {item.images && item.images[0] ? (
              <img
                src={item.images[0]}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{item.title}</p>
            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {item.description}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Preço',
      render: (value, item) => (
        <div>
          <p className="font-semibold text-primary">
            R$ {item.price.toFixed(2)}
          </p>
          {item.promotional_price && (
            <p className="text-sm text-success">
              Promoção: R$ {item.promotional_price.toFixed(2)}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'stock_quantity',
      label: 'Estoque',
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
          {value === 0 && (
            <AlertCircle className="w-4 h-4 text-warning" />
          )}
        </div>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value, item) => (
        <button
          onClick={() => handleToggleStatus(item)}
          className="cursor-pointer"
        >
          <Badge variant={value ? "secondary" : "outline"}>
            {value ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Ativo
              </>
            ) : (
              'Inativo'
            )}
          </Badge>
        </button>
      )
    },
    {
      key: 'created_at',
      label: 'Criado em',
      render: (value) => format(new Date(value), 'dd/MM/yy', { locale: ptBR })
    }
  ];

  const stats = {
    total: products.length,
    active: products.filter(p => p.is_active).length,
    inactive: products.filter(p => !p.is_active).length,
    outOfStock: products.filter(p => p.stock_quantity === 0).length,
    averagePrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie seu catálogo de produtos
            </p>
          </div>
          <Button className="gap-2" onClick={handleNewProduct}>
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.outOfStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {stats.averagePrice.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={products}
              columns={columns}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              getItemId={(product) => product.id}
              emptyMessage="Nenhum produto cadastrado"
            />
          </CardContent>
        </Card>

        {/* Product Form Dialog */}
        <ProductForm
          open={showForm}
          onOpenChange={setShowForm}
          product={editingProduct || undefined}
          onSuccess={handleFormSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
          title="Excluir Produto(s)"
          description={
            deleteDialog.products.length === 1
              ? `Tem certeza que deseja excluir o produto "${deleteDialog.products[0]?.title}"? Esta ação não pode ser desfeita.`
              : `Tem certeza que deseja excluir ${deleteDialog.products.length} produtos? Esta ação não pode ser desfeita.`
          }
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="destructive"
          onConfirm={confirmDelete}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;