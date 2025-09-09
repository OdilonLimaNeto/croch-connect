import { supabase } from '@/integrations/supabase/client';
import { SaleItemFormData } from '@/types';

export interface StockValidationResult {
  isValid: boolean;
  invalidItems?: string[];
  errors: any[];
}

export interface StockUpdateResult {
  success: boolean;
  updatedProducts: string[];
  error?: string;
}

export class StockService {
  /**
   * Valida se há estoque suficiente para todos os itens da venda
   */
  static async validateStockAvailability(items: SaleItemFormData[]): Promise<StockValidationResult> {
    const result: StockValidationResult = {
      isValid: true,
      invalidItems: [],
      errors: []
    };

    try {
      for (const item of items) {
        if (!item.product_id) {
          result.isValid = false;
          result.errors.push(`ID do produto não encontrado para: ${item.product_name}`);
          result.invalidItems!.push(item.product_name);
          continue;
        }

        const { data: product, error } = await supabase
          .from('products')
          .select('id, title, stock_quantity, is_active')
          .eq('id', item.product_id)
          .single();

        if (error || !product) {
          result.isValid = false;
          result.errors.push(`Produto não encontrado: ${item.product_name}`);
          result.invalidItems!.push(item.product_name);
          continue;
        }

        // Verificar se o produto está ativo
        if (!product.is_active) {
          result.isValid = false;
          result.errors.push(`Produto inativo: ${product.title}`);
          result.invalidItems!.push(product.title);
          continue;
        }

        // Verificar se há estoque suficiente
        if (product.stock_quantity < item.quantity) {
          result.isValid = false;
          result.invalidItems!.push(
            `Estoque insuficiente para ${product.title}. ` +
            `Solicitado: ${item.quantity}, Disponível: ${product.stock_quantity}`
          );
          result.errors.push({
            productId: product.id,
            productName: product.title,
            requested: item.quantity,
            available: product.stock_quantity
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Erro ao validar estoque:', error);
      return {
        isValid: false,
        invalidItems: ['Erro interno ao validar estoque'],
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }

  /**
   * Atualiza o estoque dos produtos após uma venda
   */
  static async updateProductsStock(items: SaleItemFormData[]): Promise<StockUpdateResult> {
    try {
      const updatedProducts: string[] = [];
      const errors: string[] = [];

      for (const item of items) {
        if (!item.product_id) {
          errors.push(`ID do produto não encontrado para: ${item.product_name}`);
          continue;
        }

        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (fetchError || !product) {
          errors.push(`Erro ao buscar produto ${item.product_name}: ${fetchError?.message}`);
          continue;
        }

        const newStock = product.stock_quantity - item.quantity;
        
        if (newStock < 0) {
          errors.push(`Estoque insuficiente para ${item.product_name}`);
          continue;
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product_id);

        if (updateError) {
          errors.push(`Erro ao atualizar estoque de ${item.product_name}: ${updateError.message}`);
        } else {
          updatedProducts.push(item.product_name);
        }
      }

      return {
        success: errors.length === 0,
        updatedProducts,
        error: errors.length > 0 ? errors.join('; ') : undefined
      };
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      return {
        success: false,
        updatedProducts: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Restaura o estoque dos produtos (rollback)
   */
  static async restoreProductsStock(items: SaleItemFormData[]): Promise<StockUpdateResult> {
    try {
      const updatedProducts: string[] = [];
      const errors: string[] = [];

      for (const item of items) {
        if (!item.product_id) {
          errors.push(`ID do produto não encontrado para: ${item.product_name}`);
          continue;
        }

        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (fetchError || !product) {
          errors.push(`Erro ao buscar produto ${item.product_name}: ${fetchError?.message}`);
          continue;
        }

        const newStock = product.stock_quantity + item.quantity;

        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product_id);

        if (updateError) {
          errors.push(`Erro ao restaurar estoque de ${item.product_name}: ${updateError.message}`);
        } else {
          updatedProducts.push(item.product_name);
        }
      }

      return {
        success: errors.length === 0,
        updatedProducts,
        error: errors.length > 0 ? errors.join('; ') : undefined
      };
    } catch (error) {
      console.error('Erro ao restaurar estoque:', error);
      return {
        success: false,
        updatedProducts: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}
