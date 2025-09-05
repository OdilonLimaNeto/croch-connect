import { supabase } from "@/integrations/supabase/client";
import { Product, Promotion, Material, ProductFormData, PromotionFormData } from "@/types";

export class ProductService {
  static async getProducts(activeOnly = true): Promise<Product[]> {
    try {
      let query = supabase.from('products').select('*');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  static async getProduct(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  static async createProduct(productData: ProductFormData): Promise<{ success: boolean; error?: string; data?: Product }> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          title: productData.title,
          description: productData.description,
          price: productData.price,
          promotional_price: productData.promotional_price || null,
          stock_quantity: productData.stock_quantity,
          materials: productData.materials,
          images: [], // Images would be uploaded separately
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async deleteProducts(ids: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async toggleProductStatus(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export class PromotionService {
  static async getPromotions(): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          product:products(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching promotions:', error);
      return [];
    }
  }

  static async getActivePromotions(): Promise<Promotion[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          product:products(*)
        `)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active promotions:', error);
      return [];
    }
  }

  static async createPromotion(promotionData: PromotionFormData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('promotions')
        .insert({
          product_id: promotionData.product_id,
          discount_percentage: promotionData.discount_percentage,
          start_date: promotionData.start_date.toISOString(),
          end_date: promotionData.end_date.toISOString(),
          is_active: promotionData.is_active,
        });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async deletePromotions(ids: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export class MaterialService {
  static async getMaterials(): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  }

  static async createMaterial(name: string, description?: string, color?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('materials')
        .insert({
          name,
          description,
          color,
        });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async deleteMaterials(ids: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export class WhatsAppService {
  static generateMessage(product: Product): string {
    const baseMessage = `Olá! Tenho interesse no produto: *${product.title}*`;
    const priceInfo = product.promotional_price 
      ? `\nPreço promocional: R$ ${product.promotional_price.toFixed(2)}`
      : `\nPreço: R$ ${product.price.toFixed(2)}`;
    
    return `${baseMessage}${priceInfo}\n\nPoderia me enviar mais informações?`;
  }

  static openWhatsApp(phoneNumber: string, message: string): void {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  static contactProduct(product: Product, phoneNumber: string = '5511999999999'): void {
    const message = this.generateMessage(product);
    this.openWhatsApp(phoneNumber, message);
  }
}