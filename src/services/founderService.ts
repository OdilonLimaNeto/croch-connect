import { supabase } from '@/integrations/supabase/client';
import { Founder, FounderFormData } from '@/types';

export class FounderService {
  static async getFounders(activeOnly: boolean = false): Promise<Founder[]> {
    try {
      let query = supabase
        .from('founders')
        .select('*')
        .order('display_order', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching founders:', error);
      return [];
    }
  }

  static async getFounder(id: string): Promise<Founder | null> {
    try {
      const { data, error } = await supabase
        .from('founders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching founder:', error);
      return null;
    }
  }

  static async createFounder(founderData: FounderFormData): Promise<{
    success: boolean;
    error?: string;
    data?: Founder;
  }> {
    try {
      let imageUrl = null;

      // Upload image if provided
      if (founderData.image) {
        const uploadResult = await this.uploadImage(founderData.image);
        if (!uploadResult.success) {
          return { success: false, error: uploadResult.error };
        }
        imageUrl = uploadResult.url;
      }

      const { data, error } = await supabase
        .from('founders')
        .insert({
          name: founderData.name,
          role: founderData.role,
          description: founderData.description,
          expertise: founderData.expertise,
          display_order: founderData.display_order,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating founder:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateFounder(
    id: string,
    updates: Partial<FounderFormData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let imageUrl = undefined;

      // Upload new image if provided
      if (updates.image) {
        // Delete old image if exists
        const founder = await this.getFounder(id);
        if (founder?.image_url) {
          await this.deleteImage(founder.image_url);
        }

        const uploadResult = await this.uploadImage(updates.image);
        if (!uploadResult.success) {
          return { success: false, error: uploadResult.error };
        }
        imageUrl = uploadResult.url;
      }

      const updateData: any = { ...updates };
      delete updateData.image; // Remove image file from update data
      
      if (imageUrl !== undefined) {
        updateData.image_url = imageUrl;
      }

      const { error } = await supabase
        .from('founders')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating founder:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteFounders(ids: string[]): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get founders to delete their images
      const { data: founders } = await supabase
        .from('founders')
        .select('image_url')
        .in('id', ids);

      // Delete images first
      if (founders) {
        for (const founder of founders) {
          if (founder.image_url) {
            await this.deleteImage(founder.image_url);
          }
        }
      }

      // Delete founders
      const { error } = await supabase
        .from('founders')
        .delete()
        .in('id', ids);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting founders:', error);
      return { success: false, error: error.message };
    }
  }

  static async toggleFounderStatus(
    id: string,
    isActive: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('founders')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error toggling founder status:', error);
      return { success: false, error: error.message };
    }
  }

  private static async uploadImage(file: File): Promise<{
    success: boolean;
    error?: string;
    url?: string;
  }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `founders/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return { success: true, url: data.publicUrl };
    } catch (error: any) {
      console.error('Error uploading image:', error);
      return { success: false, error: error.message };
    }
  }

  private static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `founders/${fileName}`;

      await supabase.storage
        .from('product-images')
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
}