'use client';

import { useRef, useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioData, setAudioData] = useState<number[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const contextRef = useRef<AudioContext>();
  const sourceRef = useRef<AudioBufferSourceNode>();
  const analyzerRef = useRef<AnalyserNode>();

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Create analyzer node
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Get audio data for initial waveform
        const channelData = audioBuffer.getChannelData(0);
        const samples = 100; // Number of samples we want to display
        const blockSize = Math.floor(channelData.length / samples);
        const waveformData = [];
        
        for (let i = 0; i < samples; i++) {
          const blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[blockStart + j]);
          }
          waveformData.push(sum / blockSize);
        }
        
        setAudioData(waveformData);
        contextRef.current = audioContext;
        analyzerRef.current = analyzer;
        
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    };

    fetchAudio();
    
    return () => {
      if (contextRef.current?.state !== 'closed') {
        contextRef.current?.close();
      }
    };
  }, [src]);

  useEffect(() => {
    if (!canvasRef.current || !audioData.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / audioData.length;
      const multiplier = height / Math.max(...audioData);

      ctx.clearRect(0, 0, width, height);
      
      audioData.forEach((value, i) => {
        const barHeight = value * multiplier;
        const x = i * barWidth;
        const y = (height - barHeight) / 2;
        
        // Calculate opacity based on current playback position
        const progress = currentTime / duration;
        const barProgress = i / audioData.length;
        const opacity = barProgress <= progress ? 1 : 0.3;
        
        ctx.fillStyle = `rgba(79, 70, 229, ${opacity})`; // Indigo color
        ctx.fillRect(x, y, barWidth * 0.8, barHeight);
      });
    };

    draw();
  }, [audioData, currentTime, duration]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('ended', () => setIsPlaying(false));
    
    return () => {
      audio.removeEventListener('loadedmetadata', () => setDuration(audio.duration));
      audio.removeEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, []);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("relative flex items-center gap-4 p-2 rounded-full bg-muted/30", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={togglePlayPause}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <div className="relative flex-1 h-8">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer"
          width={500}
          height={32}
        />
      </div>
      
      <span className="text-sm tabular-nums">
        {formatTime(currentTime)}
      </span>
      
      <audio ref={audioRef} src={src} />
    </div>
  );
}