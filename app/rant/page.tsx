'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Globe, Eye } from 'lucide-react';
import { AudioPlayer } from '@/components/ui/audio-player';
import { Separator } from '@/components/ui/separator';

interface Rant {
  id: string;
  title: string;
  transcript: string;
  is_private: boolean;
  anonymous: boolean;
  created_at: string;
  audio_url: string | null;
  views: number;
  owner: {
    user_metadata: {
      username: string;
    };
  };
}

export default function RantPage() {
  const searchParams = useSearchParams();
  const rantId = searchParams.get('id');
  const [rant, setRant] = useState<Rant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchRant = async () => {
      if (!rantId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data: rantData, error } = await supabase
          .from('rants')
          .select(`
            *,
            owner:owner_id (
              user_metadata
            )
          `)
          .eq('id', rantId)
          .single();

        if (error || !rantData) {
          setNotFound(true);
        } else {
          setRant(rantData);
        }
      } catch (error) {
        console.error('Error fetching rant:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRant();
  }, [rantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent p-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-none bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="animate-pulse">Loading...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (notFound || !rant) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent p-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-none bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">Rant not found</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent p-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        <Card className="border-none bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-3xl font-bold">{rant.title}</CardTitle>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-5 w-5" />
                  <span>{rant.views || 0}</span>
                </div>
                {rant.is_private ? (
                  <Lock className="h-5 w-5" />
                ) : (
                  <Globe className="h-5 w-5" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Posted by</span>
                <span className="font-medium">
                  {rant.anonymous ? 'Anonymous' : rant.owner.user_metadata.username}
                </span>
              </div>
              <span>{format(new Date(rant.created_at), 'PPP')}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {rant.audio_url && (
              <AudioPlayer src={rant.audio_url} className="w-full" />
            )}
            <div className="bg-muted/20 rounded-lg p-6">
              <p className="text-lg leading-relaxed">{rant.transcript}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              No comments yet
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );