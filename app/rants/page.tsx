'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, ArrowUpDown, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RantsPage() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('latest');
  const [timeRange, setTimeRange] = useState('day');

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
        >
          <Card className="border-none bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                <p className="text-lg mb-2">No rants found</p>
                <p>Be the first to share your thoughts!</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}