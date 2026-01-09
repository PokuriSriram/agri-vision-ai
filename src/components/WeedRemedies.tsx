import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Hand, Beaker, Layers, RefreshCw } from 'lucide-react';

interface WeedRemediesProps {
  weedTypes?: string[];
}

export function WeedRemedies({ weedTypes = [] }: WeedRemediesProps) {
  const { t } = useLanguage();

  const remedies = [
    {
      icon: Hand,
      title: t('remedyManual'),
      description: t('remedyManualDesc'),
      color: 'bg-success',
    },
    {
      icon: Beaker,
      title: t('remedyHerbicide'),
      description: t('remedyHerbicideDesc'),
      color: 'bg-amber-500',
    },
    {
      icon: Layers,
      title: t('remedyMulching'),
      description: t('remedyMulchingDesc'),
      color: 'bg-secondary',
    },
    {
      icon: RefreshCw,
      title: t('remedyCropRotation'),
      description: t('remedyCropRotationDesc'),
      color: 'bg-primary',
    },
  ];

  return (
    <Card className="p-4 glass-card">
      <h4 className="font-semibold mb-4 text-lg">{t('remedies')}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {remedies.map((remedy, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg ${remedy.color} flex items-center justify-center flex-shrink-0`}>
              <remedy.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h5 className="font-medium text-sm">{remedy.title}</h5>
              <p className="text-xs text-muted-foreground mt-0.5">{remedy.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
