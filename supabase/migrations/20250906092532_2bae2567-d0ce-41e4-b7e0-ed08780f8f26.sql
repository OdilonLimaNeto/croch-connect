-- Create site_settings table for managing site configuration
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name TEXT NOT NULL DEFAULT 'Nó de Duas',
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for site_settings
CREATE POLICY "Anyone can view active site settings" 
ON public.site_settings 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage site settings" 
ON public.site_settings 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

-- Add trigger for timestamps
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default site settings
INSERT INTO public.site_settings (site_name, is_active)
VALUES ('Nó de Duas', true);