import { supabase } from '@/integrations/supabase/client';
import { AnalyticsData, MonthlyData, CategoryExpense, PaymentMethodData } from '@/types';

export class AnalyticsService {
  static async getAnalyticsData(startDate?: string, endDate?: string): Promise<AnalyticsData> {
    try {
      // Build date filters
      let salesQuery = supabase
        .from('sales')
        .select('*');
      
      let expensesQuery = supabase
        .from('expenses')
        .select('*');

      let installmentsQuery = supabase
        .from('installments')
        .select('*');

      if (startDate) {
        salesQuery = salesQuery.gte('sale_date', startDate);
        expensesQuery = expensesQuery.gte('date', startDate);
      }

      if (endDate) {
        salesQuery = salesQuery.lte('sale_date', endDate);
        expensesQuery = expensesQuery.lte('date', endDate);
      }

      // Execute queries
      const [salesResult, expensesResult, installmentsResult] = await Promise.all([
        salesQuery,
        expensesQuery,
        installmentsQuery
      ]);

      if (salesResult.error) throw salesResult.error;
      if (expensesResult.error) throw expensesResult.error;
      if (installmentsResult.error) throw installmentsResult.error;

      const sales = salesResult.data || [];
      const expenses = expensesResult.data || [];
      const installments = installmentsResult.data || [];

      // Calculate totals
      const totalSales = sales
        .filter(sale => sale.payment_status === 'paid')
        .reduce((sum, sale) => sum + Number(sale.total_amount), 0);

      const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const profit = totalSales - totalExpenses;

      const salesCount = sales.length;
      const pendingInstallments = installments.filter(inst => inst.status === 'pending').length;
      const overdue = installments.filter(inst => {
        return inst.status === 'pending' && new Date(inst.due_date) < new Date();
      }).length;

      // Monthly data
      const monthlyData = this.calculateMonthlyData(sales, expenses);

      // Category expenses
      const categoryExpenses = this.calculateCategoryExpenses(expenses);

      // Payment methods
      const paymentMethods = this.calculatePaymentMethods(sales);

      return {
        totalSales,
        totalExpenses,
        profit,
        salesCount,
        pendingInstallments,
        overdue,
        monthlyData,
        categoryExpenses,
        paymentMethods
      };
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return {
        totalSales: 0,
        totalExpenses: 0,
        profit: 0,
        salesCount: 0,
        pendingInstallments: 0,
        overdue: 0,
        monthlyData: [],
        categoryExpenses: [],
        paymentMethods: []
      };
    }
  }

  private static calculateMonthlyData(sales: any[], expenses: any[]): MonthlyData[] {
    const monthlyMap = new Map<string, { sales: number; expenses: number }>();

    // Process sales
    sales.forEach(sale => {
      if (sale.payment_status === 'paid') {
        const month = new Date(sale.sale_date).toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        const current = monthlyMap.get(month) || { sales: 0, expenses: 0 };
        current.sales += Number(sale.total_amount);
        monthlyMap.set(month, current);
      }
    });

    // Process expenses
    expenses.forEach(expense => {
      const month = new Date(expense.date).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      const current = monthlyMap.get(month) || { sales: 0, expenses: 0 };
      current.expenses += Number(expense.amount);
      monthlyMap.set(month, current);
    });

    // Convert to array and calculate profit
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        sales: data.sales,
        expenses: data.expenses,
        profit: data.sales - data.expenses
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12); // Last 12 months
  }

  private static calculateCategoryExpenses(expenses: any[]): CategoryExpense[] {
    const categoryMap = new Map<string, number>();

    expenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + Number(expense.amount));
    });

    return Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category: this.getCategoryLabel(category),
      amount
    }));
  }

  private static calculatePaymentMethods(sales: any[]): PaymentMethodData[] {
    const methodMap = new Map<string, { count: number; amount: number }>();

    sales.forEach(sale => {
      if (sale.payment_status === 'paid') {
        const current = methodMap.get(sale.payment_method) || { count: 0, amount: 0 };
        current.count += 1;
        current.amount += Number(sale.total_amount);
        methodMap.set(sale.payment_method, current);
      }
    });

    return Array.from(methodMap.entries()).map(([method, data]) => ({
      method: this.getPaymentMethodLabel(method),
      count: data.count,
      amount: data.amount
    }));
  }

  private static getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'materials': 'Materiais',
      'equipment': 'Equipamentos',
      'other': 'Outros'
    };
    return labels[category] || category;
  }

  private static getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      'cash': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'bank_transfer': 'Transferência',
      'installments': 'Parcelado'
    };
    return labels[method] || method;
  }
}