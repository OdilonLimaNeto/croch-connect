import { supabase } from "@/integrations/supabase/client";
import { AuthUser, LoginFormData, SignUpFormData } from "@/types";
import { DataSanitizer } from "./sanitization";

export class AuthService {
  static async signIn(data: LoginFormData): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Sanitize input data
      const sanitizedData = DataSanitizer.sanitizeFormData(data);
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: sanitizedData.email,
        password: sanitizedData.password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!authData.user) {
        return { user: null, error: "Login failed" };
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
        profile: profile || undefined,
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: "An unexpected error occurred" };
    }
  }

  static async signUp(data: SignUpFormData & { role?: 'admin' | 'user' }): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      // Sanitize input data
      const sanitizedData = DataSanitizer.sanitizeFormData(data);
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: sanitizedData.email,
        password: sanitizedData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: sanitizedData.full_name,
            role: sanitizedData.role || 'user',
          }
        }
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!authData.user) {
        return { user: null, error: "Sign up failed" };
      }

      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: "An unexpected error occurred" };
    }
  }

  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      return { error: "An unexpected error occurred" };
    }
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email!,
        profile: profile || undefined,
      };
    } catch (error) {
      return null;
    }
  }

  static async isAdmin(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user?.profile?.role === 'admin';
    } catch (error) {
      return false;
    }
  }

  static async updateUser(userId: string, updates: { full_name?: string; email?: string; role?: 'admin' | 'user' }): Promise<{ success: boolean; error?: string }> {
    try {
      // Sanitize input data
      const sanitizedUpdates = DataSanitizer.sanitizeFormData(updates);
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: sanitizedUpdates.full_name,
          role: sanitizedUpdates.role,
          email: sanitizedUpdates.email,
        })
        .eq('user_id', userId);

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Erro inesperado ao atualizar usuário" };
    }
  }

  static async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete the profile - this is what we can do from client side
      // The actual auth.users deletion should be handled by admin or edge functions
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Erro inesperado ao excluir usuário" };
    }
  }
}