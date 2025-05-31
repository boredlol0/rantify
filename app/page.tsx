'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { MessageSquarePlus, Users, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      <header className="fixed w-full top-0 z-50 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold"
          >
            Rant to Reflection
          </motion.h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-32">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            Vent it out. Reframe it. Feel better.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-12">
            Transform your frustrations into insights with AI-powered perspective shifts.
            Let go of what's weighing you down and discover a fresh outlook.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/signup">
              <Button size="lg" className="text-lg w-full sm:w-auto">
                <MessageSquarePlus className="mr-2 h-5 w-5" />
                Post a Rant
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="text-lg w-full sm:w-auto">
                <Users className="mr-2 h-5 w-5" />
                View Rants
              </Button>
            </Link>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-8 text-center"
          >
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">Express Freely</h3>
              <p className="text-muted-foreground">Let it all out in a safe, judgment-free space. Your thoughts matter.</p>
            </div>
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">AI Insights</h3>
              <p className="text-muted-foreground">Receive thoughtful, AI-generated perspectives that help shift your mindset.</p>
            </div>
            <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">Grow Together</h3>
              <p className="text-muted-foreground">Connect with others who understand. Share experiences and support.</p>
            </div>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
}