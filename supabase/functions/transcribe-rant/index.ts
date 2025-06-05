import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { rant_id } = await req.json();
    if (!rant_id) {
      return new Response(JSON.stringify({
        error: 'Missing rant_id'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Fetch rant and validate
    const { data: rant, error: fetchError } = await supabase
      .from('rants')
      .select('*')
      .eq('id', rant_id)
      .single();

    if (fetchError || !rant) {
      return new Response(JSON.stringify({
        error: 'Rant not found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    if (rant.transcript_status === 'complete') {
      return new Response(JSON.stringify({
        message: 'Transcript already complete'
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    if (!rant.audio_url) {
      return new Response(JSON.stringify({
        error: 'No audio_url on rant'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Download audio from Supabase Storage
    const audioPath = rant.audio_url.replace(`${supabaseUrl}/storage/v1/object/public/`, '');
    const { data: audioFile, error: downloadError } = await supabase.storage
      .from('public') // Replace 'public' with your bucket name
      .download(audioPath);

    if (downloadError || !audioFile) {
      return new Response(JSON.stringify({
        error: 'Failed to download audio'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Send to ElevenLabs
    const elevenResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'Xi-Api-Key': Deno.env.get('ELEVENLABS_API_KEY')
      },
      body: (() => {
        const form = new FormData();
        form.append('model_id', 'scribe_v1');
        form.append('file', new Blob([audioFile], { type: 'audio/wav' }), 'rant.wav');
        return form;
      })()
    });

    if (!elevenResponse.ok) {
      console.error('ElevenLabs error:', await elevenResponse.text());
      return new Response(JSON.stringify({
        error: 'Transcription failed'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const elevenData = await elevenResponse.json();
    const transcript = elevenData?.text || '';

    // Update the rant row
    const { error: updateError } = await supabase
      .from('rants')
      .update({
        transcript,
        transcript_status: 'complete'
      })
      .eq('id', rant_id);

    if (updateError) {
      return new Response(JSON.stringify({
        error: 'Failed to update transcript'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      message: 'Transcription complete',
      transcript
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});