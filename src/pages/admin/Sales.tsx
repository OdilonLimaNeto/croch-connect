import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Filters } from '@/components/admin/filters';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SaleForm } from '@/components/admin/sale-form';
import { ExpenseForm } from '@/components/admin/expense-form';
import { SalesService } from '@/services/salesService';
import { ExpensesService } from '@/services/expensesService';
import { Sale, Expense, Installment, SaleFormData, ExpenseFormData } from '@/types';
import { TableColumn } from '@/types';
import { Plus, Search, Edit, Trash2, Eye, DollarSign, ShoppingCart, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saleToFormData, expenseToFormData } from '@/lib/formConverters';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [installmentToDelete, setInstallmentToDelete] = useState<Installment | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentMethod: '',
    category: '',
    startDate: '',
    endDate: ''
  });

  const { toast } = useToast();

  const salesFilterConfig = {
    search: true,
    fields: [
      {
        key: 'status' as keyof typeof filters,
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: '', label: 'Todos os status' },
          { value: 'pending', label: 'Pendente' },
          { value: 'paid', label: 'Pago' },
          { value: 'partial', label: 'Parcial' },
          { value: 'cancelled', label: 'Cancelado' }
        ]
      },
      {
        key: 'paymentMethod' as keyof typeof filters,
        label: 'Método de Pagamento',
        type: 'select' as const,
        options: [
          { value: '', label: 'Todos os métodos' },
          { value: 'cash', label: 'Dinheiro' },
          { value: 'credit_card', label: 'Cartão de Crédito' },
          { value: 'debit_card', label: 'Cartão de Débito' },
          { value: 'pix', label: 'PIX' },
          { value: 'bank_transfer', label: 'Transferência' },
          { value: 'installments', label: 'Parcelado' }
        ]
      }
    ]
  };

  const expensesFilterConfig = {
    search: true,
    fields: [
      {
        key: 'category' as keyof typeof filters,
        label: 'Categoria',
        type: 'select' as const,
        options: [
          { value: '', label: 'Todas as categorias' },
          { value: 'materials', label: 'Materiais' },
          { value: 'equipment', label: 'Equipamentos' },
          { value: 'other', label: 'Outros' }
        ]
      }
    ]
  };

  const installmentsFilterConfig = {
    search: true,
    fields: [
      {
        key: 'status' as keyof typeof filters,
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: '', label: 'Todos os status' },
          { value: 'pending', label: 'Pendente' },
          { value: 'paid', label: 'Pago' },
          { value: 'overdue', label: 'Vencido' }
        ]
      }
    ]
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Update overdue installments
    updateOverdueInstallments();
  }, [installments]);

  const updateOverdueInstallments = async () => {
    const today = new Date().toISOString().split('T')[0];
    const overdueInstallments = installments.filter(
      inst => inst.status === 'pending' && inst.due_date < today
    );

    if (overdueInstallments.length > 0) {
      try {
        await Promise.all(
          overdueInstallments.map(inst =>
            SalesService.updateInstallmentStatus(inst.id, 'overdue')
          )
        );
        // Silently update without reloading to avoid infinite loop
      } catch (error) {
        console.error('Error updating overdue installments:', error);
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesData, expensesData, installmentsData] = await Promise.all([
        SalesService.getSales(),
        ExpensesService.getExpenses(),
        SalesService.getInstallments()
      ]);

      setSales(salesData);
      setExpenses(expensesData);
      setInstallments(installmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleCreateSale = async (saleData: SaleFormData) => {
    setFormLoading(true);
    try {
      let result;
      if (editingSale) {
        result = await SalesService.updateSale(editingSale.id, saleData);
      } else {
        result = await SalesService.createSale(saleData);
      }
      
      if (editingSale ? result.success : (result.data && !result.error)) {
        toast({
          title: 'Sucesso!',
          description: editingSale ? 'Venda atualizada com sucesso.' : 'Venda criada com sucesso.',
        });
        
        setShowSaleForm(false);
        setEditingSale(null);
        await loadData(); // Reload data
      } else {
        toast({
          title: 'Erro',
          description: result.error || (editingSale ? 'Erro ao atualizar venda.' : 'Erro ao criar venda.'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error with sale:', error);
      toast({
        title: 'Erro',
        description: editingSale ? 'Erro inesperado ao atualizar venda.' : 'Erro inesperado ao criar venda.',
        variant: 'destructive'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateExpense = async (expenseData: ExpenseFormData) => {
    setFormLoading(true);
    try {
      let result;
      if (editingExpense) {
        result = await ExpensesService.updateExpense(editingExpense.id, expenseData);
      } else {
        result = await ExpensesService.createExpense(expenseData);
      }
      
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: editingExpense ? 'Gasto atualizado com sucesso.' : 'Gasto registrado com sucesso.',
        });
        
        setShowExpenseForm(false);
        setEditingExpense(null);
        await loadData(); // Reload data
      } else {
        toast({
          title: 'Erro',
          description: result.error || (editingExpense ? 'Erro ao atualizar gasto.' : 'Erro ao registrar gasto.'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error with expense:', error);
      toast({
        title: 'Erro',
        description: editingExpense ? 'Erro inesperado ao atualizar gasto.' : 'Erro inesperado ao registrar gasto.',
        variant: 'destructive'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateInstallmentStatus = async (installmentId: string, status: 'paid' | 'pending') => {
    setFormLoading(true);
    try {
      const result = await SalesService.updateInstallmentStatus(installmentId, status);
      
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: `Parcela marcada como ${status === 'paid' ? 'paga' : 'pendente'}.`,
        });
        
        await loadData(); // Reload data
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao atualizar parcela.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating installment:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao atualizar parcela.',
        variant: 'destructive'
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Handlers simples para edição e exclusão
  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setShowSaleForm(true);
  };

  const handleDeleteSale = (sale: Sale) => {
    setSaleToDelete(sale);
  };

  const confirmDeleteSale = async () => {
    if (!saleToDelete) return;
    
    setFormLoading(true);
    try {
      const result = await SalesService.deleteSale(saleToDelete.id);
      
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: 'Venda excluída com sucesso.',
        });
        
        setSaleToDelete(null);
        await loadData(); // Reload data
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao excluir venda.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao excluir venda.',
        variant: 'destructive'
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Funções para edição de gastos
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleUpdateExpense = async (expenseData: ExpenseFormData) => {
    if (!editingExpense) return;
    
    setFormLoading(true);
    try {
      const result = await ExpensesService.updateExpense(editingExpense.id, expenseData);
      
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: 'Gasto atualizado com sucesso.',
        });
        
        setShowExpenseForm(false);
        setEditingExpense(null);
        await loadData(); // Reload data
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao atualizar gasto.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao atualizar gasto.',
        variant: 'destructive'
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Funções para exclusão de gastos
  const handleDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    
    setFormLoading(true);
    try {
      const result = await ExpensesService.deleteExpense(expenseToDelete.id);
      
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: 'Gasto excluído com sucesso.',
        });
        
        setExpenseToDelete(null);
        await loadData(); // Reload data
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao excluir gasto.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao excluir gasto.',
        variant: 'destructive'
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Funções para exclusão de parcelas
  const handleDeleteInstallment = (installment: Installment) => {
    setInstallmentToDelete(installment);  
  };

  const confirmDeleteInstallment = async () => {
    if (!installmentToDelete) return;
    
    setFormLoading(true);
    try {
      // Como não temos um método específico para deletar parcelas no serviço,
      // podemos usar o updateInstallmentStatus ou criar um novo método
      // Por enquanto, vamos mostrar que não é possível excluir parcelas
      toast({
        title: 'Aviso',
        description: 'Não é possível excluir parcelas diretamente. Para cancelar uma parcela, marque-a como pendente.',
        variant: 'default'
      });
      
      setInstallmentToDelete(null);
    } catch (error) {
      console.error('Error with installment:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao processar parcela.',
        variant: 'destructive'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      paid: { label: 'Pago', variant: 'default' as const },
      partial: { label: 'Parcial', variant: 'outline' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
      overdue: { label: 'Vencido', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      'cash': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'bank_transfer': 'Transferência',
      'installments': 'Parcelado'
    };
    return methods[method] || method;
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'materials': 'Materiais',
      'equipment': 'Equipamentos',
      'other': 'Outros'
    };
    return categories[category] || category;
  };

  // Filter data based on current filters
  const filteredSales = sales.filter(sale => {
    if (filters.search && !sale.customer_name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && sale.payment_status !== filters.status) {
      return false;
    }
    if (filters.paymentMethod && sale.payment_method !== filters.paymentMethod) {
      return false;
    }
    return true;
  });

  const filteredExpenses = expenses.filter(expense => {
    if (filters.search && !expense.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.category && expense.category !== filters.category) {
      return false;
    }
    return true;
  });

  const filteredInstallments = installments.filter(installment => {
    if (filters.status && installment.status !== filters.status) {
      return false;
    }
    return true;
  });

  const salesColumns: TableColumn<Sale>[] = [
    {
      key: 'customer_name',
      label: 'Cliente',
      sortable: true
    },
    {
      key: 'total_amount',
      label: 'Valor Total',
      sortable: true,
      render: (value) => formatCurrency(Number(value))
    },
    {
      key: 'payment_method',
      label: 'Método',
      render: (value) => getPaymentMethodLabel(value as string)
    },
    {
      key: 'payment_status',
      label: 'Status',
      render: (value) => getStatusBadge(value as string)
    },
    {
      key: 'sale_date',
      label: 'Data',
      sortable: true,
      render: (value) => formatDate(value as string)
    }
  ];

  const expensesColumns: TableColumn<Expense>[] = [
    {
      key: 'description',
      label: 'Descrição',
      sortable: true
    },
    {
      key: 'amount',
      label: 'Valor',
      sortable: true,
      render: (value) => formatCurrency(Number(value))
    },
    {
      key: 'category',
      label: 'Categoria',
      render: (value) => getCategoryLabel(value as string)
    },
    {
      key: 'supplier',
      label: 'Fornecedor'
    },
    {
      key: 'date',
      label: 'Data',
      sortable: true,
      render: (value) => formatDate(value as string)
    }
  ];

  const installmentsColumns: TableColumn<Installment>[] = [
    {
      key: 'installment_number',
      label: 'Parcela',
      render: (value, item) => `${value}/${item.sale_id ? 'N/A' : 'N/A'}`
    },
    {
      key: 'amount',
      label: 'Valor',
      sortable: true,
      render: (value) => formatCurrency(Number(value))
    },
    {
      key: 'due_date',
      label: 'Vencimento',
      sortable: true,
      render: (value) => formatDate(value as string)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value as string)
    },
    {
      key: 'paid_date',
      label: 'Data Pagamento',
      render: (value) => value ? formatDate(value as string) : '-'
    },
    {
      key: 'id',
      label: 'Ações',
      render: (value, item) => (
        <div className="flex gap-2">
          {item.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdateInstallmentStatus(item.id, 'paid')}
              disabled={formLoading}
            >
              Marcar como Pago
            </Button>
          )}
          {item.status === 'paid' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdateInstallmentStatus(item.id, 'pending')}
              disabled={formLoading}
            >
              Marcar como Pendente
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteInstallment(item)}
            disabled={formLoading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
            <p className="text-muted-foreground">
              Gerencie vendas, gastos e parcelas
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showSaleForm} onOpenChange={setShowSaleForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Venda
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Venda</DialogTitle>
                  <DialogDescription>
                    Registre uma nova venda no sistema
                  </DialogDescription>
                </DialogHeader>
                <SaleForm
                  onSubmit={handleCreateSale}
                  onCancel={() => setShowSaleForm(false)}
                  isLoading={formLoading}
                />
              </DialogContent>
            </Dialog>
            
            <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Gasto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Gasto</DialogTitle>
                  <DialogDescription>
                    Registre um novo gasto no sistema
                  </DialogDescription>
                </DialogHeader>
                <ExpenseForm
                  onSubmit={handleCreateExpense}
                  onCancel={() => setShowExpenseForm(false)}
                  isLoading={formLoading}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Vendas
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Gastos
            </TabsTrigger>
            <TabsTrigger value="installments" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Parcelas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <Filters
                  configs={[
                    {
                      key: 'search',
                      label: 'Buscar',
                      type: 'search',
                      placeholder: 'Buscar por cliente...'
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      type: 'select',
                      options: [
                        { value: 'pending', label: 'Pendente' },
                        { value: 'paid', label: 'Pago' },
                        { value: 'partial', label: 'Parcial' },
                        { value: 'cancelled', label: 'Cancelado' }
                      ]
                    },
                    {
                      key: 'paymentMethod',
                      label: 'Método de Pagamento',
                      type: 'select',
                      options: [
                        { value: 'cash', label: 'Dinheiro' },
                        { value: 'credit_card', label: 'Cartão de Crédito' },
                        { value: 'debit_card', label: 'Cartão de Débito' },
                        { value: 'pix', label: 'PIX' },
                        { value: 'bank_transfer', label: 'Transferência' },
                        { value: 'installments', label: 'Parcelado' }
                      ]
                    }
                  ]}
                  values={filters}
                  onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }))}
                  onClear={() => setFilters(prev => ({ ...prev, search: '', status: '', paymentMethod: '' }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Vendas</CardTitle>
                <CardDescription>
                  {filteredSales.length} venda(s) encontrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={filteredSales}
                  columns={salesColumns}
                  loading={loading}
                  onEdit={handleEditSale}
                  onDelete={handleDeleteSale}
                  getItemId={(item) => item.id}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <Filters
                  configs={[
                    {
                      key: 'search',
                      label: 'Buscar',
                      type: 'search',
                      placeholder: 'Buscar por descrição...'
                    },
                    {
                      key: 'category',
                      label: 'Categoria',
                      type: 'select',
                      options: [
                        { value: 'materials', label: 'Materiais' },
                        { value: 'equipment', label: 'Equipamentos' },
                        { value: 'other', label: 'Outros' }
                      ]
                    }
                  ]}
                  values={filters}
                  onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }))}
                  onClear={() => setFilters(prev => ({ ...prev, search: '', category: '' }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Gastos</CardTitle>
                <CardDescription>
                  {filteredExpenses.length} gasto(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={filteredExpenses}
                  columns={expensesColumns}
                  loading={loading}
                  onEdit={handleEditExpense}
                  onDelete={handleDeleteExpense}
                  getItemId={(item) => item.id}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="installments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Parcelas</CardTitle>
              </CardHeader>
              <CardContent>
                <Filters
                  configs={[
                    {
                      key: 'status',
                      label: 'Status',
                      type: 'select',
                      options: [
                        { value: 'pending', label: 'Pendente' },
                        { value: 'paid', label: 'Pago' },
                        { value: 'overdue', label: 'Vencido' }
                      ]
                    }
                  ]}
                  values={filters}
                  onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }))}
                  onClear={() => setFilters(prev => ({ ...prev, status: '' }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Parcelas</CardTitle>
                <CardDescription>
                  {filteredInstallments.length} parcela(s) encontrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={filteredInstallments}
                  columns={installmentsColumns}
                  loading={loading}
                  getItemId={(item) => item.id}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Confirm Dialogs */}
        <ConfirmDialog
          open={!!saleToDelete}
          onOpenChange={() => setSaleToDelete(null)}
          onConfirm={confirmDeleteSale}
          title="Excluir Venda"
          description={`Tem certeza que deseja excluir a venda do cliente "${saleToDelete?.customer_name}"? Esta ação não pode ser desfeita.`}
        />

        <ConfirmDialog
          open={!!expenseToDelete}
          onOpenChange={() => setExpenseToDelete(null)}
          onConfirm={confirmDeleteExpense}
          title="Excluir Gasto"
          description={`Tem certeza que deseja excluir o gasto "${expenseToDelete?.description}"? Esta ação não pode ser desfeita.`}
        />

        <ConfirmDialog
          open={!!installmentToDelete}
          onOpenChange={() => setInstallmentToDelete(null)}
          onConfirm={confirmDeleteInstallment}
          title="Ação não permitida"
          description="Não é possível excluir parcelas diretamente. Para cancelar uma parcela, altere seu status ou exclua a venda relacionada."
        />

        {/* Edit Sale Dialog */}
        <Dialog open={!!editingSale} onOpenChange={(open) => !open && setEditingSale(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Venda</DialogTitle>
              <DialogDescription>
                Edite os dados da venda do cliente {editingSale?.customer_name}
              </DialogDescription>
            </DialogHeader>
            {editingSale && (
              <SaleForm
                sale={saleToFormData(editingSale)}
                onSubmit={handleCreateSale}
                onCancel={() => setEditingSale(null)}
                isLoading={formLoading}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Expense Dialog */}
        <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Gasto</DialogTitle>
              <DialogDescription>
                Edite os dados do gasto "{editingExpense?.description}"
              </DialogDescription>
            </DialogHeader>
            {editingExpense && (
              <ExpenseForm
                expense={expenseToFormData(editingExpense)}
                onSubmit={handleCreateExpense}
                onCancel={() => setEditingExpense(null)}
                isLoading={formLoading}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}