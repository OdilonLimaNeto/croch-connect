import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { FounderForm } from '@/components/admin/founder-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  User,
  MoreHorizontal
} from 'lucide-react';
import { FounderService } from '@/services/founderService';
import { Founder, FounderFormData } from '@/types';

export default function Founders() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFounder, setEditingFounder] = useState<Founder | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFounders();
  }, []);

  const loadFounders = async () => {
    try {
      setLoading(true);
      const data = await FounderService.getFounders();
      setFounders(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar fundadoras',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFounder = async (data: FounderFormData) => {
    try {
      setFormLoading(true);
      const result = await FounderService.createFounder(data);
      
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Fundadora criada com sucesso',
        });
        setShowForm(false);
        loadFounders();
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao criar fundadora',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao criar fundadora',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateFounder = async (data: FounderFormData) => {
    if (!editingFounder) return;

    try {
      setFormLoading(true);
      const result = await FounderService.updateFounder(editingFounder.id, data);
      
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Fundadora atualizada com sucesso',
        });
        setEditingFounder(undefined);
        setShowForm(false);
        loadFounders();
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao atualizar fundadora',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao atualizar fundadora',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteFounder = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fundadora?')) return;

    try {
      const result = await FounderService.deleteFounders([id]);
      
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Fundadora excluída com sucesso',
        });
        loadFounders();
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao excluir fundadora',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao excluir fundadora',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const result = await FounderService.toggleFounderStatus(id, !isActive);
      
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: `Fundadora ${!isActive ? 'ativada' : 'desativada'} com sucesso`,
        });
        loadFounders();
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao alterar status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao alterar status',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (founder: Founder) => {
    setEditingFounder(founder);
    setShowForm(true);
  };

  const startCreate = () => {
    setEditingFounder(undefined);
    setShowForm(true);
  };

  const cancelForm = () => {
    setEditingFounder(undefined);
    setShowForm(false);
  };

  if (showForm) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto">
          <FounderForm
            founder={editingFounder}
            onSubmit={editingFounder ? handleUpdateFounder : handleCreateFounder}
            onCancel={cancelForm}
            isLoading={formLoading}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fundadoras</h1>
            <p className="text-muted-foreground">
              Gerencie as informações das fundadoras
            </p>
          </div>
          <Button className="gap-2" onClick={startCreate}>
            <Plus className="w-4 h-4" />
            Nova Fundadora
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-6">
            {founders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhuma fundadora cadastrada
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Adicione informações sobre as fundadoras do empreendimento
                  </p>
                  <Button className="gap-2" onClick={startCreate}>
                    <Plus className="w-4 h-4" />
                    Adicionar Primeira Fundadora
                  </Button>
                </CardContent>
              </Card>
            ) : (
              founders.map((founder) => (
                <Card key={founder.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                          {founder.image_url ? (
                            <img
                              src={founder.image_url}
                              alt={founder.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                              <User className="w-8 h-8 text-primary" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold">{founder.name}</h3>
                            <p className="text-primary font-medium">{founder.role}</p>
                            {founder.description && (
                              <p className="text-muted-foreground mt-2">
                                {founder.description}
                              </p>
                            )}
                            {founder.expertise.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {founder.expertise.map((exp, index) => (
                                  <Badge key={index} variant="secondary">
                                    {exp}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={founder.is_active ? 'default' : 'secondary'}>
                              {founder.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEdit(founder)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => handleToggleStatus(founder.id, founder.is_active)}>
                                {founder.is_active ? (
                                  <EyeOff className="w-4 h-4 mr-2" />
                                ) : (
                                  <Eye className="w-4 h-4 mr-2" />
                                )}
                                {founder.is_active ? 'Desativar' : 'Ativar'}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => handleDeleteFounder(founder.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}