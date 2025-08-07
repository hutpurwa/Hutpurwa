import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { PlusCircle } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nama harus memiliki setidaknya 2 karakter.' }),
  participant_number: z.string().min(1, { message: 'Nomor peserta tidak boleh kosong.' }),
  photo: z.instanceof(FileList).refine((files) => files?.length === 1, 'Foto wajib diunggah.'),
});

type AddParticipantDialogProps = {
  onSuccess: () => void;
};

export const AddParticipantDialog = ({ onSuccess }: AddParticipantDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      participant_number: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const toastId = showLoading('Menambahkan peserta...');
    try {
      const photoFile = values.photo[0];
      const fileName = `${Date.now()}-${photoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('participant-photos')
        .upload(`public/${fileName}`, photoFile);

      if (uploadError) {
        throw new Error(`Gagal mengunggah foto: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('participant-photos')
        .getPublicUrl(`public/${fileName}`);

      const { error: insertError } = await supabase.from('participants').insert({
        name: values.name,
        participant_number: values.participant_number,
        photo_url: urlData.publicUrl,
      });

      if (insertError) {
        throw new Error(`Gagal menyimpan data: ${insertError.message}`);
      }

      dismissToast(toastId);
      showSuccess('Peserta berhasil ditambahkan!');
      form.reset();
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      dismissToast(toastId);
      showError(error instanceof Error ? error.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Peserta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Peserta Baru</DialogTitle>
          <DialogDescription>
            Isi detail peserta di bawah ini. Klik simpan jika sudah selesai.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Peserta</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="participant_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Peserta</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => field.onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};