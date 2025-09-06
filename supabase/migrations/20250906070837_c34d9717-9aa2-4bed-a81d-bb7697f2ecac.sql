-- Create founders table
CREATE TABLE public.founders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  expertise TEXT[] DEFAULT ARRAY[]::TEXT[],
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.founders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active founders" 
ON public.founders 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admin can manage founders" 
ON public.founders 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

-- Add trigger for updated_at
CREATE TRIGGER update_founders_updated_at
BEFORE UPDATE ON public.founders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage policies for founder images
CREATE POLICY "Anyone can view founder images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'founders');

CREATE POLICY "Admin can upload founder images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = 'founders'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);

CREATE POLICY "Admin can update founder images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = 'founders'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);

CREATE POLICY "Admin can delete founder images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = 'founders'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);