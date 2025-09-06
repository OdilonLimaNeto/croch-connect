import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Loader2, Plus, UserPlus, Shield, User, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from '@/types';

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

const editUserSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: z.enum(['admin', 'user']),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

const Users = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
    },
  });

  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: '',
      full_name: '',
      role: 'user',
    },
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Erro ao carregar usuários');
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onCreateUser = async (data: CreateUserFormData) => {
    setCreateLoading(true);
    setError(null);

    try {
      const { user: newUser, error } = await AuthService.signUp({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: 'admin'
      });

      if (error) {
        setError(error);
        return;
      }

      if (newUser) {
        toast.success('Administrador criado com sucesso! Um email de confirmação foi enviado.');
        setDialogOpen(false);
        form.reset();
        fetchUsers(); // Recarrega a lista
      }
    } catch (error) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    editForm.reset({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });
    setEditDialogOpen(true);
    setEditError(null);
  };

  const onEditUser = async (data: EditUserFormData) => {
    if (!selectedUser) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const { success, error } = await AuthService.updateUser(selectedUser.user_id, {
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      });

      if (!success && error) {
        setEditError(error);
        return;
      }

      toast.success('Usuário atualizado com sucesso!');
      setEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      setEditError('Erro inesperado. Tente novamente.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = (user: Profile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    setDeleteLoading(true);

    try {
      const { success, error } = await AuthService.deleteUser(selectedUser.user_id);

      if (!success && error) {
        toast.error(`Erro ao excluir usuário: ${error}`);
        return;
      }

      toast.success('Usuário excluído com sucesso!');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Erro inesperado ao excluir usuário.');
    } finally {
      setDeleteLoading(false);
    }
  };


  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie os administradores do sistema
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Administrador
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Criar Novo Administrador
                </DialogTitle>
              </DialogHeader>

              {error && (
                <Alert className="border-destructive/50 text-destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateUser)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome completo do administrador"
                            {...field}
                            disabled={createLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            {...field}
                            disabled={createLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha Temporária</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            disabled={createLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={createLoading}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createLoading} className="flex-1">
                      {createLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Criar Administrador
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Editar Usuário
              </DialogTitle>
            </DialogHeader>

            {editError && (
              <Alert className="border-destructive/50 text-destructive">
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditUser)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome completo"
                          {...field}
                          disabled={editLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          {...field}
                          disabled={editLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={editLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="user">Usuário</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    disabled={editLoading}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={editLoading} className="flex-1">
                    {editLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o usuário <strong>{selectedUser?.full_name}</strong>?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteUser}
                disabled={deleteLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Nome</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Função</th>
                    <th className="text-left p-4 font-medium">Criado em</th>
                    <th className="text-left p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{user.full_name}</td>
                      <td className="p-4 text-muted-foreground">{user.email}</td>
                      <td className="p-4">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Administrador
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 mr-1" />
                              Usuário
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Users;