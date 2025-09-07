import { supabase } from "@/integrations/supabase/client";
import { Product, Promotion, Material, ProductFormData, PromotionFormData } from "@/types";

export class ProductService {
  static async getProducts(activeOnly = true): Promise<Product[]> {
    try {
      console.log('ProductService: Fetching products with activeOnly =', activeOnly);
      
      let query = supabase.from('products').select('*');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data: products, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('ProductService: Found products:', products?.length || 0);
      
      // Return empty array if no products found
      if (!products || products.length === 0) {
        return [];
      }
      
      // Get active promotions to check which products are in promotion
      const activePromotions = await this.getActivePromotions();
      console.log('ProductService: Found active promotions:', activePromotions.length);
      
      const promotionsMap = new Map(activePromotions.map(p => [p.product_id, p]));
      
      // Add promotion status and calculate promotional price for ALL products
      const processedProducts = products.map(product => {
        const promotion = promotionsMap.get(product.id);
        
        // Initialize promotion properties for all products
        let hasActivePromotion = false;
        let effectivePromotionalPrice = product.promotional_price;
        let promotionDiscount = null;
        
        // First check if there's an active promotion from promotions table
        if (promotion) {
          const calculatedPrice = product.price * (1 - promotion.discount_percentage / 100);
          // Only consider it a valid promotion if it results in a lower price
          if (calculatedPrice < product.price) {
            hasActivePromotion = true;
            effectivePromotionalPrice = calculatedPrice;
            promotionDiscount = promotion.discount_percentage;
            console.log(`Product ${product.title} has active promotion: ${promotionDiscount}% off`);
          }
        }
        // Otherwise check promotional_price field
        else if (product.promotional_price && product.promotional_price < product.price) {
          hasActivePromotion = true;
          promotionDiscount = Math.round(((product.price - product.promotional_price) / product.price) * 100);
          console.log(`Product ${product.title} has promotional price: R$${product.promotional_price}`);
        }
        
        // Return product with promotion data (will be false/null for non-promotional products)
        return {
          ...product,
          promotional_price: effectivePromotionalPrice,
          hasActivePromotion,
          promotionDiscount
        };
      });
      
      console.log('ProductService: Processed products with promotions:', 
        processedProducts.filter(p => p.hasActivePromotion).length, 
        'out of', processedProducts.length);
      
      return processedProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  static async getActivePromotions(): Promise<any[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
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

  static async getProduct(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Apply the same promotion logic as getProducts()
      const activePromotions = await this.getActivePromotions();
      const promotionsMap = new Map(activePromotions.map(p => [p.product_id, p]));
      
      const promotion = promotionsMap.get(data.id);
      
      // Initialize promotion properties
      let hasActivePromotion = false;
      let effectivePromotionalPrice = data.promotional_price;
      let promotionDiscount = null;
      
      // First check if there's an active promotion from promotions table
      if (promotion) {
        const calculatedPrice = data.price * (1 - promotion.discount_percentage / 100);
        // Only consider it a valid promotion if it results in a lower price
        if (calculatedPrice < data.price) {
          hasActivePromotion = true;
          effectivePromotionalPrice = calculatedPrice;
          promotionDiscount = promotion.discount_percentage;
          console.log(`Product ${data.title} has active promotion: ${promotionDiscount}% off`);
        }
      }
      // Otherwise check promotional_price field
      else if (data.promotional_price && data.promotional_price < data.price) {
        hasActivePromotion = true;
        promotionDiscount = Math.round(((data.price - data.promotional_price) / data.price) * 100);
        console.log(`Product ${data.title} has promotional price: R$${data.promotional_price}`);
      }
      
      // Return product with promotion data
      return {
        ...data,
        promotional_price: effectivePromotionalPrice,
        hasActivePromotion,
        promotionDiscount
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  static async createProduct(productData: {
    title: string;
    description: string | null;
    price: number;
    promotional_price?: number | null;
    stock_quantity: number;
    materials: string[];
    is_active: boolean;
    images: string[];
  }): Promise<{ success: boolean; error?: string; data?: Product }> {
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
          images: productData.images,
          is_active: productData.is_active,
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

  static async updatePromotion(id: string, promotionData: PromotionFormData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({
          product_id: promotionData.product_id,
          discount_percentage: promotionData.discount_percentage,
          start_date: promotionData.start_date.toISOString(),
          end_date: promotionData.end_date.toISOString(),
          is_active: promotionData.is_active,
        })
        .eq('id', id);

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
      console.log('MaterialService: Starting materials query...');
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');

      console.log('MaterialService: Query result:', { data, error });
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

  static async updateMaterial(id: string, name: string, description?: string, color?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('materials')
        .update({
          name,
          description,
          color,
        })
        .eq('id', id);

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
    const baseMessage = `Ola! Tenho interesse no produto: ${product.title}`;   
    
    let priceInfo = '';
    if (product.promotional_price && product.promotional_price < product.price) {
      priceInfo = `\nPreço promocional: R$ ${product.promotional_price.toFixed(2)}`;
      priceInfo += `\nPreço original: R$ ${product.price.toFixed(2)}`;
    } else {
      priceInfo = `\nPreço: R$ ${product.price.toFixed(2)}`;
    }
    
    const stockInfo = product.stock_quantity > 0 
      ? '\nProduto disponivel' 
      : '\nProduto esgotado';
    
    const message = `${baseMessage}${priceInfo}${stockInfo}\n\nPoderia me enviar mais informacoes sobre este produto?`;
    
    return message;
  }


  static openWhatsApp(phoneNumber: string, message: string): void {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  static contactProduct(product: Product, phoneNumber: string = '5568992831533'): void {
    const message = this.generateMessage(product);
    this.openWhatsApp(phoneNumber, message);
  }
}