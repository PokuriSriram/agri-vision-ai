import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle2, AlertTriangle, Clock, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WeedRemedies } from './WeedRemedies';

interface WeedInfo {
  type: string;
  location: string;
  confidence: number;
}

interface DetectionResultProps {
  weedsDetected: boolean;
  weedCount: number;
  overallConfidence: number;
  weeds: WeedInfo[];
  summary: string;
  processingTimeMs: number;
  onNewScan: () => void;
  onSave?: () => void;
}

export function DetectionResult({
  weedsDetected,
  weedCount,
  overallConfidence,
  weeds,
  summary,
  processingTimeMs,
  onNewScan,
  onSave,
}: DetectionResultProps) {
  const { t } = useLanguage();

  return (
    <div className="animate-scale-in space-y-4">
      {/* Main Result Card */}
      <Card className={`p-6 ${weedsDetected ? 'border-destructive/50 bg-destructive/5' : 'border-success/50 bg-success/5'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${weedsDetected ? 'bg-destructive' : 'bg-success'}`}>
            {weedsDetected ? (
              <AlertTriangle className="w-8 h-8 text-destructive-foreground" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-success-foreground" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">
              {weedsDetected ? t('weedsDetected') : t('noWeedsDetected')}
            </h3>
            <p className="text-muted-foreground">{summary}</p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center glass-card">
          <Target className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{weedCount}</p>
          <p className="text-xs text-muted-foreground">{t('weedCount')}</p>
        </Card>
        <Card className="p-4 text-center glass-card">
          <div className="w-5 h-5 mx-auto mb-2 rounded-full bg-gradient-hero" />
          <p className="text-2xl font-bold">{overallConfidence}%</p>
          <p className="text-xs text-muted-foreground">{t('confidence')}</p>
        </Card>
        <Card className="p-4 text-center glass-card col-span-2 md:col-span-2">
          <Clock className="w-5 h-5 mx-auto mb-2 text-secondary" />
          <p className="text-2xl font-bold">{processingTimeMs}ms</p>
          <p className="text-xs text-muted-foreground">{t('processingTime')}</p>
        </Card>
      </div>

      {/* Weed Details */}
      {weedsDetected && weeds.length > 0 && (
        <Card className="p-4 glass-card">
          <h4 className="font-semibold mb-3">Detected Weeds</h4>
          <div className="space-y-2">
            {weeds.map((weed, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <div>
                    <p className="font-medium">{weed.type}</p>
                    <p className="text-xs text-muted-foreground">{t('location')}: {weed.location}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {weed.confidence}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Remedies - show only when weeds detected */}
      {weedsDetected && (
        <WeedRemedies weedTypes={weeds.map(w => w.type)} />
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onNewScan} className="flex-1 bg-gradient-hero">
          {t('newScan')}
        </Button>
        {onSave && (
          <Button onClick={onSave} variant="outline" className="flex-1">
            {t('saveResult')}
          </Button>
        )}
      </div>
    </div>
  );
}

