'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Globe, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { AudioPlayer } from '@/components/ui/audio-player';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Rant {
  id: string;
  title: string;
  transcript: string;
  is_private: boolean;
  anonymous: boolean;
  created_at: string;
  audio_url: string | null;
  views: number;
  owner_id: string;
  owner_username: string | null;
}

export default function RantPage() {
  const searchParams = useSearchParams();
  const rantId = searchParams.get('id');
  const [rant, setRant] = useState<Rant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(true);
  const [viewIncremented, setViewIncremented] = useState(false);

  useEffect(() => {
    const fetchRant = async () => {
      if (!rantId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // First, fetch the rant data
        const { data: rantData, error: rantError } = await supabase
          .from('rants')
          .select('*')
          .eq('id', rantId)
          .single();

        if (rantError || !rantData) {
          setNotFound(true);
          return;
        }

        // Then, fetch the user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('raw_user_meta_data')
          .eq('id', rantData.owner_id)
          .single();

        const fullRant = {
          ...rantData,
          owner_username: userData?.raw_user_meta_data?.username || null
        };
        
        setRant(fullRant);

        // Increment view count if not already done
        if (!viewIncremented) {
          const { error: updateError } = await supabase
            .from('rants')
            .update({ views: (fullRant.views || 0) + 1 })
            .eq('id', rantId);

          if (!updateError) {
            setViewIncremented(true);
            setRant(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
          }
        }
      } catch (error) {
        console.error('Error fetching rant:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRant();
  }, [rantId, viewIncremented]);

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
                  {rant.anonymous ? 'Anonymous' : (rant.owner_username || 'Unknown User')}
                </span>
              </div>
              <span>{format(new Date(rant.created_at), 'PPP')}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {rant.audio_url && (
              <AudioPlayer src={rant.audio_url} className="w-full" />
            )}
            
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {isTranscriptExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide Transcript
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show Transcript
                  </>
                )}
              </Button>

              <AnimatePresence>
                {isTranscriptExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-muted/20 rounded-lg p-6">
                      <p className="text-lg leading-relaxed">{rant.transcript}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
}