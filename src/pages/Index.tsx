import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { showError, showSuccess } from '@/utils/toast';
import { ThumbsUp } from 'lucide-react';

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

    const hasVoted = localStorage.getItem('hasVoted_music_contest');
    if (hasVoted) {
      setVoted(true);
    }
  }, []);

  const handleVote = async (participantId: string) => {
    if (voted) {
      showError('Anda sudah memberikan suara!');
      return;
    }
    
    setVotingId(participantId);

    // In a real app, this should call a secure Edge Function
    // For simplicity, we'll do a direct RPC call to a database function
    // Let's create that function first.
    // For now, this will be a placeholder.
    
    // Placeholder logic
    console.log(`Voting for ${participantId}`);
    
    // This part will be implemented in the next step with an Edge Function
    // For now, we just simulate the vote.
    setTimeout(() => {
      localStorage.setItem('hasVoted_music_contest', 'true');
      setVoted(true);
      showSuccess('Terima kasih! Suara Anda telah dicatat.');
      setVotingId(null);
      // We would also update the local state for vote_count here
    }, 1000);
  };

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Vote Peserta Favorit Anda</h1>
        <p className="mt-4 text-xl text-muted-foreground">Anda hanya memiliki satu kesempatan untuk memberikan suara.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
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
            <Card key={p.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <img 
                  src={p.photo_url || '/placeholder.svg'} 
                  alt={p.name} 
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <p className="text-muted-foreground">{p.description}</p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleVote(p.id)} 
                  disabled={voted || !!votingId}
                >
                  {votingId === p.id ? 'Voting...' : (
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