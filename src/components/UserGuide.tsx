import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Upload, Cpu, Sparkles, Play, CheckCircle } from 'lucide-react';

interface UserGuideProps {
  onBack: () => void;
}

export function UserGuide({ onBack }: UserGuideProps) {
  const { t } = useLanguage();

  const steps = [
    {
      icon: Camera,
      title: t('guideStep1Title'),
      description: t('guideStep1Desc'),
      color: 'bg-primary',
    },
    {
      icon: Upload,
      title: t('guideStep2Title'),
      description: t('guideStep2Desc'),
      color: 'bg-secondary',
    },
    {
      icon: Cpu,
      title: t('guideStep3Title'),
      description: t('guideStep3Desc'),
      color: 'bg-accent',
    },
    {
      icon: Sparkles,
      title: t('guideStep4Title'),
      description: t('guideStep4Desc'),
      color: 'bg-success',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('back')}
        </Button>
        <h2 className="text-xl font-bold">{t('guideTitle')}</h2>
      </div>

      {/* Steps */}
      <div className="grid gap-4">
        {steps.map((step, index) => (
          <Card key={index} className="glass-card p-6 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center flex-shrink-0`}>
                <step.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Step {index + 1}
                  </span>
                  <CheckCircle className="w-4 h-4 text-success" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="absolute left-10 bottom-0 w-0.5 h-4 bg-muted-foreground/20 translate-y-full" />
            )}
          </Card>
        ))}
      </div>

      {/* Demo Video Section */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          {t('watchDemo')}
        </h3>
        <div className="aspect-video bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
          <div className="text-center z-10">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 cursor-pointer hover:bg-primary/30 transition-colors">
              <Play className="w-8 h-8 text-primary ml-1" />
            </div>
            <p className="text-muted-foreground text-sm">Click to watch demo</p>
          </div>
        </div>
      </Card>

      {/* Quick Tips */}
      <Card className="glass-card p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <h3 className="text-lg font-semibold mb-4">Quick Tips</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">1</span>
            <span className="text-sm text-muted-foreground">Ensure good lighting for better detection accuracy</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">2</span>
            <span className="text-sm text-muted-foreground">Hold camera steady and capture from top-down angle</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">3</span>
            <span className="text-sm text-muted-foreground">Include both weeds and crops in frame for comparison</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">4</span>
            <span className="text-sm text-muted-foreground">Use the chatbot for any questions about weed management</span>
          </li>
        </ul>
      </Card>

      <Button onClick={onBack} className="w-full bg-gradient-hero">
        {t('getStarted')}
      </Button>
    </div>
  );
}
