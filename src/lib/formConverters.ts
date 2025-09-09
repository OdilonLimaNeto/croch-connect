import { Sale, Expense, SaleFormData, ExpenseFormData, SaleItemFormData } from '@/types';

/**
 * Converte dados de Sale para SaleFormData para edição
 */
export function saleToFormData(sale: Sale): SaleFormData {
  return {
    customer_name: sale.customer_name,
    customer_email: sale.customer_email,
    customer_phone: sale.customer_phone,
    total_amount: sale.total_amount,
    payment_method: sale.payment_method,
    payment_status: sale.payment_status,
    installments_count: sale.installments_count,
    sale_date: new Date(sale.sale_date),
    notes: sale.notes,
    items: sale.sale_items?.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price
    })) || []
  };
}

/**
 * Converte dados de Expense para ExpenseFormData para edição
 */
export function expenseToFormData(expense: Expense): ExpenseFormData {
  return {
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    date: new Date(expense.date),
    supplier: expense.supplier,
    notes: expense.notes
  };
}
