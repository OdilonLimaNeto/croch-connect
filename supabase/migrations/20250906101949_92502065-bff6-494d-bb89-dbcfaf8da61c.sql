-- Fix critical RLS policy vulnerability in profiles table
-- The current policy has a logical error that allows privilege escalation

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON public.profiles;

-- Create corrected policy that properly prevents role escalation
CREATE POLICY "Users can update their own profile (except role)" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND 
  (
    -- Allow role change only if user is admin
    role = (SELECT p.role FROM profiles p WHERE p.user_id = OLD.user_id) OR 
    has_role(auth.uid(), 'admin'::user_role)
  )
);

-- Fix database functions by setting proper search_path to prevent SQL injection
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_sale_installments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Only create installments if payment_method is 'installments' and installments_count > 1
  IF NEW.payment_method = 'installments' AND NEW.installments_count > 1 THEN
    -- Insert installments
    FOR i IN 1..NEW.installments_count LOOP
      INSERT INTO public.installments (
        sale_id,
        installment_number,
        amount,
        due_date,
        status
      ) VALUES (
        NEW.id,
        i,
        ROUND(NEW.total_amount / NEW.installments_count, 2),
        NEW.sale_date + INTERVAL '1 month' * (i - 1),
        'pending'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_last_admin_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check if this is the last admin user
  IF OLD.role = 'admin'::user_role THEN
    IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin'::user_role AND user_id != OLD.user_id) = 0 THEN
      RAISE EXCEPTION 'Cannot delete the last administrator user';
    END IF;
  END IF;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_last_admin_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Check if trying to change role from admin to something else
  IF OLD.role = 'admin'::user_role AND NEW.role != 'admin'::user_role THEN
    -- Check if this is the last admin
    IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin'::user_role AND user_id != OLD.user_id) = 0 THEN
      RAISE EXCEPTION 'Cannot change role of the last administrator user';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END
  );
  RETURN NEW;
END;
$function$;