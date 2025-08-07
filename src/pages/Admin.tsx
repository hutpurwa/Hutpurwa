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
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { AddParticipantDialog } from '@/components/AddParticipantDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    setLoading(true);
    fetchParticipants();

    const channel = supabase
      .channel('realtime-participants-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (participant: Participant) => {
    const toastId = showLoading('Menghapus peserta...');
    try {
      if (participant.photo_url) {
        const fileName = participant.photo_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('participant-photos').remove([`public/${fileName}`]);
        }
      }
      const { error: dbError } = await supabase.from('participants').delete().eq('id', participant.id);
      if (dbError) throw new Error(dbError.message);
      dismissToast(toastId);
      showSuccess('Peserta berhasil dihapus.');
    } catch (error) {
      dismissToast(toastId);
      showError(error instanceof Error ? error.message : 'Gagal menghapus peserta.');
    }
  };

  const NoParticipants = () => (
    <div className="text-center py-16">
      <h2 className="text-2xl font-semibold">Belum Ada Peserta</h2>
      <p className="text-muted-foreground mt-2">Silakan tambahkan peserta baru.</p>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
          <>
            {participants.length === 0 ? <NoParticipants /> : (
              <>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                  {participants.map((p) => (
                    <Card key={p.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <img src={p.photo_url || '/placeholder.svg'} alt={p.name} className="h-20 w-20 rounded-md object-cover" />
                        <div className="flex-grow">
                          <p className="font-bold">{p.name}</p>
                          <p className="text-sm text-muted-foreground">No: {p.participant_number || '-'}</p>
                          <p className="text-sm text-muted-foreground">Votes: <Badge variant="secondary">{p.vote_count}</Badge></p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                              <AlertDialogDescription>Tindakan ini akan menghapus <strong>{p.name}</strong> secara permanen.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(p)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Ya, Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop View */}
                <Table className="hidden md:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Foto</TableHead>
                      <TableHead className="w-[150px]">No. Peserta</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="text-right">Jumlah Vote</TableHead>
                      <TableHead className="w-[100px] text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell><img src={p.photo_url || '/placeholder.svg'} alt={p.name} className="h-12 w-12 rounded-md object-cover" /></TableCell>
                        <TableCell>{p.participant_number || '-'}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right"><Badge variant="secondary">{p.vote_count}</Badge></TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                                <AlertDialogDescription>Tindakan ini akan menghapus <strong>{p.name}</strong> secara permanen.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(p)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Ya, Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Admin;