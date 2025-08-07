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
  const [eventName, setEventName] = useState<string>('Aplikasi Voting');
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      let newEventName = 'Aplikasi Voting';
      if (error) {
        console.error('Gagal memuat pengaturan:', error);
      } else {
        const settingsMap = new Map(data.map(s => [s.key, s.value]));
        setLogoUrl(settingsMap.get('logo_url') || null);
        newEventName = settingsMap.get('event_name') || 'Aplikasi Voting';
        setEventName(newEventName);
      }
      document.title = newEventName;
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
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {loadingSettings ? (
                <>
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <Skeleton className="h-6 w-32" />
                </>
              ) : (
                <>
                  {logoUrl && <img src={logoUrl} alt="Event Logo" className="h-10 max-w-32 object-contain" />}
                  <h1 className="text-xl font-bold text-primary">{eventName}</h1>
                </>
              )}
              <nav className="hidden md:flex items-baseline space-x-1">
                <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors">Vote</Link>
                {session && (
                  <>
                    <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">Dashboard</Link>
                    <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">Peserta</Link>
                    <Link to="/settings" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">Pengaturan</Link>
                  </>
                )}
              </nav>
            </div>
            <div>
              {session ? (
                <Button onClick={handleLogout} variant="ghost">Logout</Button>
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
      <footer className="py-4 text-center text-sm text-muted-foreground">
        Powered by Dyad
      </footer>
    </div>
  );
};

export default Layout;