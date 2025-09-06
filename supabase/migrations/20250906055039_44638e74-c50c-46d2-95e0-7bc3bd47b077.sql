-- RBAC Implementation: Only admins can create users and manage roles

-- First, let's add a policy to prevent non-admin users from creating profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create new policy: Only admins can create profiles for other users
CREATE POLICY "Only admins can create profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if the user is an admin OR if they're creating their own profile during signup
  has_role(auth.uid(), 'admin'::user_role) OR 
  (user_id = auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid()
  ))
);

-- Add policy to prevent users from changing their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- New policy: Users can update their own profile but not their role
CREATE POLICY "Users can update their own profile (except role)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND 
  (role = OLD.role OR has_role(auth.uid(), 'admin'::user_role))
);

-- Add policy to prevent role escalation during updates by admins
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- New policy: Admins can update profiles but with role restrictions
CREATE POLICY "Admins can update all profiles with role restrictions"
ON public.profiles
FOR UPDATE  
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) AND
  -- Admins can only create admin or user roles (no role escalation beyond admin)
  (role IN ('admin'::user_role, 'user'::user_role))
);

-- Add policy for admin deletion with restrictions
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Only admins can delete profiles, but they cannot delete their own profile
CREATE POLICY "Admins can delete other profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::user_role) AND 
  user_id != auth.uid()  -- Prevent self-deletion
);

-- Create function to ensure at least one admin always exists
CREATE OR REPLACE FUNCTION public.prevent_last_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the last admin user
  IF OLD.role = 'admin'::user_role THEN
    IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin'::user_role AND user_id != OLD.user_id) = 0 THEN
      RAISE EXCEPTION 'Cannot delete the last administrator user';
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent deletion of last admin
DROP TRIGGER IF EXISTS prevent_last_admin_deletion_trigger ON public.profiles;
CREATE TRIGGER prevent_last_admin_deletion_trigger
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_admin_deletion();

-- Create function to prevent last admin from changing their role
CREATE OR REPLACE FUNCTION public.prevent_last_admin_role_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent last admin role change
DROP TRIGGER IF EXISTS prevent_last_admin_role_change_trigger ON public.profiles;
CREATE TRIGGER prevent_last_admin_role_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_admin_role_change();