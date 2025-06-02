import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/ui/button';
import { Pause, Play } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const abortController = new AbortController();

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgb(var(--foreground-rgb))',
      progressColor: 'rgb(var(--primary-rgb))',
      url: src,
      height: 48,
      normalize: true,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('finish', () => setIsPlaying(false));

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      abortController.abort();
    };
  }, [src]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.pause();
      } else {
        wavesurferRef.current.play();
      }
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className || ''}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        className="shrink-0"
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>
      <div ref={containerRef} className="flex-1 min-w-0" />
    </div>
  );
}