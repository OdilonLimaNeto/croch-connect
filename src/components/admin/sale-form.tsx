import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SaleFormData, SaleItemFormData, Product } from '@/types';
import { Plus, Trash2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SaleFormProps {
  onSubmit: (data: SaleFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SaleForm: React.FC<SaleFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<SaleFormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    total_amount: 0,
    payment_method: 'cash',
    payment_status: 'pending',
    installments_count: 1,
    sale_date: new Date(),
    notes: '',
    items: []
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    // Recalculate total when items change
    const total = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    setFormData(prev => ({ ...prev, total_amount: total }));
  }, [formData.items]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('title');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleInputChange = (field: keyof SaleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: '',
        product_name: '',
        quantity: 1,
        unit_price: 0
      }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: keyof SaleItemFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // If product is selected, update name and price
          if (field === 'product_id' && value) {
            const selectedProduct = products.find(p => p.id === value);
            if (selectedProduct) {
              updatedItem.product_name = selectedProduct.title;
              updatedItem.unit_price = Number(selectedProduct.promotional_price || selectedProduct.price);
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customer_name.trim()) {
      alert('Nome do cliente é obrigatório');
      return;
    }
    
    if (formData.items.length === 0) {
      alert('Adicione pelo menos um item à venda');
      return;
    }
    
    if (formData.items.some(item => !item.product_name.trim() || item.quantity <= 0 || item.unit_price <= 0)) {
      alert('Todos os itens devem ter nome, quantidade e preço válidos');
      return;
    }

    await onSubmit(formData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Nome do Cliente *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                placeholder="Digite o nome do cliente"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Telefone</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone}
                onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                placeholder="(XX) XXXXX-XXXX"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer_email">E-mail</Label>
            <Input
              id="customer_email"
              type="email"
              value={formData.customer_email}
              onChange={(e) => handleInputChange('customer_email', e.target.value)}
              placeholder="cliente@exemplo.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sale Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Itens da Venda</CardTitle>
              <CardDescription>Adicione os produtos vendidos</CardDescription>
            </div>
            <Button type="button" onClick={handleAddItem} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2" />
              <p>Nenhum item adicionado ainda</p>
              <p className="text-sm">Clique em "Adicionar Item" para começar</p>
            </div>
          ) : (
            formData.items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Produto</Label>
                    <Select
                      value={item.product_id || ''}
                      onValueChange={(value) => handleItemChange(index, 'product_id', value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar produto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Produto personalizado</SelectItem>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nome do Produto *</Label>
                    <Input
                      value={item.product_name}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      placeholder="Nome do produto"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Preço Unitário *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge variant="secondary">
                    Total: {formatCurrency(item.quantity * item.unit_price)}
                  </Badge>
                </div>
              </div>
            ))
          )}
          
          {formData.items.length > 0 && (
            <>
              <Separator />
              <div className="text-right">
                <div className="text-lg font-semibold">
                  Total da Venda: {formatCurrency(formData.total_amount)}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Método de Pagamento *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value: any) => handleInputChange('payment_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="installments">Parcelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status do Pagamento *</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value: any) => handleInputChange('payment_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {formData.payment_method === 'installments' && (
            <div className="space-y-2">
              <Label>Número de Parcelas</Label>
              <Input
                type="number"
                min="2"
                max="24"
                value={formData.installments_count}
                onChange={(e) => handleInputChange('installments_count', parseInt(e.target.value) || 2)}
              />
              <p className="text-sm text-muted-foreground">
                Valor por parcela: {formatCurrency(formData.total_amount / formData.installments_count)}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Data da Venda *</Label>
            <Input
              type="date"
              value={formData.sale_date.toISOString().split('T')[0]}
              onChange={(e) => handleInputChange('sale_date', new Date(e.target.value))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações adicionais sobre a venda"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || formData.items.length === 0}>
          {isLoading ? 'Salvando...' : 'Criar Venda'}
        </Button>
      </div>
    </form>
  );
};