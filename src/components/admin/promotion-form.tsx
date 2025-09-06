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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Product, Promotion, PromotionFormData } from '@/types';
import { ProductService, PromotionService } from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const isEdit = !!promotion;

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
    } else {
      form.reset({
        product_id: '',
        discount_percentage: 10,
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        is_active: true,
      });
    }
  }, [promotion, form]);

  const loadProducts = async () => {
    try {
      const data = await ProductService.getProducts(false); // Get all products
      setProducts(data.filter(p => p.is_active)); // Only show active products
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const onSubmit = async (data: PromotionFormDataLocal) => {
    try {
      setLoading(true);
      
      if (isEdit) {
        // TODO: Implement promotion update
        toast.info('Edição de promoção ainda não implementada');
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
    onOpenChange(false);
  };

  const selectedProduct = products.find(p => p.id === form.watch('product_id'));
  const discountPercentage = form.watch('discount_percentage') || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
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