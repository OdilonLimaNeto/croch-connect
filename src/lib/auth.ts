import { supabase } from "@/integrations/supabase/client";
import { AuthUser, LoginFormData, SignUpFormData } from "@/types";

export class AuthService {
  static async signIn(data: LoginFormData): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
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
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.full_name,
            role: data.role || 'user',
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
}