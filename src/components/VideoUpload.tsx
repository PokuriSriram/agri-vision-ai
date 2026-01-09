import { useRef, useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Video, Loader2, Play, Pause, SkipForward, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DetectionResult } from './DetectionResult';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface DetectionData {
  weedsDetected: boolean;
  weedCount: number;
  overallConfidence: number;
  weeds: { type: string; location: string; confidence: number }[];
  summary: string;
  processingTimeMs: number;
}

export function VideoUpload() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DetectionData | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload a video file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: t('maxSize'),
        variant: 'destructive',
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setResult(null);
  }, [t, toast]);

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const analyzeCurrentFrame = async () => {
    const imageBase64 = captureFrame();
    if (!imageBase64) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('detect-weeds', {
        body: { imageBase64, detectionType: 'video' },
      });

      if (error) throw error;

      if (data.success) {
        setResult(data.data);
        
        // Save to database
        await supabase.from('detection_results').insert({
          detection_type: 'video',
          weeds_detected: data.data.weedsDetected,
          weed_count: data.data.weedCount,
          weed_details: data.data.weeds,
          confidence_score: data.data.overallConfidence / 100,
          processing_time_ms: data.data.processingTimeMs,
        });
      } else {
        throw new Error(data.error || 'Detection failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      toast({
        title: t('error'),
        description: err instanceof Error ? err.message : 'Failed to analyze frame',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipFrame = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += 1;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(progress);
  };

  const handleNewScan = () => {
    setResult(null);
  };

  const clearVideo = () => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    setVideoSrc(null);
    setResult(null);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  if (result) {
    return (
      <div className="space-y-4">
        {videoSrc && (
          <Card className="relative overflow-hidden rounded-2xl">
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full aspect-video object-cover"
            />
          </Card>
        )}
        <DetectionResult {...result} onNewScan={handleNewScan} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <canvas ref={canvasRef} className="hidden" />

      {!videoSrc ? (
        <Card
          className={`detection-zone p-8 cursor-pointer transition-all duration-300 ${
            isDragging ? 'detection-zone-active border-primary' : 'border-muted-foreground/30'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-wheat flex items-center justify-center">
              <Upload className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('dragDrop')}</h3>
            <p className="text-muted-foreground mb-4">{t('or')}</p>
            <Button variant="outline" className="mb-4">
              <Video className="w-4 h-4 mr-2" />
              {t('browseFiles')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('supportedFormats')}</p>
            <p className="text-xs text-muted-foreground">{t('maxSize')}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="relative overflow-hidden rounded-2xl">
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full aspect-video object-cover"
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <div className="scanning-overlay" />
                  <Loader2 className="w-12 h-12 mx-auto mb-3 text-primary animate-spin" />
                  <p className="text-foreground font-medium">{t('analyzing')}</p>
                </div>
              </div>
            )}
            
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-3 right-3"
              onClick={clearVideo}
            >
              <X className="w-4 h-4" />
            </Button>
          </Card>

          <Progress value={progress} className="h-2" />

          <div className="flex flex-wrap gap-3">
            <Button onClick={togglePlayPause} variant="outline" className="flex-1">
              {isPlaying ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button onClick={skipFrame} variant="outline" size="icon">
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button 
              onClick={analyzeCurrentFrame} 
              disabled={isAnalyzing}
              className="flex-1 bg-gradient-hero"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Video className="w-4 h-4 mr-2" />
              )}
              Analyze Frame
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
