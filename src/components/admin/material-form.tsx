import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Material } from '@/types';
import { MaterialService } from '@/services/api';
import { toast } from 'sonner';

const materialSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  color: z.string().optional(),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface MaterialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material;
  onSuccess?: () => void;
}

export const MaterialForm: React.FC<MaterialFormProps> = ({
  open,
  onOpenChange,
  material,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!material;

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '',
    },
  });

  useEffect(() => {
    if (material) {
      form.reset({
        name: material.name,
        description: material.description || '',
        color: material.color || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        color: '',
      });
    }
  }, [material, form]);

  const onSubmit = async (data: MaterialFormData) => {
    try {
      setLoading(true);

      const result = isEdit && material
        ? await MaterialService.updateMaterial(
            material.id,
            data.name,
            data.description || undefined,
            data.color || undefined
          )
        : await MaterialService.createMaterial(
            data.name,
            data.description || undefined,
            data.color || undefined
          );

      if (result.success) {
        toast.success(`Material ${isEdit ? 'editado' : 'criado'} com sucesso!`);
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(result.error || `Erro ao ${isEdit ? 'editar' : 'criar'} material`);
      }
    } catch (error) {
      toast.error(`Erro ao ${isEdit ? 'editar' : 'criar'} material`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Material' : 'Novo Material'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Edite as informações do material existente.' 
              : 'Preencha as informações para criar um novo material.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Algodão Orgânico" 
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição detalhada do material..."
                      rows={3}
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input 
                        type="color"
                        className="w-16 h-10 p-1"
                        {...field}
                        disabled={loading}
                      />
                      <Input 
                        placeholder="Ex: Azul Marinho"
                        {...field}
                        disabled={loading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {isEdit ? 'Salvando...' : 'Criando...'}
                  </>
                ) : (
                  isEdit ? 'Salvar' : 'Criar Material'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};