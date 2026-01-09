import { useRef, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Image as ImageIcon, Loader2, X } from 'lucide-react';
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

export function ImageUpload() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<DetectionData | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
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

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageBase64 = e.target?.result as string;
      setPreview(imageBase64);
      await analyzeImage(imageBase64);
    };
    reader.readAsDataURL(file);
  }, [t, toast]);

  const analyzeImage = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('detect-weeds', {
        body: { imageBase64, detectionType: 'image' },
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
            <img src={preview} alt="Analyzed" className="w-full aspect-video object-cover" />
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
            isDragging ? 'detection-zone-active border-primary' : 'border-muted-foreground/30'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-hero flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('dragDrop')}</h3>
            <p className="text-muted-foreground mb-4">{t('or')}</p>
            <Button variant="outline" className="mb-4">
              <ImageIcon className="w-4 h-4 mr-2" />
              {t('browseFiles')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('supportedFormats')}</p>
            <p className="text-xs text-muted-foreground">{t('maxSize')}</p>
          </div>
        </Card>
      ) : (
        <Card className="relative overflow-hidden rounded-2xl">
          <img src={preview} alt="Preview" className="w-full aspect-video object-cover" />
          
          {isAnalyzing && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="scanning-overlay" />
                <Loader2 className="w-12 h-12 mx-auto mb-3 text-primary animate-spin" />
                <p className="text-foreground font-medium">{t('analyzing')}</p>
              </div>
            </div>
          )}
          
          {!isAnalyzing && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-3 right-3"
              onClick={clearPreview}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
