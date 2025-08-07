import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { MadeWithDyad } from './made-with-dyad';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(true);

  useEffect(() => {
    const fetchLogo = async () => {
      setLoadingLogo(true);
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'logo_url')
        .single();

      if (data?.value) {
        setLogoUrl(data.value);
      }
      setLoadingLogo(false);
    };

    fetchLogo();
    
    const channel = supabase.channel('settings-logo-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'key=eq.logo_url' }, (payload) => {
        const newRecord = payload.new as { value: string };
        setLogoUrl(newRecord.value);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {loadingLogo ? (
                <Skeleton className="h-12 w-12 rounded-full" />
              ) : (
                logoUrl ? <img src={logoUrl} alt="Event Logo" className="h-12" /> : <h1 className="text-xl font-bold">Lomba Musik</h1>
              )}
              <nav className="hidden md:flex space-x-4">
                <Link to="/" className="text-gray-600 hover:text-gray-900">Vote</Link>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              </nav>
            </div>
            <div>
              {session ? (
                <div className="flex items-center space-x-4">
                   <Link to="/admin">
                    <Button variant="ghost">Admin</Button>
                  </Link>
                  <Button onClick={handleLogout}>Logout</Button>
                </div>
              ) : (
                <Link to="/login">
                  <Button>Admin Login</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {children}
      </main>
      <footer className="py-4">
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default Layout;