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