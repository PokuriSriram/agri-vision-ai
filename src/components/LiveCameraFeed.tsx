import { useRef, useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, RefreshCw, Scan, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DetectionResult } from './DetectionResult';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
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

export function LiveCameraFeed() {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionData | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
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
        toast.success(t('cameraConnected') || '📷 Camera started!');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError(t('cameraPermissionDenied') || '🚫 Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError(t('noCameraFound') || '📷 No camera found.');
      } else {
        setError(t('cameraError') || '❌ Camera error. Please try again.');
      }
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

  // Update container size
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
  }, [isStreaming, result]);

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
      setCapturedImage(imageBase64);

      const { data, error } = await supabase.functions.invoke('detect-weeds', {
        body: { 
          imageBase64, 
          detectionType: 'live_feed',
          imageWidth: video.videoWidth,
          imageHeight: video.videoHeight,
        },
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
      toast.error(t('error') || 'Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewScan = () => {
    setResult(null);
    setCapturedImage(null);
  };

  if (result) {
    return (
      <div className="space-y-4">
        {/* Show captured image with bounding boxes */}
        {capturedImage && result.weedsDetected && (
          <Card className="relative overflow-hidden rounded-2xl">
            <div ref={containerRef} className="relative">
              <img 
                src={capturedImage} 
                alt="Analyzed" 
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
              <BoundingBoxOverlay
                weeds={result.weeds}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
                originalWidth={result.imageWidth}
                originalHeight={result.imageHeight}
              />
            </div>
          </Card>
        )}

        {/* No weeds message */}
        {capturedImage && !result.weedsDetected && (
          <Card className="relative overflow-hidden rounded-2xl">
            <img src={capturedImage} alt="Analyzed" className="w-full aspect-video object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-success/20">
              <div className="text-center text-white bg-success/90 px-6 py-4 rounded-xl">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                <p className="text-xl font-bold">{t('noWeedsDetected') || '✅ No Weeds Detected'}</p>
              </div>
            </div>
          </Card>
        )}

        <DetectionResult {...result} onNewScan={handleNewScan} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card ref={containerRef} className="relative overflow-hidden rounded-2xl aspect-video bg-muted">
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
            <div className="text-center p-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Camera className="w-10 h-10 text-primary" />
              </div>
              <p className="text-lg font-medium text-muted-foreground">{t('clickToStart') || 'Click Start Camera to begin'}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center p-6">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <p className="text-destructive font-medium">{error}</p>
              <Button onClick={startCamera} variant="outline" className="mt-4">
                {t('tryAgain') || 'Try Again'}
              </Button>
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="scanning-overlay" />
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
              <p className="text-xl font-bold text-foreground">{t('scanning') || 'Scanning...'}</p>
              <p className="text-muted-foreground">{t('aiProcessing') || 'AI is analyzing your image'}</p>
            </div>
          </div>
        )}

        {isStreaming && !isAnalyzing && (
          <>
            <div className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-success text-success-foreground font-bold shadow-lg">
              <div className="w-3 h-3 rounded-full bg-current animate-pulse" />
              LIVE
            </div>

            {/* Scan frame overlay */}
            <div className="absolute inset-8 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br" />
            </div>
          </>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        {!isStreaming ? (
          <Button onClick={startCamera} size="lg" className="flex-1 bg-gradient-hero h-14 text-base">
            <Camera className="w-5 h-5 mr-2" />
            {t('startCamera') || 'Start Camera'}
          </Button>
        ) : (
          <>
            <Button onClick={stopCamera} variant="outline" size="lg" className="flex-1 h-14 text-base">
              <CameraOff className="w-5 h-5 mr-2" />
              {t('stopCamera') || 'Stop Camera'}
            </Button>
            <Button onClick={switchCamera} variant="outline" size="lg" className="h-14">
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button 
              onClick={captureAndAnalyze} 
              disabled={isAnalyzing}
              size="lg"
              className="flex-1 bg-gradient-hero h-14 text-base"
            >
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Scan className="w-5 h-5 mr-2" />
              )}
              {t('scanNow') || 'Scan Now'}
            </Button>
          </>
        )}
      </div>

      {/* Tips */}
      {isStreaming && !isAnalyzing && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{t('scanTip') || 'For best results:'}</p>
              <p className="text-sm text-muted-foreground">
                {t('scanTipDesc') || 'Point camera at your crop field with good lighting. Hold steady and tap Scan.'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
