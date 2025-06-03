export const dynamic = 'force-dynamic';

import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const ELEVENLABS_API_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-speech';
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Using "Bella" voice

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rantId = searchParams.get('id');

    if (!rantId) {
      return NextResponse.json(
        { error: 'Rant ID is required' },
        { status: 400 }
      );
    }

    // Get the rant transcript from Supabase
    const { data: rant, error: rantError } = await supabase
      .from('rants')
      .select('transcript')
      .eq('id', rantId)
      .single();

    console.log(rant)

    if (rantError || !rant) {
      return NextResponse.json(
        { error: 'Rant not found' },
        { status: 404 }
      );
    }

    // Check ElevenLabs API key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TTS service configuration error' },
        { status: 500 }
      );
    }

    // Check remaining characters
    const userResponse = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    const userData = await userResponse.json();
    if (userData.character_count < rant.transcript.length) {
      return NextResponse.json(
        { error: 'TTS service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Generate TTS
    const response = await fetch(`${ELEVENLABS_API_ENDPOINT}/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: rant.transcript,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}