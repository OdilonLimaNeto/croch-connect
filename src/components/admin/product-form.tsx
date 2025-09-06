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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, GripVertical, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface ImageItem {
  id: string;
  url: string;
  isNew: boolean;
}

interface SortableImageProps {
  image: ImageItem;
  onRemove: (id: string) => void;
  disabled: boolean;
}

const SortableImage: React.FC<SortableImageProps> = ({ image, onRemove, disabled }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group bg-muted rounded-lg overflow-hidden"
    >
      <img
        src={image.url}
        alt={`Produto`}
        className="w-full h-20 object-cover"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={disabled}
        >
          <Trash2 className="w-3 h-3" />
        </button>
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 bg-background/80 text-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3 h-3" />
        </div>
      </div>
      {image.isNew && (
        <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground rounded px-1 text-xs">
          Nova
        </div>
      )}
    </div>
  );
};

const MAX_IMAGES = 5;

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
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [newMaterial, setNewMaterial] = useState('');
  const isEdit = !!product;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      // Load existing images
      const imageItems = (product.images || []).map((url, index) => ({
        id: `existing-${index}`,
        url,
        isNew: false
      }));
      setImageItems(imageItems);
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
      setImageItems([]);
      setImages([]);
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

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const deleteImage = async (imageUrl: string) => {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const filePath = url.pathname.split('/storage/v1/object/public/product-images/')[1];
      
      if (filePath) {
        await supabase.storage
          .from('product-images')
          .remove([filePath]);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const handleImagesChange = (newFiles: File[]) => {
    const currentImageCount = imageItems.filter(item => !item.isNew).length;
    const availableSlots = MAX_IMAGES - currentImageCount;
    
    if (newFiles.length > availableSlots) {
      toast.error(`Você pode adicionar no máximo ${availableSlots} imagem(ns). Limite total: ${MAX_IMAGES} imagens por produto.`);
      return;
    }
    
    // Clean up old object URLs from previous new images
    imageItems.filter(item => item.isNew).forEach(item => {
      URL.revokeObjectURL(item.url);
    });
    
    setImages(newFiles);
    
    // Replace new images in the preview (keeping existing ones)
    const existingImages = imageItems.filter(item => !item.isNew);
    const newImageItems = newFiles.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      isNew: true
    }));
    
    setImageItems([...existingImages, ...newImageItems]);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setImageItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    const imageItem = imageItems.find(item => item.id === imageId);
    if (!imageItem) return;

    if (imageItem.isNew) {
      // Remove from new images array
      const newImageIndex = imageItems
        .filter(item => item.isNew)
        .findIndex(item => item.id === imageId);
      
      if (newImageIndex !== -1) {
        setImages(prev => prev.filter((_, index) => index !== newImageIndex));
      }
      
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(imageItem.url);
    } else {
      // Delete existing image from storage
      await deleteImage(imageItem.url);
    }

    setImageItems(prev => prev.filter(item => item.id !== imageId));
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);
      
      // Upload new images if any
      const newImageUrls = images.length > 0 ? await uploadImages(images) : [];
      
      // Get final image order (existing + new images)
      const allImages = imageItems.map((item, itemIndex) => {
        if (item.isNew) {
          const newImageIndex = imageItems
            .slice(0, itemIndex)
            .filter(img => img.isNew).length;
          return newImageUrls[newImageIndex];
        }
        return item.url;
      }).filter(Boolean);
      
      // Prepare the product data
      const productData = {
        title: data.title,
        description: data.description || null,
        price: data.price,
        promotional_price: data.promotional_price || null,
        stock_quantity: data.stock_quantity,
        materials: data.materials || [],
        is_active: data.is_active,
        images: allImages
      };

      if (isEdit && product) {
        // Update existing product
        const result = await ProductService.updateProduct(product.id, productData);
        
        if (result.success) {
          toast.success('Produto atualizado com sucesso!');
          onSuccess?.();
          handleClose();
        } else {
          toast.error(result.error || 'Erro ao atualizar produto');
        }
      } else {
        // Create new product
        const result = await ProductService.createProduct({
          ...productData,
          images: allImages
        } as any);
        
        if (result.success) {
          toast.success('Produto criado com sucesso!');
          onSuccess?.();
          handleClose();
        } else {
          toast.error(result.error || 'Erro ao criar produto');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(`Erro ao ${isEdit ? 'editar' : 'criar'} produto`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setImages([]);
    setImageItems([]);
    setNewMaterial('');
    // Clean up object URLs
    imageItems.filter(item => item.isNew).forEach(item => {
      URL.revokeObjectURL(item.url);
    });
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

            {/* Product Images Section */}
            <div className="space-y-4">
              <FormLabel>Imagens do Produto</FormLabel>
              <div className="text-sm text-muted-foreground">
                Máximo de {MAX_IMAGES} imagens. Arraste para reordenar.
              </div>
              
              {/* Current Images with Drag & Drop */}
              {imageItems.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Imagens atuais ({imageItems.length}/{MAX_IMAGES}):
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={imageItems.map(item => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-5 gap-2">
                        {imageItems.map((imageItem) => (
                          <SortableImage
                            key={imageItem.id}
                            image={imageItem}
                            onRemove={handleRemoveImage}
                            disabled={loading}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* Add New Images */}
              {imageItems.length < MAX_IMAGES && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Adicionar novas imagens ({MAX_IMAGES - imageItems.length} disponível(is)):
                  </div>
                  <ImageUpload
                    images={images}
                    onImagesChange={handleImagesChange}
                    maxImages={MAX_IMAGES - imageItems.length}
                    maxSize={5}
                    disabled={loading}
                  />
                </div>
              )}

              {imageItems.length >= MAX_IMAGES && (
                <div className="bg-muted/50 border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground">
                  Limite máximo de {MAX_IMAGES} imagens atingido. Remova uma imagem para adicionar outra.
                </div>
              )}
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