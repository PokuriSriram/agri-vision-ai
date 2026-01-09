import { useRef, useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Video, Loader2, Play, Pause, SkipForward, X, Scan, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DetectionResult } from './DetectionResult';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface DetectionData {
  weedsDetected: boolean;
  weedCount: number;
  overallConfidence: number;
  weeds: { type: string; location: string; confidence: number; boundingBox?: { x: number; y: number; width: number; height: number } }[];
  summary: string;
  processingTimeMs: number;
  imageWidth?: number;
  imageHeight?: number;
}

export function VideoUpload() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DetectionData | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [videoSrc, result]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error(t('invalidFile') || 'Please upload a video file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error(t('fileTooLarge') || 'File too large. Max 100MB.');
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setResult(null);
    setCapturedFrame(null);
  }, [t]);

  const captureFrame = (): { image: string; width: number; height: number } | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0);
    return {
      image: canvas.toDataURL('image/jpeg', 0.8),
      width: video.videoWidth,
      height: video.videoHeight,
    };
  };

  const analyzeCurrentFrame = async () => {
    const frameData = captureFrame();
    if (!frameData) return;

    setCapturedFrame(frameData.image);
    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('detect-weeds', {
        body: { 
          imageBase64: frameData.image, 
          detectionType: 'video',
          imageWidth: frameData.width,
          imageHeight: frameData.height,
        },
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

        if (data.data.weedsDetected) {
          toast.warning(`⚠️ ${data.data.weedCount} weeds detected!`);
        } else {
          toast.success('✅ No weeds detected!');
        }
      } else {
        throw new Error(data.error || 'Detection failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error(t('error') || 'Failed to analyze frame');
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
    setCapturedFrame(null);
  };

  const clearVideo = () => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    setVideoSrc(null);
    setResult(null);
    setCapturedFrame(null);
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
        {capturedFrame && (
          <Card className="relative overflow-hidden rounded-2xl">
            <div ref={containerRef} className="relative">
              <img 
                src={capturedFrame} 
                alt="Analyzed Frame" 
                className="w-full aspect-video object-cover"
                onLoad={() => {
                  if (containerRef.current) {
                    setContainerSize({
                      width: containerRef.current.offsetWidth,
                      height: containerRef.current.offsetHeight,
                    });
                  }
                }}
              />
              {result.weedsDetected && (
                <BoundingBoxOverlay
                  weeds={result.weeds}
                  containerWidth={containerSize.width}
                  containerHeight={containerSize.height}
                  originalWidth={result.imageWidth}
                  originalHeight={result.imageHeight}
                />
              )}

              {/* No weeds overlay */}
              {!result.weedsDetected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white bg-success/90 px-6 py-4 rounded-xl shadow-lg">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-xl font-bold">{t('noWeedsDetected') || '✅ No Weeds Detected'}</p>
                  </div>
                </div>
              )}
            </div>
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
            isDragging ? 'detection-zone-active border-primary scale-105' : 'border-muted-foreground/30'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-wheat flex items-center justify-center">
              <Upload className="w-10 h-10 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('dragDrop') || 'Drag & drop your video here'}</h3>
            <p className="text-muted-foreground mb-4">{t('or') || 'or'}</p>
            <Button variant="outline" size="lg" className="mb-4 h-12">
              <Video className="w-5 h-5 mr-2" />
              {t('browseFiles') || 'Browse Files'}
            </Button>
            <p className="text-sm text-muted-foreground">{t('videoFormats') || 'MP4, WEBM, MOV • Max 100MB'}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card ref={containerRef} className="relative overflow-hidden rounded-2xl">
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
                  <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
                  <p className="text-xl font-bold text-foreground">{t('analyzing') || 'Analyzing Frame...'}</p>
                </div>
              </div>
            )}
            
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-3 right-3 h-10 w-10"
              onClick={clearVideo}
            >
              <X className="w-5 h-5" />
            </Button>
          </Card>

          <Progress value={progress} className="h-2" />

          <div className="flex flex-wrap gap-3">
            <Button onClick={togglePlayPause} variant="outline" size="lg" className="flex-1 h-12">
              {isPlaying ? (
                <Pause className="w-5 h-5 mr-2" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              {isPlaying ? t('pause') || 'Pause' : t('play') || 'Play'}
            </Button>
            <Button onClick={skipFrame} variant="outline" size="lg" className="h-12">
              <SkipForward className="w-5 h-5" />
            </Button>
            <Button 
              onClick={analyzeCurrentFrame} 
              disabled={isAnalyzing}
              size="lg"
              className="flex-1 bg-gradient-hero h-12"
            >
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Scan className="w-5 h-5 mr-2" />
              )}
              {t('analyzeFrame') || 'Analyze Frame'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
