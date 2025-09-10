export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  images: string[];
  stock_quantity: number;
  materials: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hasActivePromotion?: boolean;
  promotionDiscount?: number | null;
}

export interface Promotion {
  id: string;
  product_id: string;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Material {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  title: string;
  description: string;
  price: number;
  promotional_price?: number;
  stock_quantity: number;
  materials: string[];
  images: File[];
}

export interface PromotionFormData {
  product_id: string;
  discount_percentage: number;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
}

export interface WhatsAppMessage {
  product: Product;
  message: string;
}

export interface Founder {
  id: string;
  name: string;
  role: string;
  description: string | null;
  expertise: string[];
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FounderFormData {
  name: string;
  role: string;
  description: string;
  expertise: string[];
  display_order: number;
  image?: File;
}

export type UserRole = 'admin' | 'user';

// Form schemas for validation
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
  full_name: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Filter and sort types
export interface ProductFilters {
  search?: string;
  min_price?: number;
  max_price?: number;
  materials?: string[];
  sort_by?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'created_desc';
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface BulkAction<T> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: (items: T[]) => void;
  variant?: 'default' | 'destructive';
}

// Site Settings types
export interface SocialMedia {
  platform: string;
  url: string;
  icon: string;
}

export interface SiteSettings {
  id: string;
  site_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  social_media: SocialMedia[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSettingsFormData {
  site_name: string;
  logo?: File;
  social_media?: SocialMedia[];
}

// Sales and Analytics types
export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'materials' | 'equipment' | 'other';
  date: string;
  supplier?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'installments';
  payment_status: 'pending' | 'paid' | 'partial' | 'cancelled';
  installments_count: number;
  sale_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  installments?: Installment[];
  sale_items?: SaleItem[];
}

export interface Installment {
  id: string;
  sale_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

// Form data types  
export interface ExpenseFormData {
  description: string;
  amount: number;
  category: 'materials' | 'equipment' | 'other';
  date: Date;
  supplier?: string;
  notes?: string;
}

export interface SaleFormData {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  total_amount: number;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'installments';
  payment_status: 'pending' | 'paid' | 'partial' | 'cancelled';
  installments_count: number;
  sale_date: Date;
  notes?: string;
  items: SaleItemFormData[];
  installments?: InstallmentFormData[];
}

export interface InstallmentFormData {
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_method?: string;
}

export interface SaleItemFormData {
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// Analytics types
export interface AnalyticsData {
  totalSales: number;
  totalExpenses: number;
  profit: number;
  salesCount: number;
  pendingInstallments: number;
  overdue: number;
  monthlyData: MonthlyData[];
  categoryExpenses: CategoryExpense[];
  paymentMethods: PaymentMethodData[];
}

export interface MonthlyData {
  month: string;
  sales: number;
  expenses: number;
  profit: number;
}

export interface CategoryExpense {
  category: string;
  amount: number;
}

export interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
}