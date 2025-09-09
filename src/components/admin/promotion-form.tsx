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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ImageUpload } from '@/components/ui/image-upload';
import { Product, Promotion, PromotionFormData } from '@/types';
import { ProductService, PromotionService } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Package, GripVertical, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIOSScrollFix } from '@/hooks/use-ios-scroll-fix';
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

const promotionSchema = z.object({
  product_id: z.string().min(1, 'Produto é obrigatório'),
  discount_percentage: z.number().min(1, 'Desconto deve ser maior que 0%').max(99, 'Desconto deve ser menor que 100%').int('Desconto deve ser um número inteiro'),
  start_date: z.date({
    required_error: 'Data de início é obrigatória',
  }),
  end_date: z.date({
    required_error: 'Data de fim é obrigatória',
  }),
  is_active: z.boolean(),
}).refine((data) => {
  return data.end_date > data.start_date;
}, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["end_date"],
});

type PromotionFormDataLocal = z.infer<typeof promotionSchema>;

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

const MAX_IMAGES = 3;

interface PromotionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion?: Promotion;
  onSuccess?: () => void;
}

export const PromotionForm: React.FC<PromotionFormProps> = ({
  open,
  onOpenChange,
  promotion,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const isEdit = !!promotion;

  // Hook para correções específicas do iOS
  const { getScrollClasses } = useIOSScrollFix();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm<PromotionFormDataLocal>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      product_id: '',
      discount_percentage: 10,
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);

  useEffect(() => {
    if (promotion) {
      form.reset({
        product_id: promotion.product_id,
        discount_percentage: promotion.discount_percentage,
        start_date: new Date(promotion.start_date),
        end_date: new Date(promotion.end_date),
        is_active: promotion.is_active,
      });
      // Load existing images for the selected product
      const selectedProduct = products.find(p => p.id === promotion.product_id);
      if (selectedProduct) {
        const imageItems = (selectedProduct.images || []).map((url, index) => ({
          id: `existing-${index}`,
          url,
          isNew: false
        }));
        setImageItems(imageItems);
      }
    } else {
      form.reset({
        product_id: '',
        discount_percentage: 10,
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        is_active: true,
      });
      setImageItems([]);
      setImages([]);
    }
  }, [promotion, form, products]);

  // Update existing images when product selection changes
  useEffect(() => {
    const productId = form.watch('product_id');
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      const imageItems = (selectedProduct.images || []).map((url, index) => ({
        id: `existing-${index}`,
        url,
        isNew: false
      }));
      setImageItems(imageItems);
    } else {
      setImageItems([]);
    }
    setImages([]); // Reset new images when product changes
  }, [form.watch('product_id'), products]);

  const loadProducts = async () => {
    try {
      const data = await ProductService.getProducts(false); // Get all products
      setProducts(data.filter(p => p.is_active)); // Only show active products
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erro ao carregar produtos');
    }
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

  const onSubmit = async (data: PromotionFormDataLocal) => {
    try {
      setLoading(true);
      
      // Upload new images if any
      const newImageUrls = images.length > 0 ? await uploadImages(images) : [];
      
      // Get final image order (existing + new images)
      const existingImages = imageItems.filter(item => !item.isNew).map(item => item.url);
      const allImages = imageItems.map((item, itemIndex) => {
        if (item.isNew) {
          const newImageIndex = imageItems
            .slice(0, itemIndex)
            .filter(img => img.isNew).length;
          return newImageUrls[newImageIndex];
        }
        return item.url;
      }).filter(Boolean);
      
      // Update product images if there are changes
      const selectedProduct = products.find(p => p.id === data.product_id);
      if (images.length > 0 || existingImages.length !== (selectedProduct?.images?.length || 0)) {
        const updateResult = await ProductService.updateProduct(data.product_id, {
          images: allImages
        });
        
        if (!updateResult.success) {
          toast.error('Erro ao atualizar imagens do produto');
          return;
        }
      }
      
      if (isEdit && promotion) {
        const result = await PromotionService.updatePromotion(promotion.id, data as PromotionFormData);
        
        if (result.success) {
          toast.success('Promoção atualizada com sucesso!');
          handleClose();
          onSuccess?.();
        } else {
          toast.error(result.error || 'Erro ao atualizar promoção');
        }
      } else {
        const result = await PromotionService.createPromotion(data as PromotionFormData);
        
        if (result.success) {
          toast.success('Promoção criada com sucesso!');
          handleClose();
          onSuccess?.();
        } else {
          toast.error(result.error || 'Erro ao criar promoção');
        }
      }
      
    } catch (error) {
      toast.error(`Erro ao ${isEdit ? 'editar' : 'criar'} promoção`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setImages([]);
    setImageItems([]);
    // Clean up object URLs
    imageItems.filter(item => item.isNew).forEach(item => {
      URL.revokeObjectURL(item.url);
    });
    onOpenChange(false);
  };

  const selectedProduct = products.find(p => p.id === form.watch('product_id'));
  const discountPercentage = form.watch('discount_percentage') || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn("sm:max-w-[500px] max-h-[90vh]", getScrollClasses())}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Promoção' : 'Nova Promoção'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Edite as informações da promoção existente.' 
              : 'Preencha as informações para criar uma nova promoção.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-2">
                            {product.images && product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                className="w-6 h-6 rounded object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{product.title}</p>
                              <p className="text-sm text-muted-foreground">
                                R$ {product.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discount_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="1"
                      max="99"
                      placeholder="10"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                  {selectedProduct && discountPercentage > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Preço com desconto: R$ {(selectedProduct.price * (1 - discountPercentage / 100)).toFixed(2)}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={loading}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecionar data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(Date.now() - 86400000)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={loading}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecionar data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(Date.now() - 86400000)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Product Images Section - Read Only */}
            {form.watch('product_id') && (
              <div className="space-y-4">
                <FormLabel>Imagens do Produto</FormLabel>
                
                {/* Current Images - Read Only */}
                {imageItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      Imagens atuais (apenas visualização):
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imageItems.map((item, index) => (
                        <Card key={item.id} className="relative overflow-hidden">
                          <CardContent className="p-2">
                            <div className="aspect-square bg-muted rounded-md overflow-hidden relative">
                              <img
                                src={item.url}
                                alt={`Imagem ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground text-center">
                              Posição {index + 1}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 text-primary" />
                    <div>
                      <p className="font-medium mb-1">Sobre as Imagens:</p>
                      <ul className="space-y-1">
                        <li>• Para editar imagens, use o módulo de Produtos</li>
                        <li>• As promoções utilizam as imagens do produto</li>
                        <li>• Máximo de {MAX_IMAGES} imagens por produto</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Promoção Ativa</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      A promoção será aplicada automaticamente
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
                  isEdit ? 'Salvar' : 'Criar Promoção'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};