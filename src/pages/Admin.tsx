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
import { AddParticipantDialog } from '@/components/AddParticipantDialog';
import { Badge } from '@/components/ui/badge';

type Participant = {
  id: string;
  name: string;
  participant_number: string | null;
  photo_url: string | null;
  vote_count: number;
};

const Admin = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParticipants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('participant_number', { ascending: true });

    if (error) {
      showError('Gagal memuat data peserta.');
      console.error(error);
    } else {
      setParticipants(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manajemen Peserta</CardTitle>
          <CardDescription>Tambah, lihat, dan kelola peserta lomba.</CardDescription>
        </div>
        <AddParticipantDialog onSuccess={fetchParticipants} />
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
                <TableHead className="w-[80px]">Foto</TableHead>
                <TableHead className="w-[150px]">No. Peserta</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="text-right">Jumlah Vote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.length > 0 ? (
                participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <img
                        src={p.photo_url || '/placeholder.svg'}
                        alt={p.name}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell>{p.participant_number || '-'}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{p.vote_count}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Belum ada peserta. Silakan tambahkan peserta baru.
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

export default Admin;