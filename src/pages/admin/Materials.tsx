import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminLayout } from '@/components/admin/admin-layout';
import { DataTable } from '@/components/ui/data-table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Palette, 
  Circle,
  Edit,
  Trash2
} from 'lucide-react';
import { Material, TableColumn } from '@/types';
import { MaterialService } from '@/services/api';
import { toast } from 'sonner';

const AdminMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: ''
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await MaterialService.getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do material é obrigatório');
      return;
    }

    try {
      const result = await MaterialService.createMaterial(
        formData.name,
        formData.description || undefined,
        formData.color || undefined
      );

      if (result.success) {
        toast.success('Material criado com sucesso');
        setDialogOpen(false);
        resetForm();
        loadMaterials();
      } else {
        toast.error(result.error || 'Erro ao criar material');
      }
    } catch (error) {
      toast.error('Erro ao criar material');
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      description: material.description || '',
      color: material.color || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (material: Material) => {
    if (window.confirm(`Tem certeza que deseja excluir "${material.name}"?`)) {
      try {
        const result = await MaterialService.deleteMaterials([material.id]);
        if (result.success) {
          toast.success('Material excluído com sucesso');
          loadMaterials();
        } else {
          toast.error(result.error || 'Erro ao excluir material');
        }
      } catch (error) {
        toast.error('Erro ao excluir material');
      }
    }
  };

  const handleBulkDelete = async (materials: Material[]) => {
    const materialIds = materials.map(m => m.id);
    const materialNames = materials.map(m => m.name).join(', ');
    
    if (window.confirm(`Tem certeza que deseja excluir ${materials.length} material(is)?\n\n${materialNames}`)) {
      try {
        const result = await MaterialService.deleteMaterials(materialIds);
        if (result.success) {
          toast.success(`${materials.length} material(is) excluído(s) com sucesso`);
          loadMaterials();
        } else {
          toast.error(result.error || 'Erro ao excluir materiais');
        }
      } catch (error) {
        toast.error('Erro ao excluir materiais');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '' });
    setEditingMaterial(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
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
          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary-foreground" />
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
      render: (value) => new Date(value).toLocaleDateString('pt-BR')
    }
  ];

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
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMaterial ? 'Editar Material' : 'Novo Material'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Material *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Algodão, Lã, Barbante..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição opcional do material"
                  />
                </div>
                
                <div>
                  <Label htmlFor="color">Cor Principal</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Ex: Branco, Cru, Rosa..."
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingMaterial ? 'Salvar Alterações' : 'Criar Material'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleDialogClose}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Total de Materiais Cadastrados
            </CardTitle>
            <Palette className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{materials.length}</div>
            <p className="text-xs text-muted-foreground">
              Materiais disponíveis para usar nos produtos
            </p>
          </CardContent>
        </Card>

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
      </div>
    </AdminLayout>
  );
};

export default AdminMaterials;