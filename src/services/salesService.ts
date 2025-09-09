import { supabase } from '@/integrations/supabase/client';
import { Sale, SaleFormData, Installment } from '@/types';
import { StockService } from './stockService';

export class SalesService {
  static async getSales(): Promise<Sale[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          installments(*),
          sale_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Sale[];
    } catch (error) {
      console.error('Error fetching sales:', error);
      return [];
    }
  }

  static async getSale(id: string): Promise<Sale | null> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          installments(*),
          sale_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Sale;
    } catch (error) {
      console.error('Error fetching sale:', error);
      return null;
    }
  }

  async createSale(saleData: SaleFormData): Promise<{ data: Sale | null; error: string | null }> {
    try {
      // Validar estoque antes de criar a venda
      const stockValidation = await StockService.validateStockAvailability(saleData.items);
      
      if (!stockValidation.isValid) {
        return { 
          data: null, 
          error: `Estoque insuficiente: ${stockValidation.invalidItems?.join(', ')}` 
        };
      }

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_name: saleData.customer_name,
          customer_email: saleData.customer_email,
          customer_phone: saleData.customer_phone,
          total_amount: saleData.total_amount,
          payment_method: saleData.payment_method,
          payment_status: saleData.payment_status,
          installments_count: saleData.installments_count,
          sale_date: saleData.sale_date.toISOString(),
          notes: saleData.notes
        })
        .select()
        .single();

      if (saleError || !sale) {
        throw new Error(saleError?.message || 'Erro ao criar venda');
      }

      // Inserir os itens da venda
      if (saleData.items && saleData.items.length > 0) {
        const saleItems = saleData.items.map(item => ({
          sale_id: sale.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) {
          // Rollback da venda se não conseguir inserir os itens
          await supabase.from('sales').delete().eq('id', sale.id);
          throw new Error(itemsError.message);
        }

        // Atualizar o estoque após criação bem-sucedida da venda
        const stockUpdateResult = await StockService.updateProductsStock(saleData.items);
        
        if (!stockUpdateResult.success) {
          // Rollback completo se não conseguir atualizar o estoque
          await supabase.from('sales').delete().eq('id', sale.id);
          throw new Error(`Erro ao atualizar estoque: ${stockUpdateResult.error}`);
        }
      }

      // Processar installments se existirem
      if (saleData.installments && saleData.installments.length > 0) {
        const installments = saleData.installments.map((installment, index) => ({
          sale_id: sale.id,
          installment_number: index + 1,
          amount: installment.amount,
          due_date: installment.due_date,
          status: installment.status || 'pending',
          payment_method: installment.payment_method
        }));

        const { error: installmentsError } = await supabase
          .from('installments')
          .insert(installments);

        if (installmentsError) {
          // Rollback da venda e restaurar estoque se não conseguir inserir installments
          await StockService.restoreProductsStock(saleData.items);
          await supabase.from('sales').delete().eq('id', sale.id);
          throw new Error(installmentsError.message);
        }
      }

      return { data: sale as Sale, error: null };
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Erro inesperado ao criar venda' 
      };
    }
  }

  static async updateSale(id: string, saleData: Partial<SaleFormData>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};
      
      if (saleData.customer_name) updateData.customer_name = saleData.customer_name;
      if (saleData.customer_email !== undefined) updateData.customer_email = saleData.customer_email;
      if (saleData.customer_phone !== undefined) updateData.customer_phone = saleData.customer_phone;
      if (saleData.total_amount) updateData.total_amount = saleData.total_amount;
      if (saleData.payment_method) updateData.payment_method = saleData.payment_method;
      if (saleData.payment_status) updateData.payment_status = saleData.payment_status;
      if (saleData.installments_count) updateData.installments_count = saleData.installments_count;
      if (saleData.sale_date) updateData.sale_date = saleData.sale_date.toISOString().split('T')[0];
      if (saleData.notes !== undefined) updateData.notes = saleData.notes;

      const { error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async deleteSale(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getInstallments(): Promise<Installment[]> {
    try {
      const { data, error } = await supabase
        .from('installments')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data || []) as Installment[];
    } catch (error) {
      console.error('Error fetching installments:', error);
      return [];
    }
  }

  static async updateInstallmentStatus(id: string, status: 'pending' | 'paid' | 'overdue', paymentMethod?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { status };
      
      if (status === 'paid') {
        updateData.paid_date = new Date().toISOString().split('T')[0];
        if (paymentMethod) updateData.payment_method = paymentMethod;
      } else {
        updateData.paid_date = null;
        updateData.payment_method = null;
      }

      const { error } = await supabase
        .from('installments')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}