import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  event_name: z.string().min(1, { message: 'Nama acara tidak boleh kosong.' }),
  logo: z.instanceof(FileList).optional(),
});

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      event_name: '',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('settings').select('key, value');
      if (error) {
        showError('Gagal memuat pengaturan.');
      } else {
        const settingsMap = new Map(data.map(s => [s.key, s.value]));
        form.reset({
          event_name: settingsMap.get('event_name') || 'Lomba Musik',
        });
        setCurrentLogoUrl(settingsMap.get('logo_url') || null);
      }
      setLoading(false);
    };
    fetchSettings();
  }, [form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const toastId = showLoading('Menyimpan pengaturan...');
    try {
      // Upsert event name
      const { error: nameError } = await supabase.from('settings').upsert({
        key: 'event_name',
        value: values.event_name,
      }, { onConflict: 'key' });

      if (nameError) throw nameError;

      // Handle logo upload if a new one is provided
      const logoFile = values.logo?.[0];
      if (logoFile) {
        const fileName = `logo-${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from('event-assets')
          .upload(fileName, logoFile, {
            cacheControl: '3600',
            upsert: true,
          });
        
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('event-assets')
          .getPublicUrl(fileName);

        const { error: logoUrlError } = await supabase.from('settings').upsert({
          key: 'logo_url',
          value: urlData.publicUrl,
        }, { onConflict: 'key' });

        if (logoUrlError) throw logoUrlError;
        setCurrentLogoUrl(urlData.publicUrl);
      }

      dismissToast(toastId);
      showSuccess('Pengaturan berhasil disimpan!');
    } catch (error) {
      dismissToast(toastId);
      showError(error instanceof Error ? error.message : 'Terjadi kesalahan.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Acara</CardTitle>
        <CardDescription>Ubah nama acara dan unggah logo di sini. Perubahan akan langsung terlihat di seluruh situs.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="event_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Acara</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Lomba Musik Kemerdekaan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo Acara (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={(e) => field.onChange(e.target.files)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {currentLogoUrl && (
                <div>
                  <FormLabel>Logo Saat Ini</FormLabel>
                  <img src={currentLogoUrl} alt="Logo saat ini" className="mt-2 h-20 w-auto rounded-md border bg-slate-50 p-2" />
                </div>
              )}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default Settings;