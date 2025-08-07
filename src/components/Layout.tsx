import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>('Lomba Musik');
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) {
        console.error('Gagal memuat pengaturan:', error);
      } else {
        const settingsMap = new Map(data.map(s => [s.key, s.value]));
        setLogoUrl(settingsMap.get('logo_url') || null);
        setEventName(settingsMap.get('event_name') || 'Lomba Musik');
      }
      setLoadingSettings(false);
    };

    fetchSettings();
    
    const channel = supabase.channel('settings-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, 
      (payload) => {
        fetchSettings();
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
              {loadingSettings ? (
                <>
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <Skeleton className="h-6 w-32" />
                </>
              ) : (
                <>
                  {logoUrl && <img src={logoUrl} alt="Event Logo" className="h-12 max-w-32 object-contain" />}
                  <h1 className="text-xl font-bold">{eventName}</h1>
                </>
              )}
              <nav className="hidden md:flex items-baseline space-x-4">
                <Link to="/" className="text-lg font-semibold text-primary hover:text-primary/90">Vote</Link>
                {session && (
                  <>
                    <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
                    <Link to="/admin" className="text-gray-600 hover:text-gray-900">Peserta</Link>
                    <Link to="/settings" className="text-gray-600 hover:text-gray-900">Pengaturan</Link>
                  </>
                )}
              </nav>
            </div>
            <div>
              {session ? (
                <Button onClick={handleLogout}>Logout</Button>
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
        {/* Footer content removed */}
      </footer>
    </div>
  );
};

export default Layout;