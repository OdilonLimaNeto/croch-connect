import { supabase } from '@/integrations/supabase/client';
import { Expense, ExpenseFormData } from '@/types';

export class ExpensesService {
  static async getExpenses(): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Expense[];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }

  static async getExpense(id: string): Promise<Expense | null> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Expense;
    } catch (error) {
      console.error('Error fetching expense:', error);
      return null;
    }
  }

  static async createExpense(expenseData: ExpenseFormData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          description: expenseData.description,
          amount: expenseData.amount,
          category: expenseData.category,
          date: expenseData.date.toISOString().split('T')[0],
          supplier: expenseData.supplier,
          notes: expenseData.notes,
        });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async updateExpense(id: string, expenseData: ExpenseFormData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          description: expenseData.description,
          amount: expenseData.amount,
          category: expenseData.category,
          date: expenseData.date.toISOString().split('T')[0],
          supplier: expenseData.supplier,
          notes: expenseData.notes,
        })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async deleteExpense(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}