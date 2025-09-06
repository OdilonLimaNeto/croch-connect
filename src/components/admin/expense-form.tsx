import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ExpenseFormData } from '@/types';

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: 0,
    category: 'materials',
    date: new Date(),
    supplier: '',
    notes: '',
  });

  const handleInputChange = (field: keyof ExpenseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.description.trim()) {
      alert('Descrição é obrigatória');
      return;
    }
    
    if (formData.amount <= 0) {
      alert('Valor deve ser maior que zero');
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
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Gasto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva o gasto (ex: Lã para produtos, Agulhas de crochê)"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                required
              />
              {formData.amount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(formData.amount)}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="materials">Materiais</SelectItem>
                  <SelectItem value="equipment">Equipamentos</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date.toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('date', new Date(e.target.value))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                placeholder="Nome do fornecedor ou loja"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações adicionais sobre o gasto"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Description */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h4 className="font-medium">Sobre as Categorias:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>Materiais:</strong> Lãs, linhas, botões, enchimentos, etc.</li>
              <li><strong>Equipamentos:</strong> Agulhas, tesouras, máquinas, etc.</li>
              <li><strong>Outros:</strong> Embalagens, etiquetas, marketing, etc.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || formData.amount <= 0}>
          {isLoading ? 'Salvando...' : 'Registrar Gasto'}
        </Button>
      </div>
    </form>
  );
};