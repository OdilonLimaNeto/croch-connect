import { useState, useEffect, createContext, useContext, useRef } from 'react';
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

  // Cache para evitar múltiplas consultas simultâneas
  const profileCacheRef = useRef<{ [userId: string]: Profile | null }>({});
  const fetchingProfileRef = useRef<{ [userId: string]: Promise<Profile | null> }>({});

  const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
    // Verifica se já tem no cache
    if (profileCacheRef.current[userId] !== undefined) {
      return profileCacheRef.current[userId];
    }

    // Verifica se já está buscando
    if (fetchingProfileRef.current[userId]) {
      return fetchingProfileRef.current[userId];
    }

    // Inicia a busca
    const fetchPromise = (async () => {
      try {
        console.log('Auth: Fetching profile for user:', userId);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(); // Use maybeSingle() em vez de single() para evitar erro quando não encontrar

        if (error) {
          console.error('Error fetching profile:', error);
          profileCacheRef.current[userId] = null;
          return null;
        }

        profileCacheRef.current[userId] = data;
        return data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        profileCacheRef.current[userId] = null;
        return null;
      } finally {
        // Remove da lista de "fetching"
        delete fetchingProfileRef.current[userId];
      }
    })();

    fetchingProfileRef.current[userId] = fetchPromise;
    return fetchPromise;
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
      // Limpa o cache quando não há sessão
      profileCacheRef.current = {};
    }
    
    setSession(session);
    setLoading(false);
    console.log('Auth: Auth loading set to false');
  };

  const refreshUser = async () => {
    if (session?.user) {
      // Limpa o cache para forçar uma nova busca
      delete profileCacheRef.current[session.user.id];
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