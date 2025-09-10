-- Add social media fields to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN social_media JSONB DEFAULT '[]'::jsonb;