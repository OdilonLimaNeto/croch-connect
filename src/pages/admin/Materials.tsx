import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { DataTable } from '@/components/ui/data-table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MaterialForm } from '@/components/admin/material-form';
import { 
  Plus, 
  Package, 
  Palette, 
  List,
  Layers,
  Circle
} from 'lucide-react';
import { Material, TableColumn } from '@/types';
import { MaterialService } from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    materials: Material[];
  }>({ open: false, materials: [] });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      console.log('Materials: Starting to load materials...');
      setLoading(true);
      const data = await MaterialService.getMaterials();
      console.log('Materials: Loaded materials:', data);
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      console.log('Materials: Finished loading, setting loading to false');
      setLoading(false);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setShowForm(true);
  };

  const handleDelete = (material: Material) => {
    setDeleteDialog({
      open: true,
      materials: [material],
    });
  };

  const handleBulkDelete = (materials: Material[]) => {
    setDeleteDialog({
      open: true,
      materials,
    });
  };

  const confirmDelete = async () => {
    const { materials } = deleteDialog;
    const materialIds = materials.map(m => m.id);
    
    try {
      const result = await MaterialService.deleteMaterials(materialIds);
      if (result.success) {
        toast.success(`${materials.length} material(ais) excluído(s) com sucesso`);
        loadMaterials();
      } else {
        toast.error(result.error || 'Erro ao excluir materiais');
      }
    } catch (error) {
      toast.error('Erro ao excluir materiais');
    } finally {
      setDeleteDialog({ open: false, materials: [] });
    }
  };

  const handleNewMaterial = () => {
    setEditingMaterial(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    loadMaterials();
    setShowForm(false);
    setEditingMaterial(null);
  };

  const getColorBadge = (color: string | null) => {
    if (!color) return null;
    
    const colorMap: Record<string, string> = {
      'Branco': 'bg-gray-100 text-gray-800 border-gray-200',
      'Cru': 'bg-amber-50 text-amber-800 border-amber-200',
      'Cinza': 'bg-gray-200 text-gray-800 border-gray-300',
      'Rosa': 'bg-pink-100 text-pink-800 border-pink-200',
      'Azul': 'bg-blue-100 text-blue-800 border-blue-200',
      'Verde': 'bg-green-100 text-green-800 border-green-200',
      'Vermelho': 'bg-red-100 text-red-800 border-red-200',
      'Amarelo': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    return (
      <Badge 
        variant="outline" 
        className={`gap-1 ${colorMap[color] || 'bg-muted text-muted-foreground'}`}
      >
        <Circle className="w-2 h-2 fill-current" />
        {color}
      </Badge>
    );
  };

  const columns: TableColumn<Material>[] = [
    {
      key: 'name',
      label: 'Material',
      render: (value, item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{value}</p>
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
      key: 'color',
      label: 'Cor',
      render: (value) => getColorBadge(value)
    },
    {
      key: 'created_at',
      label: 'Criado em',
      render: (value) => format(new Date(value), 'dd/MM/yy', { locale: ptBR })
    }
  ];

  const stats = {
    total: materials.length,
    withColor: materials.filter(m => m.color).length,
    withDescription: materials.filter(m => m.description).length
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Materiais</h1>
            <p className="text-muted-foreground">
              Gerencie os materiais utilizados nos produtos
            </p>
          </div>
          <Button className="gap-2" onClick={handleNewMaterial}>
            <Plus className="w-4 h-4" />
            Novo Material
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <CardTitle className="text-sm font-medium">Com Cor</CardTitle>
              <Palette className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.withColor}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Descrição</CardTitle>
              <List className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.withDescription}</div>
            </CardContent>
          </Card>
        </div>

        {/* Materials Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Materiais</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={materials}
              columns={columns}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              getItemId={(material) => material.id}
              emptyMessage="Nenhum material cadastrado"
            />
          </CardContent>
        </Card>

        {/* Material Form Dialog */}
        <MaterialForm
          open={showForm}
          onOpenChange={setShowForm}
          material={editingMaterial || undefined}
          onSuccess={handleFormSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
          title="Excluir Material(ais)"
          description={
            deleteDialog.materials.length === 1
              ? `Tem certeza que deseja excluir o material "${deleteDialog.materials[0]?.name}"? Esta ação não pode ser desfeita.`
              : `Tem certeza que deseja excluir ${deleteDialog.materials.length} materiais? Esta ação não pode ser desfeita.`
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

export default AdminMaterials;