import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>('Aplikasi Voting');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
      () => {
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

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className={isMobile ? "flex flex-col space-y-2 mt-4" : "hidden md:flex items-baseline space-x-1"}>
      <Link to="/" onClick={() => isMobile && setIsSheetOpen(false)} className={isMobile ? "text-lg" : "px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-secondary transition-colors"}>Vote</Link>
      {session && (
        <>
          <Link to="/dashboard" onClick={() => isMobile && setIsSheetOpen(false)} className={isMobile ? "text-lg text-muted-foreground" : "px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"}>Dashboard</Link>
          <Link to="/admin" onClick={() => isMobile && setIsSheetOpen(false)} className={isMobile ? "text-lg text-muted-foreground" : "px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"}>Peserta</Link>
          <Link to="/settings" onClick={() => isMobile && setIsSheetOpen(false)} className={isMobile ? "text-lg text-muted-foreground" : "px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"}>Pengaturan</Link>
        </>
      )}
    </nav>
  );

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
                <Link to="/" className="flex items-center space-x-3">
                  {logoUrl && <img src={logoUrl} alt="Event Logo" className="h-10 max-w-32 object-contain" />}
                  <h1 className="text-xl font-bold text-primary hidden sm:block">{eventName}</h1>
                </Link>
              )}
              <NavLinks />
            </div>
            <div className="flex items-center gap-2">
              {session ? (
                <Button onClick={handleLogout} variant="ghost">Logout</Button>
              ) : (
                <Link to="/login">
                  <Button>Admin Login</Button>
                </Link>
              )}
              <div className="md:hidden">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Buka menu navigasi</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <NavLinks isMobile={true} />
                  </SheetContent>
                </Sheet>
              </div>
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