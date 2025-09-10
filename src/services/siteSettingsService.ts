import { supabase } from '@/integrations/supabase/client';
import { SiteSettings, SiteSettingsFormData, SocialMedia } from '@/types';

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

      if (error) throw error;
      
      if (data) {
        // Parse social_media JSON field safely
        let socialMedia: SocialMedia[] = [];
        try {
          if (data.social_media && Array.isArray(data.social_media)) {
            socialMedia = (data.social_media as unknown) as SocialMedia[];
          }
        } catch (e) {
          console.warn('Error parsing social_media field:', e);
          socialMedia = [];
        }

        return {
          id: data.id,
          site_name: data.site_name,
          logo_url: data.logo_url,
          favicon_url: data.favicon_url,
          primary_color: data.primary_color,
          social_media: socialMedia,
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching site settings:', error);
      return null;
    }
  }

  static async updateSiteSettings(id: string, updates: SiteSettingsFormData): Promise<{ success: boolean; error?: string }> {
    try {
      let logoUrl = undefined;
      
      if (updates.logo) {
        const uploadResult = await this.uploadImage(updates.logo, 'logo');
        if (!uploadResult.success) return { success: false, error: uploadResult.error };
        logoUrl = uploadResult.url;
      }

      const updateData: any = { 
        site_name: updates.site_name
      };
      
      if (logoUrl !== undefined) {
        updateData.logo_url = logoUrl;
      }

      // Add social_media field if provided
      if (updates.social_media !== undefined) {
        updateData.social_media = updates.social_media;
      }

      const { error } = await supabase
        .from('site_settings')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private static async uploadImage(file: File, type: string): Promise<{ success: boolean; error?: string; url?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `site-assets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return { success: true, url: data.publicUrl };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}