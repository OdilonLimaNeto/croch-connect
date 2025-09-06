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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ImageUpload } from '@/components/ui/image-upload';
import { Product, Material } from '@/types';
import { ProductService, MaterialService } from '@/services/api';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const productSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().optional(),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  promotional_price: z.number().optional(),
  stock_quantity: z.number().min(0, 'Estoque não pode ser negativo').int('Estoque deve ser um número inteiro'),
  materials: z.array(z.string()).optional(),
  is_active: z.boolean(),
}).refine((data) => {
  if (data.promotional_price && data.promotional_price >= data.price) {
    return false;
  }
  return true;
}, {
  message: "Preço promocional deve ser menor que o preço normal",
  path: ["promotional_price"],
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  onSuccess?: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  open,
  onOpenChange,
  product,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [newMaterial, setNewMaterial] = useState('');
  const isEdit = !!product;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      promotional_price: undefined,
      stock_quantity: 0,
      materials: [],
      is_active: true,
    },
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    if (product) {
      form.reset({
        title: product.title,
        description: product.description || '',
        price: product.price,
        promotional_price: product.promotional_price || undefined,
        stock_quantity: product.stock_quantity,
        materials: product.materials || [],
        is_active: product.is_active,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        price: 0,
        promotional_price: undefined,
        stock_quantity: 0,
        materials: [],
        is_active: true,
      });
    }
  }, [product, form]);

  const loadMaterials = async () => {
    try {
      const data = await MaterialService.getMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const addMaterial = (materialName?: string) => {
    const materialToAdd = materialName || newMaterial.trim();
    if (materialToAdd && !form.getValues('materials')?.includes(materialToAdd)) {
      const currentMaterials = form.getValues('materials') || [];
      form.setValue('materials', [...currentMaterials, materialToAdd]);
      setNewMaterial('');
    }
  };

  const removeMaterial = (materialToRemove: string) => {
    const currentMaterials = form.getValues('materials') || [];
    form.setValue('materials', currentMaterials.filter(m => m !== materialToRemove));
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);
      
      // TODO: Implement product creation/update with images
      toast.info(`${isEdit ? 'Edição' : 'Criação'} de produto ainda não implementada`);
      
    } catch (error) {
      toast.error(`Erro ao ${isEdit ? 'editar' : 'criar'} produto`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setImages([]);
    setNewMaterial('');
    onOpenChange(false);
  };

  const selectedMaterials = form.watch('materials') || [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Edite as informações do produto existente.' 
              : 'Preencha as informações para criar um novo produto.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Conjunto Baby Azul"
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
                      placeholder="Descrição detalhada do produto..."
                      rows={3}
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="promotional_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Promocional</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stock_quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade em Estoque *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Materiais</FormLabel>
              
              {/* Select from existing materials */}
              {materials.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Selecionar material existente:</p>
                  <Select onValueChange={(value) => addMaterial(value)} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um material..." />
                    </SelectTrigger>
                    <SelectContent>
                      {materials
                        .filter(material => !selectedMaterials.includes(material.name))
                        .map((material) => (
                          <SelectItem key={material.id} value={material.name}>
                            <div className="flex items-center gap-2">
                              {material.color && (
                                <div 
                                  className="w-3 h-3 rounded-full border" 
                                  style={{ backgroundColor: material.color }}
                                />
                              )}
                              <span>{material.name}</span>
                              {material.description && (
                                <span className="text-xs text-muted-foreground">
                                  - {material.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Add new material */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ou adicionar novo material:</p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Nome do novo material..."
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                    disabled={loading}
                  />
                  <Button 
                    type="button" 
                    onClick={() => addMaterial()}
                    disabled={!newMaterial.trim() || loading}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
              
              {/* Selected materials */}
              {selectedMaterials.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Materiais selecionados:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMaterials.map((material) => (
                      <Badge key={material} variant="secondary" className="gap-1">
                        {material}
                        <button
                          type="button"
                          onClick={() => removeMaterial(material)}
                          className="hover:bg-muted rounded-full p-0.5"
                          disabled={loading}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <FormLabel>Imagens do Produto</FormLabel>
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={5}
                disabled={loading}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Produto Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      O produto será visível na loja
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
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
                  isEdit ? 'Salvar' : 'Criar Produto'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};