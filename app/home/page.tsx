'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { getGreeting } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const { user, username } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user || !username) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto pt-20"
      >
        <h1 className="text-4xl font-bold mb-6">
          {getGreeting()}, {username}!
        </h1>
        {/* Add your dashboard content here */}
      </motion.div>
    </div>
  );
}