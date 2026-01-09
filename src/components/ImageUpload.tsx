import { useRef, useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Image as ImageIcon, Loader2, X, CheckCircle2 } from 'lucide-react';
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

export function ImageUpload() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<DetectionData | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 1280, height: 720 });

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
  }, [preview, result]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('invalidFile') || 'Please upload an image file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error(t('fileTooLarge') || 'File too large. Max 50MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageBase64 = e.target?.result as string;
      setPreview(imageBase64);

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        analyzeImage(imageBase64, img.naturalWidth, img.naturalHeight);
      };
      img.src = imageBase64;
    };
    reader.readAsDataURL(file);
  }, [t]);

  const analyzeImage = async (imageBase64: string, width: number, height: number) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('detect-weeds', {
        body: { 
          imageBase64, 
          detectionType: 'image',
          imageWidth: width,
          imageHeight: height,
        },
      });

      if (error) throw error;

      if (data.success) {
        setResult(data.data);
        
        // Save to database
        await supabase.from('detection_results').insert({
          detection_type: 'image',
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
      toast.error(t('error') || 'Failed to analyze image');
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

  const handleNewScan = () => {
    setResult(null);
    setPreview(null);
  };

  const clearPreview = () => {
    setPreview(null);
    setResult(null);
  };

  if (result) {
    return (
      <div className="space-y-4">
        {preview && (
          <Card className="relative overflow-hidden rounded-2xl">
            <div ref={containerRef} className="relative">
              <img 
                src={preview} 
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
              {result.weedsDetected && (
                <BoundingBoxOverlay
                  weeds={result.weeds}
                  containerWidth={containerSize.width}
                  containerHeight={containerSize.height}
                  originalWidth={result.imageWidth || imageNaturalSize.width}
                  originalHeight={result.imageHeight || imageNaturalSize.height}
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
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {!preview ? (
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
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-hero flex items-center justify-center">
              <Upload className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('dragDrop') || 'Drag & drop your image here'}</h3>
            <p className="text-muted-foreground mb-4">{t('or') || 'or'}</p>
            <Button variant="outline" size="lg" className="mb-4 h-12">
              <ImageIcon className="w-5 h-5 mr-2" />
              {t('browseFiles') || 'Browse Files'}
            </Button>
            <p className="text-sm text-muted-foreground">{t('supportedFormats') || 'JPG, PNG, GIF • Max 50MB'}</p>
          </div>
        </Card>
      ) : (
        <Card ref={containerRef} className="relative overflow-hidden rounded-2xl">
          <img src={preview} alt="Preview" className="w-full aspect-video object-cover" />
          
          {isAnalyzing && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="scanning-overlay" />
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
                <p className="text-xl font-bold text-foreground">{t('analyzing') || 'Analyzing...'}</p>
                <p className="text-muted-foreground">{t('aiProcessing') || 'AI is detecting weeds'}</p>
              </div>
            </div>
          )}
          
          {!isAnalyzing && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-3 right-3 h-10 w-10"
              onClick={clearPreview}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
