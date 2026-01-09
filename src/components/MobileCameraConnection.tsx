import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, CameraOff, RefreshCw, Scan, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DetectionResult } from './DetectionResult';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';

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

interface MobileCameraConnectionProps {
  onBack: () => void;
}

export function MobileCameraConnection({ onBack }: MobileCameraConnectionProps) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionData | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'checking'>('checking');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Check camera permission on mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  // Update container size on resize
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
  }, [isStreaming]);

  const checkCameraPermission = async () => {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
        
        if (result.state === 'granted') {
          startCamera();
        }
      } else {
        setPermissionState('prompt');
      }
    } catch {
      setPermissionState('prompt');
    }
  };

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setPermissionState('checking');
      
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
        setPermissionState('granted');
        toast.success(t('cameraConnected') || '📷 Camera connected successfully!');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setPermissionState('denied');
      
      if (err.name === 'NotAllowedError') {
        setError(t('cameraPermissionDenied') || '🚫 Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError(t('noCameraFound') || '📷 No camera found on this device.');
      } else {
        setError(t('cameraError') || '❌ Could not access camera. Please try again.');
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
    if (permissionState === 'granted' && !isStreaming) {
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
      setCapturedImage(imageBase64);

      const { data, error } = await supabase.functions.invoke('detect-weeds', {
        body: { 
          imageBase64, 
          detectionType: 'mobile_camera',
          imageWidth: video.videoWidth,
          imageHeight: video.videoHeight,
        },
      });

      if (error) throw error;

      if (data.success) {
        setResult(data.data);
        
        // Save to database
        await supabase.from('detection_results').insert({
          detection_type: 'mobile_camera',
          weeds_detected: data.data.weedsDetected,
          weed_count: data.data.weedCount,
          weed_details: data.data.weeds,
          confidence_score: data.data.overallConfidence / 100,
          processing_time_ms: data.data.processingTimeMs,
        });

        if (data.data.weedsDetected) {
          toast.warning(`⚠️ ${data.data.weedCount} ${t('weedsFound') || 'weeds found!'}`);
        } else {
          toast.success(`✅ ${t('noWeedsDetected') || 'No weeds detected!'}`);
        }
      } else {
        throw new Error(data.error || 'Detection failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error(t('analysisError') || 'Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNewScan = () => {
    setResult(null);
    setCapturedImage(null);
  };

  // Show result view
  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="lg" onClick={onBack} className="h-12">
            <ArrowLeft className="w-5 h-5 mr-1" />
            {t('back')}
          </Button>
          <h2 className="text-xl font-bold">{t('scanResults') || 'Scan Results'}</h2>
        </div>

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

        <DetectionResult {...result} onNewScan={handleNewScan} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="lg" onClick={onBack} className="h-12">
          <ArrowLeft className="w-5 h-5 mr-1" />
          {t('back')}
        </Button>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Camera className="w-6 h-6" />
          {t('mobileCamera') || 'Mobile Camera'}
        </h2>
      </div>

      {/* Permission prompt */}
      {permissionState === 'prompt' && !isStreaming && (
        <Card className="p-8 text-center glass-card">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Camera className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">{t('cameraAccessNeeded') || 'Camera Access Needed'}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t('cameraAccessDesc') || 'To scan your crops for weeds, we need to access your camera. Your privacy is important - images are only processed for weed detection.'}
          </p>
          <Button onClick={startCamera} size="lg" className="bg-gradient-hero h-14 px-8 text-lg">
            <Camera className="w-5 h-5 mr-2" />
            {t('allowCamera') || 'Allow Camera Access'}
          </Button>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="p-8 text-center border-destructive/50 bg-destructive/5">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-xl font-bold mb-2 text-destructive">{t('cameraError') || 'Camera Error'}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{error}</p>
          <Button onClick={startCamera} size="lg" variant="outline" className="h-12">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('tryAgain') || 'Try Again'}
          </Button>
        </Card>
      )}

      {/* Camera view */}
      {(isStreaming || permissionState === 'checking') && !error && (
        <Card ref={containerRef} className="relative overflow-hidden rounded-2xl aspect-video bg-muted">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Connecting state */}
          {!isStreaming && permissionState === 'checking' && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-3 text-primary animate-spin" />
                <p className="text-muted-foreground">{t('connectingCamera') || 'Connecting to camera...'}</p>
              </div>
            </div>
          )}

          {/* Analyzing overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="scanning-overlay" />
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
                <p className="text-xl font-bold text-foreground">{t('scanningForWeeds') || 'Scanning for weeds...'}</p>
                <p className="text-muted-foreground mt-2">{t('aiProcessing') || 'AI is analyzing your crop field'}</p>
              </div>
            </div>
          )}

          {/* Live indicator */}
          {isStreaming && !isAnalyzing && (
            <div className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-success text-success-foreground font-bold shadow-lg">
              <div className="w-3 h-3 rounded-full bg-current animate-pulse" />
              {t('live') || 'LIVE'}
            </div>
          )}

          {/* Scan overlay frame */}
          {isStreaming && !isAnalyzing && (
            <div className="absolute inset-8 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br" />
            </div>
          )}
        </Card>
      )}

      {/* Control buttons */}
      {isStreaming && (
        <div className="flex flex-wrap gap-3">
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
            className="flex-1 h-14 text-base bg-gradient-hero"
          >
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Scan className="w-5 h-5 mr-2" />
            )}
            {t('scanNow') || 'Scan Now'}
          </Button>
        </div>
      )}

      {/* Instructions */}
      {isStreaming && !isAnalyzing && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">{t('scanTip') || 'Tip for best results:'}</p>
              <p className="text-sm text-muted-foreground">
                {t('scanTipDesc') || 'Hold your phone steady and point at the crop area. Make sure there is good lighting for accurate weed detection.'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
