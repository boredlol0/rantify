'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import WaveSurfer from 'wavesurfer.js';

interface AudioPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
}

export function AudioPlayer({ src, className, ...props }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Cleanup previous instance if it exists
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    // Create new instance
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#8b5cf6',
      progressColor: '#4c1d95',
      cursorColor: '#4c1d95',
      barWidth: 2,
      barGap: 3,
      barRadius: 3,
      height: 48,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurferRef.current = wavesurfer;

    const setupWaveSurfer = async () => {
      try {
        await wavesurfer.load(src);
        
        wavesurfer.on('ready', () => {
          const duration = wavesurfer.getDuration() || 0;
          setDuration(formatTime(duration));
        });

        wavesurfer.on('audioprocess', () => {
          const currentTime = wavesurfer.getCurrentTime() || 0;
          setCurrentTime(formatTime(currentTime));
        });

        wavesurfer.on('finish', () => {
          setIsPlaying(false);
        });
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    };

    setupWaveSurfer();

    // Cleanup function
    return () => {
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        } catch (error) {
          console.error('Error destroying WaveSurfer instance:', error);
        }
      }
    };
  }, [src]);

  const togglePlayPause = () => {
    if (!wavesurferRef.current) return;

    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <div className="text-sm text-muted-foreground min-w-[4rem]">
          {currentTime} / {duration}
        </div>
      </div>
      <div
        ref={waveformRef}
        className="rounded-lg overflow-hidden bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
      />
    </div>
  );
}