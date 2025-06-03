'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, ArrowUpDown, Clock, Eye, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { AudioPlayer } from '@/components/ui/audio-player';

interface Rant {
  id: string;
  title: string;
  transcript: string;
  audio_url: string | null;
  is_private: boolean;
  anonymous: boolean;
  created_at: string;
  views: number;
  owner_username: string | null;
}

export default function RantsPage() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('latest');
  const [timeRange, setTimeRange] = useState('day');
  const [rants, setRants] = useState<Rant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRants();
  }, [sortBy, timeRange]);

  const fetchRants = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('rants')
        .select('*')
        .eq('is_private', false);

      if (sortBy === 'top') {
        const now = new Date();
        let startDate;
        
        switch (timeRange) {
          case 'day':
            startDate = new Date(now.setDate(now.getDate() - 1));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default:
            startDate = new Date(0); // All time
        }

        query = query
          .gte('created_at', startDate.toISOString())
          .order('views', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setRants(data || []);
    } catch (error) {
      console.error('Error fetching rants:', error);
    } finally {
      setLoading(false);
    }
  };

  const NavButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 px-6 py-2 rounded-full bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 py-4 backdrop-blur-md bg-background/50 border-b border-border/50"
      >
        <div className="container mx-auto flex justify-center">
          <NavButton icon={Home} label="Home" onClick={() => router.push('/home')} />
        </div>
      </motion.nav>

      <div className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            View Public Rants
          </h1>
          <p className="text-lg text-muted-foreground">
            See what others are talking about
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Latest
                </div>
              </SelectItem>
              <SelectItem value="top">
                <div className="flex items-center">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Top Viewed
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {sortBy === 'top' && (
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Past 24 hours</SelectItem>
                <SelectItem value="week">Past week</SelectItem>
                <SelectItem value="month">Past month</SelectItem>
                <SelectItem value="year">Past year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-6"
        >
          {loading ? (
            <Card className="border-none bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="animate-pulse text-center">Loading rants...</div>
              </CardContent>
            </Card>
          ) : rants.length === 0 ? (
            <Card className="border-none bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg mb-2">No rants found</p>
                  <p>Be the first to share your thoughts!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {rants.map((rant, index) => (
                <motion.div
                  key={rant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-none bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/rant?id=${rant.id}`}
                            className="text-xl font-semibold hover:text-primary transition-colors"
                          >
                            {rant.title}
                          </Link>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{rant.views || 0}</span>
                            </div>
                            <Globe className="h-4 w-4" />
                          </div>
                        </div>

                        {rant.audio_url && (
                          <AudioPlayer src={rant.audio_url} className="w-full" />
                        )}

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            Posted by{' '}
                            <span className="font-medium">
                              {rant.anonymous ? 'Anonymous' : rant.owner_username}
                            </span>
                          </span>
                          <span>{format(new Date(rant.created_at), 'PPp')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  );
}