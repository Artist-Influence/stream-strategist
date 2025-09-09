import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  userRole: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isSalesperson: boolean;
  isVendor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isSalesperson = userRole === 'salesperson';
  const isVendor = userRole === 'vendor';

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role when auth state changes
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      console.log('Fetching role for user ID:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      console.log('Role query result:', { data, error });
      
      if (error) {
        console.warn('Error fetching role:', error);
        setUserRole(null);
      } else if (data && data.length > 0) {
        // Take the first role if multiple exist (admin takes priority)
        const role = data.find(r => r.role === 'admin')?.role || data[0].role;
        console.log('Setting user role:', role);
        setUserRole(role);
      } else {
        console.log('No roles found for user');
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Allow different domains for different roles - will be validated by RLS policies

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Successfully signed in!');
    }

    return { error };
  };

  const signUp = async (email: string, password: string) => {
    // Allow signup for different roles - role assignment will be handled by admin

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email to confirm your account!');
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    userRole,
    isAdmin,
    isManager,
    isSalesperson,
    isVendor
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}