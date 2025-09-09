-- Create functions for stock management with proper validation and error handling

-- Function to safely decrement product stock
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  product_id UUID,
  quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Validate input parameters
  IF product_id IS NULL THEN
    RAISE EXCEPTION 'Product ID cannot be null';
  END IF;
  
  IF quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
  END IF;

  -- Check if product exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.products 
    WHERE id = product_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Product not found or inactive';
  END IF;

  -- Check if there's enough stock
  IF (
    SELECT stock_quantity FROM public.products WHERE id = product_id
  ) < quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Cannot decrement % units', quantity;
  END IF;

  -- Update stock quantity
  UPDATE public.products 
  SET 
    stock_quantity = stock_quantity - quantity,
    updated_at = now()
  WHERE id = product_id;
  
  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update product stock';
  END IF;
END;
$function$;

-- Function to safely increment product stock (for rollbacks or stock additions)
CREATE OR REPLACE FUNCTION public.increment_product_stock(
  product_id UUID,
  quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Validate input parameters
  IF product_id IS NULL THEN
    RAISE EXCEPTION 'Product ID cannot be null';
  END IF;
  
  IF quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
  END IF;

  -- Check if product exists
  IF NOT EXISTS (
    SELECT 1 FROM public.products WHERE id = product_id
  ) THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Update stock quantity
  UPDATE public.products 
  SET 
    stock_quantity = stock_quantity + quantity,
    updated_at = now()
  WHERE id = product_id;
  
  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update product stock';
  END IF;
END;
$function$;

-- Function to get current stock of a product
CREATE OR REPLACE FUNCTION public.get_product_stock(product_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_stock INTEGER;
BEGIN
  SELECT stock_quantity INTO current_stock
  FROM public.products
  WHERE id = product_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or inactive';
  END IF;
  
  RETURN current_stock;
END;
$function$;

-- Function to validate stock availability for multiple items
CREATE OR REPLACE FUNCTION public.validate_stock_availability(
  items JSONB
)
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  requested_quantity INTEGER,
  available_quantity INTEGER,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (item->>'product_id')::UUID as product_id,
    p.title as product_name,
    (item->>'quantity')::INTEGER as requested_quantity,
    p.stock_quantity as available_quantity,
    (p.stock_quantity >= (item->>'quantity')::INTEGER) as is_available
  FROM jsonb_array_elements(items) as item
  LEFT JOIN public.products p ON p.id = (item->>'product_id')::UUID
  WHERE p.is_active = true;
END;
$function$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_product_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_stock(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_stock_availability(JSONB) TO authenticated;
