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
        console.error(error);
      } else {
        setParticipants(data);
      }
      setLoading(false);
    };

    fetchParticipants();

    const channel = supabase
      .channel('realtime-participants-dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        (payload) => {
            fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-yellow-700';
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard Hasil Vote</CardTitle>
        <CardDescription>Hasil voting diperbarui secara real-time. Peringkat teratas akan muncul di paling atas.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
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
              {participants.length > 0 ? (
                participants.map((p, index) => (
                  <TableRow key={p.id}>
                    <TableCell className={`font-bold text-lg ${getRankColor(index + 1)}`}>
                      <div className="flex items-center">
                        {index < 3 && <Crown className="mr-2 h-5 w-5" />}
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <img
                        src={p.photo_url || '/placeholder.svg'}
                        alt={p.name}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default" className="text-lg">
                        {p.vote_count}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Belum ada vote yang masuk atau belum ada peserta.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default Dashboard;