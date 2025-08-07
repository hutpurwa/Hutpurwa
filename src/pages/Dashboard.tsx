import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

type Participant = {
  id: string;
  name: string;
  participant_number: string | null;
  photo_url: string | null;
  vote_count: number;
};

const Dashboard = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('vote_count', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        showError('Gagal memuat data hasil vote.');
      } else {
        setParticipants(data);
      }
      setLoading(false);
    };

    fetchParticipants();

    const channel = supabase
      .channel('realtime-participants-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, () => {
        fetchParticipants();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-slate-400';
    if (rank === 3) return 'text-orange-500';
    return '';
  };

  const NoVotes = () => (
    <div className="text-center py-16">
      <h2 className="text-2xl font-semibold">Belum Ada Vote</h2>
      <p className="text-muted-foreground mt-2">Hasil akan muncul di sini setelah ada vote yang masuk.</p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Hasil Vote</CardTitle>
        <CardDescription>Hasil voting diperbarui secara real-time.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            {participants.length === 0 ? <NoVotes /> : (
              <>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {participants.map((p, index) => (
                    <Card key={p.id} className={`p-4 ${index < 3 ? 'bg-secondary' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`font-bold text-2xl w-12 text-center ${getRankColor(index + 1)}`}>
                          <div className="flex items-center justify-center">
                            {index < 3 && <Crown className="h-6 w-6" style={{ filter: `drop-shadow(0 0 4px currentColor)`}} />}
                            {index + 1}
                          </div>
                        </div>
                        <img src={p.photo_url || '/placeholder.svg'} alt={p.name} className="h-16 w-16 rounded-md object-cover" />
                        <div className="flex-grow">
                          <p className="font-bold">{p.name}</p>
                          <Badge variant="default" className="text-md">{p.vote_count} Votes</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Peringkat</TableHead>
                        <TableHead className="w-[80px]">Foto</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead className="text-right">Jumlah Vote</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((p, index) => (
                        <TableRow key={p.id} className={index < 3 ? 'bg-secondary' : ''}>
                          <TableCell className={`font-bold text-lg ${getRankColor(index + 1)}`}>
                            <div className="flex items-center">
                              {index < 3 && <Crown className="mr-2 h-5 w-5" style={{ filter: `drop-shadow(0 0 4px currentColor)`}} />}
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell><img src={p.photo_url || '/placeholder.svg'} alt={p.name} className="h-12 w-12 rounded-md object-cover" /></TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right"><Badge variant="default" className="text-lg">{p.vote_count}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Dashboard;