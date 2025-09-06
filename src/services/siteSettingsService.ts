import { supabase } from '@/integrations/supabase/client';
import { SiteSettings, SiteSettingsFormData } from '@/types';

export class SiteSettingsService {
  static async getSiteSettings(): Promise<SiteSettings | null> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching site settings:', error);
      return null;
    }
  }

  static async updateSiteSettings(
    id: string,
    updates: SiteSettingsFormData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let logoUrl = undefined;
      let faviconUrl = undefined;

      // Upload new logo if provided
      if (updates.logo) {
        const uploadResult = await this.uploadImage(updates.logo, 'logo');
        if (!uploadResult.success) {
          return { success: false, error: uploadResult.error };
        }
        logoUrl = uploadResult.url;
      }

      // Upload new favicon if provided
      if (updates.favicon) {
        const uploadResult = await this.uploadImage(updates.favicon, 'favicon');
        if (!uploadResult.success) {
          return { success: false, error: uploadResult.error };
        }
        faviconUrl = uploadResult.url;
      }

      const updateData: any = {
        site_name: updates.site_name,
        primary_color: updates.primary_color,
      };

      if (logoUrl !== undefined) {
        updateData.logo_url = logoUrl;
      }
      
      if (faviconUrl !== undefined) {
        updateData.favicon_url = faviconUrl;
      }

      const { error } = await supabase
        .from('site_settings')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error updating site settings:', error);
      return { success: false, error: error.message };
    }
  }

  private static async uploadImage(
    file: File,
    type: 'logo' | 'favicon'
  ): Promise<{
    success: boolean;
    error?: string;
    url?: string;
  }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `site-assets/${fileName}`;

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
      const filePath = `site-assets/${fileName}`;

      await supabase.storage
        .from('product-images')
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
}