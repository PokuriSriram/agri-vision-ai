import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, AlertTriangle, Trash2, Camera, Image, Video, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface DetectionRecord {
  id: string;
  detection_type: string;
  weeds_detected: boolean;
  weed_count: number;
  weed_details: Json;
  confidence_score: number | null;
  processing_time_ms: number | null;
  created_at: string;
}

export function DetectionHistory() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [records, setRecords] = useState<DetectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('detection_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      toast({
        title: t('error'),
        description: 'Failed to load detection history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'live_feed':
        return Camera;
      case 'video':
        return Video;
      default:
        return Image;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="glass-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
          <Image className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t('noHistory')}</h3>
        <p className="text-muted-foreground text-sm">
          Start scanning to see your detection history here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('recentScans')}</h2>
        <span className="text-sm text-muted-foreground">{records.length} records</span>
      </div>

      <div className="space-y-3">
        {records.map((record, i) => {
          const TypeIcon = getTypeIcon(record.detection_type);
          return (
            <Card
              key={record.id}
              className="glass-card p-4 animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  record.weeds_detected ? 'bg-destructive/10' : 'bg-success/10'
                }`}>
                  {record.weeds_detected ? (
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold ${record.weeds_detected ? 'text-destructive' : 'text-success'}`}>
                      {record.weeds_detected ? t('weedsDetected') : t('noWeedsDetected')}
                    </span>
                    {record.weeds_detected && (
                      <span className="text-sm text-muted-foreground">
                        ({record.weed_count} found)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TypeIcon className="w-3 h-3" />
                      {record.detection_type.replace('_', ' ')}
                    </span>
                    {record.confidence_score && (
                      <span>{Math.round(record.confidence_score * 100)}% confidence</span>
                    )}
                    {record.processing_time_ms && (
                      <span>{record.processing_time_ms}ms</span>
                    )}
                  </div>
                </div>
                
                <div className="text-right text-xs text-muted-foreground">
                  {format(new Date(record.created_at), 'MMM d, yyyy')}
                  <br />
                  {format(new Date(record.created_at), 'h:mm a')}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
