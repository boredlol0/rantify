'use client';

import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquarePlus, Users, Clock, Lock, Globe, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface Rant {
  id: string;
  title: string;
  transcript: string;
  is_private: boolean;
  anonymous: boolean;
  created_at: string;
}

export default function HomePage() {
  const [username, setUsername] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  const [rants, setRants] = useState<Rant[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    const fetchUserAndRants = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUsername(user.user_metadata.username);

      const { data: userRants, error } = await supabase
        .from('rants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rants:', error);
        return;
      }

      setRants(userRants);
    };

    fetchUserAndRants();
  }, [router]);

  useEffect(() => {
    if (isRecording && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, timeLeft]);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Speech recognition is not supported in your browser."
      });
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };

    recognitionRef.current.start();
    setIsRecording(true);
    setTimeLeft(180);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  };

  const handleSubmitRant = async () => {
    if (!transcript.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please record your rant before submitting."
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const title = transcript.split(' ').slice(0, 5).join(' ') + '...';
    
    const { error } = await supabase.from('rants').insert({
      owner_id: user.id,
      title,
      transcript,
      is_private: isPrivate,
      anonymous: !isPrivate ? isAnonymous : false,
      audio_url: null
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your rant. Please try again."
      });
      return;
    }

    // Refresh rants list
    const { data: userRants } = await supabase
      .from('rants')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (userRants) {
      setRants(userRants);
    }

    setIsDialogOpen(false);
    setTranscript('');
    setIsPrivate(false);
    setIsAnonymous(false);
    
    toast({
      title: "Success",
      description: "Your rant has been posted successfully!"
    });
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      stopRecording();
      setTranscript('');
      setIsPrivate(false);
      setIsAnonymous(false);
      setTimeLeft(180);
    }
  };

  if (!username) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-accent flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent p-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-none bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-4xl font-bold">
                {greeting}, {username}!
              </CardTitle>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button size="lg" className="text-lg w-full sm:w-auto">
                <MessageSquarePlus className="mr-2 h-5 w-5" />
                Post a Rant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Share Your Thoughts</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <Button
                    variant={isRecording ? "destructive" : "default"}
                    size="lg"
                    className="rounded-full w-16 h-16"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? (
                      <MicOff className="h-8 w-8" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </Button>
                  {isRecording && (
                    <div className="text-sm text-muted-foreground">
                      Time remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {transcript && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-muted/50 rounded-lg p-4 h-32 overflow-y-auto">
                        {transcript}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Private Rant</span>
                          <Switch
                            checked={isPrivate}
                            onCheckedChange={setIsPrivate}
                          />
                        </div>

                        {!isPrivate && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Post Anonymously</span>
                            <Switch
                              checked={isAnonymous}
                              onCheckedChange={setIsAnonymous}
                            />
                          </div>
                        )}

                        <Button
                          className="w-full"
                          onClick={handleSubmitRant}
                        >
                          Post Rant
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            size="lg"
            variant="outline"
            className="text-lg w-full sm:w-auto"
            onClick={() => router.push('/rants')}
          >
            <Users className="mr-2 h-5 w-5" />
            View Public Rants
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-none bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Your Rants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rants.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  You haven't posted any rants yet. Share your thoughts!
                </p>
              ) : (
                rants.map((rant) => (
                  <motion.div
                    key={rant.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-background/50 backdrop-blur-sm rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{rant.title}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {rant.is_private ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          {format(new Date(rant.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">
                      {rant.transcript}
                    </p>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}