import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { User } from '@supabase/supabase-js';

type Profile = {
  name: string;
  role: 'student' | 'trainer' | string;
  avatar_url: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setUser(null);
          setProfile(null);
          return;
        }

        setUser(user);

        // Fetch basic profile info
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, role, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      } catch (err) {
        console.error('Error loading session in useAuth:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSession();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        // We could refetch profile here if needed, but normally user id doesn't change
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading };
}
