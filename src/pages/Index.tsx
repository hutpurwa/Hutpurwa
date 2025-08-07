import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { showError, showSuccess } from '@/utils/toast';
import { ThumbsUp } from 'lucide-react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

type Participant = {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  vote_count: number;
};

const Index = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchParticipants = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching participants:', error);
        showError('Gagal memuat data peserta.');
      } else {
        setParticipants(data);
      }
      setLoading(false);
    };

    fetchParticipants();
    
    if (sessionStorage.getItem('hasVoted_music_contest')) {
      setVoted(true);
    }
  }, []);

  const handleVote = async (participantId: string) => {
    if (voted) {
      showError('Anda sudah memberikan suara!');
      return;
    }
    
    setVotingId(participantId);

    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const visitorId = result.visitorId;

      const { data, error } = await supabase.functions.invoke('vote', {
        body: { participantId, visitorId },
      });

      if (error) {
        console.error('Vote function error:', error);
        // Coba ekstrak pesan error yang lebih spesifik dari respons fungsi
        let detailedError = 'Gagal mengirimkan suara. Coba lagi nanti.';
        if (error.context?.body?.error) {
          detailedError = error.context.body.error;
        } else if (error.context?.body) {
            try {
                // Beberapa error mungkin ada di dalam body sebagai JSON string
                const body = JSON.parse(error.context.body);
                detailedError = body.error || body.message || detailedError;
            } catch {}
        }
        throw new Error(detailedError);
      }

      showSuccess('Terima kasih! Suara Anda telah dicatat.');
      sessionStorage.setItem('hasVoted_music_contest', 'true');
      setVoted(true);
      
      setParticipants(prev => 
        prev.map(p => 
          p.id === participantId ? { ...p, vote_count: p.vote_count + 1 } : p
        )
      );

    } catch (err) {
      showError(err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.');
      if (err instanceof Error && err.message.includes('sudah pernah memberikan suara')) {
        sessionStorage.setItem('hasVoted_music_contest', 'true');
        setVoted(true);
      }
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-br from-primary to-slate-600 bg-clip-text text-transparent py-2">
          Vote Peserta Favorit Anda
        </h1>
        <p className="mt-2 text-xl text-muted-foreground">Anda hanya memiliki satu kesempatan untuk memberikan suara.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="aspect-square w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {participants.map((p) => (
            <Card key={p.id} className="flex flex-col transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <img 
                  src={p.photo_url || '/placeholder.svg'} 
                  alt={p.name} 
                  className="w-full aspect-square object-cover rounded-md mb-4"
                />
                <p className="text-muted-foreground">{p.description}</p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleVote(p.id)} 
                  disabled={voted || !!votingId}
                >
                  {votingId === p.id ? 'Memproses...' : (
                    <>
                      <ThumbsUp className="mr-2 h-4 w-4" /> Vote
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {participants.length === 0 && !loading && (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold">Belum Ada Peserta</h2>
          <p className="text-muted-foreground mt-2">Admin perlu menambahkan data peserta terlebih dahulu.</p>
        </div>
      )}
    </div>
  );
};

export default Index;