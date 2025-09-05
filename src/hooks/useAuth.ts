import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, Profile } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthState = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const updateUserState = async (session: Session | null) => {
    console.log('Auth: Updating user state with session:', !!session?.user);
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id);
      console.log('Auth: Fetched profile:', profile);
      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email!,
        profile: profile || undefined,
      };
      setUser(authUser);
      setIsAdmin(profile?.role === 'admin');
      console.log('Auth: Set isAdmin:', profile?.role === 'admin');
    } else {
      setUser(null);
      setIsAdmin(false);
      console.log('Auth: No session, cleared user state');
    }
    setSession(session);
    setLoading(false);
    console.log('Auth: Auth loading set to false');
  };

  const refreshUser = async () => {
    if (session?.user) {
      await updateUserState(session);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth: onAuthStateChange event:', event, !!session?.user);
        // Use setTimeout to prevent potential deadlock with Supabase
        setTimeout(() => {
          updateUserState(session);
        }, 0);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Auth: Initial session:', !!session?.user);
      updateUserState(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    session,
    loading,
    isAdmin,
    signOut,
    refreshUser
  };
};

export { AuthContext };