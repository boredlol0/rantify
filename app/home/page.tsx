'use client';

import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquarePlus, Users, Clock, Lock, Globe, Trash2, ChevronDown, ChevronUp, Eye, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AudioPlayer } from '@/components/ui/audio-player';
import { AIVoiceInput } from '@/components/ui/ai-voice-input';
import Link from 'next/link';

interface Rant {
  id: string;
  title: string;
  transcript: string | null;
  transcript_status: 'pending' | 'complete' | 'error';
  is_private: boolean;
  anonymous: boolean;
  created_at: string;
  audio_url: string | null;
  views: number;
  owner_username: string | null;
}

export default function HomePage() {
  const [username, setUsername] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  const [rants, setRants] = useState<Rant[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [expandedRants, setExpandedRants] = useState<Set<string>>(new Set());
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [rantTitle, setRantTitle] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  // Only load audio devices when user opens the dialog and wants to record
  const loadAudioDevices = async () => {
    try {
      // Request permission and get devices
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately - we just needed it for permissions
      stream.getTracks().forEach(track => track.stop());
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      setAudioDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedDevice) {
        setSelectedDevice(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Error loading audio devices:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please ensure microphone permissions are granted"
      });
    }
  };

  const toggleTranscript = (rantId: string) => {
    setExpandedRants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rantId)) {
        newSet.delete(rantId);
      } else {
        newSet.add(rantId);
      }
      return newSet;
    });
  };

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

  const handleLogout = async () => {
    try {
      // Clean up any active streams before logout
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        setCurrentStream(null);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "You have been logged out successfully"
      });
      
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const startRecording = async () => {
    try {
      // Load devices if not already loaded
      if (audioDevices.length === 0) {
        await loadAudioDevices();
      }

      const constraints = {
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCurrentStream(stream);
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Clean up the stream when recording stops
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
          setCurrentStream(null);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error('Recording error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions."
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Clean up the current stream
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
    }
    
    setIsRecording(false);
  };

  const handleVoiceStart = () => {
    startRecording();
  };

  const handleVoiceStop = (duration: number) => {
    setRecordingDuration(duration);
    stopRecording();
  };

  const handleDeleteRant = async (rantId: string, audioUrl: string | null) => {
    try {
      if (audioUrl) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const audioPath = `audio/${user.id}/${rantId}.wav`;
        const { error: deleteStorageError } = await supabase.storage
          .from('rants')
          .remove([audioPath]);

        if (deleteStorageError) {
          throw new Error('Failed to delete audio file');
        }
      }

      const { error: deleteRantError } = await supabase
        .from('rants')
        .delete()
        .eq('id', rantId);

      if (deleteRantError) {
        throw new Error('Failed to delete rant');
      }

      setRants(rants.filter(rant => rant.id !== rantId));

      toast({
        title: "Success",
        description: "Rant deleted successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete rant"
      });
    }
  };

  const handleSubmitRant = async () => {
    if (!audioBlob) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please record your rant before submitting."
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const rantId = crypto.randomUUID();
      
      const audioPath = `audio/${user.id}/${rantId}.wav`;
      const { error: uploadError } = await supabase.storage
        .from('rants')
        .upload(audioPath, audioBlob);

      if (uploadError) {
        throw new Error('Failed to upload audio file');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('rants')
        .getPublicUrl(audioPath);
      
      const { error: rantError } = await supabase.from('rants').insert({
        id: rantId,
        owner_id: user.id,
        title: rantTitle.trim() || 'Untitled Rant',
        transcript: null,
        transcript_status: 'pending',
        is_private: isPrivate,
        anonymous: !isPrivate ? isAnonymous : false,
        audio_url: publicUrl,
        views: 0,
        owner_username: username
      });

      if (rantError) {
        await supabase.storage.from('rants').remove([audioPath]);
        throw new Error('Failed to save rant');
      }

      // Trigger transcription in background
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/transcribe-rant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rant_id: rantId }),
      }).catch(console.error); // Ignore errors since this runs in background

      const { data: userRants } = await supabase
        .from('rants')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (userRants) {
        setRants(userRants);
      }

      setIsDialogOpen(false);
      setIsPrivate(false);
      setIsAnonymous(false);
      setAudioBlob(null);
      setRantTitle('');
      setRecordingDuration(0);
      
      toast({
        title: "Success",
        description: "Your rant has been posted and is being transcribed!"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save your rant. Please try again."
      });
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Clean up when dialog closes
      stopRecording();
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        setCurrentStream(null);
      }
      setIsPrivate(false);
      setIsAnonymous(false);
      setAudioBlob(null);
      setRantTitle('');
      setRecordingDuration(0);
    } else {
      // Load devices when dialog opens (only if user wants to record)
      if (audioDevices.length === 0) {
        loadAudioDevices();
      }
    }
  };

  // Clean up streams on component unmount
  useEffect(() => {
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentStream]);

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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-4xl font-bold">
                {greeting}, {username}!
              </CardTitle>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
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
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Share Your Thoughts</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <Input
                    placeholder="Enter rant title (optional)"
                    value={rantTitle}
                    onChange={(e) => setRantTitle(e.target.value)}
                    className="w-full"
                  />
                  
                  {audioDevices.length > 1 && (
                    <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select microphone" />
                      </SelectTrigger>
                      <SelectContent>
                        {audioDevices.map((device) => (
                          <SelectItem key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <AIVoiceInput
                    onStart={handleVoiceStart}
                    onStop={handleVoiceStop}
                    className="w-full"
                  />

                  <div className="space-y-4 w-full">
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
                      disabled={!audioBlob}
                    >
                      Post Rant
                    </Button>
                  </div>
                </div>
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
                    className="bg-background/50 backdrop-blur-sm rounded-lg p-4 space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/rant?id=${rant.id}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {rant.title}
                      </Link>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">{rant.views || 0}</span>
                        </div>
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

                    {rant.audio_url && (
                      <AudioPlayer src={rant.audio_url} className="mt-4" />
                    )}

                    <div className="flex justify-between items-center mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTranscript(rant.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {expandedRants.has(rant.id) ? (
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

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/70" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your rant
                              and remove the data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteRant(rant.id, rant.audio_url)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <AnimatePresence>
                      {expandedRants.has(rant.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                            {rant.transcript_status === 'pending' ? (
                              <p className="text-muted-foreground">Transcription in progress...</p>
                            ) : rant.transcript_status === 'error' ? (
                              <p className="text-destructive">Failed to transcribe rant</p>
                            ) : (
                              rant.transcript
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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