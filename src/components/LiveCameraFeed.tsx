import { useRef, useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, RefreshCw, Scan, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DetectionResult } from './DetectionResult';
import { useToast } from '@/hooks/use-toast';

interface DetectionData {
  weedsDetected: boolean;
  weedCount: number;
  overallConfidence: number;
  weeds: { type: string; location: string; confidence: number }[];
  summary: string;
  processingTimeMs: number;
}

export function LiveCameraFeed() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionData | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(t('cameraError'));
    }
  }, [facingMode, t]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [stopCamera]);

  useEffect(() => {
    if (isStreaming && facingMode) {
      startCamera();
    }
  }, [facingMode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      ctx.drawImage(video, 0, 0);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

      const { data, error } = await supabase.functions.invoke('detect-weeds', {
        body: { imageBase64, detectionType: 'live_feed' },
      });

      if (error) throw error;

      if (data.success) {
        setResult(data.data);
        
        // Save to database
        await supabase.from('detection_results').insert({
          detection_type: 'live_feed',
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
        description: err instanceof Error ? err.message : 'Failed to analyze image',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewScan = () => {
    setResult(null);
  };

  if (result) {
    return (
      <div className="space-y-4">
        <DetectionResult {...result} onNewScan={handleNewScan} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden rounded-2xl aspect-video bg-muted">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {!isStreaming && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">{t('connecting')}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center p-4">
              <CameraOff className="w-12 h-12 mx-auto mb-3 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="scanning-overlay" />
              <Loader2 className="w-12 h-12 mx-auto mb-3 text-primary animate-spin" />
              <p className="text-foreground font-medium">{t('scanning')}</p>
            </div>
          </div>
        )}

        {isStreaming && !isAnalyzing && (
          <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-success text-success-foreground text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            Live
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        {!isStreaming ? (
          <Button onClick={startCamera} className="flex-1 bg-gradient-hero">
            <Camera className="w-4 h-4 mr-2" />
            {t('startCamera')}
          </Button>
        ) : (
          <>
            <Button onClick={stopCamera} variant="outline" className="flex-1">
              <CameraOff className="w-4 h-4 mr-2" />
              {t('stopCamera')}
            </Button>
            <Button onClick={switchCamera} variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              onClick={captureAndAnalyze} 
              disabled={isAnalyzing}
              className="flex-1 bg-gradient-hero"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Scan className="w-4 h-4 mr-2" />
              )}
              {t('captureFrame')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
