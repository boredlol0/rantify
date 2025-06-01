'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquarePlus, Users, Clock, Lock, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const router = useRouter();

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
          <Dialog>
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
              <div className="grid gap-4 py-4">
                <p className="text-muted-foreground">Post a rant goes here</p>
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