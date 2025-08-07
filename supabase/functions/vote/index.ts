import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Mendefinisikan header CORS langsung di dalam fungsi
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inisialisasi Supabase client dengan service_role key untuk hak akses penuh
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle preflight OPTIONS request untuk CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { participantId, visitorId } = await req.json();

    if (!participantId || !visitorId) {
      return new Response(JSON.stringify({ error: 'ID Peserta dan ID Pengunjung dibutuhkan.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 1. Periksa apakah visitorId ini sudah pernah vote sebelumnya
    const { data: existingVote, error: checkError } = await supabaseAdmin
      .from('votes')
      .select('id')
      .eq('visitor_id', visitorId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = baris tidak ditemukan, itu bagus
      throw checkError;
    }

    if (existingVote) {
      return new Response(JSON.stringify({ error: 'Anda sudah pernah memberikan suara.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409, // 409 Conflict
      });
    }

    // 2. Jika belum, jalankan fungsi database untuk menambah vote dan mencatatnya
    const { error: rpcError } = await supabaseAdmin.rpc('increment_vote_and_log', {
      p_participant_id: participantId,
      p_visitor_id: visitorId
    });

    if (rpcError) {
      throw rpcError;
    }

    return new Response(JSON.stringify({ message: 'Vote berhasil dicatat!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});