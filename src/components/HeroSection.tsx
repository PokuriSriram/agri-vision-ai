import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Image, Video, Smartphone, ArrowRight, Leaf, Zap, Shield } from 'lucide-react';

interface HeroSectionProps {
  onModeSelect: (mode: string) => void;
}

export function HeroSection({ onModeSelect }: HeroSectionProps) {
  const { t } = useLanguage();

  const modes = [
    {
      id: 'live',
      icon: Camera,
      title: t('liveFeed'),
      description: t('liveFeedDesc'),
      gradient: 'bg-gradient-hero',
    },
    {
      id: 'image',
      icon: Image,
      title: t('imageUpload'),
      description: t('imageUploadDesc'),
      gradient: 'bg-gradient-wheat',
    },
    {
      id: 'video',
      icon: Video,
      title: t('videoUpload'),
      description: t('videoUploadDesc'),
      gradient: 'from-accent to-primary bg-gradient-to-br',
    },
    {
      id: 'mobile',
      icon: Smartphone,
      title: t('mobileCamera'),
      description: t('mobileCameraDesc'),
      gradient: 'from-secondary to-warning bg-gradient-to-br',
    },
  ];

  const features = [
    { icon: Zap, title: 'Real-time Detection', desc: 'Instant AI analysis' },
    { icon: Shield, title: 'High Accuracy', desc: '95%+ detection rate' },
    { icon: Leaf, title: 'Multiple Weeds', desc: 'Identifies 100+ species' },
  ];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center py-8 md:py-16 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
          <Leaf className="w-4 h-4" />
          <span className="text-sm font-medium">{t('poweredBy')}</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="text-gradient-hero">{t('heroTitle')}</span>
          <br />
          <span className="text-foreground">{t('heroSubtitle')}</span>
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          {t('heroDescription')}
        </p>

        {/* Quick Stats */}
        <div className="flex justify-center gap-8 mb-12">
          {features.map((feature, i) => (
            <div key={i} className="text-center animate-slide-in-right" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-hero flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="font-semibold text-sm">{feature.title}</p>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detection Modes */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-6">{t('selectMode')}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {modes.map((mode, i) => (
            <Card
              key={mode.id}
              className="group glass-card p-6 cursor-pointer hover:shadow-elevated transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${i * 100}ms` }}
              onClick={() => onModeSelect(mode.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl ${mode.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <mode.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                    {mode.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{mode.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Farmer Tools */}
      <div>
        <h2 className="text-2xl font-bold text-center mb-6">{t('farmerTools') || 'Farmer Tools'}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card
            className="group glass-card p-6 cursor-pointer hover:shadow-elevated transition-all duration-300"
            onClick={() => onModeSelect('dashboard')}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                  {t('dashboard') || 'Dashboard'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('dashboardCardDesc') || 'One place for scanning, planner, and schemes'}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Card>

          <Card
            className="group glass-card p-6 cursor-pointer hover:shadow-elevated transition-all duration-300"
            onClick={() => onModeSelect('planner')}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-wheat flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Leaf className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                  {t('planner') || 'Planner'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('plannerCardDesc') || 'Set plant spacing and export robot instructions'}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Card>

          <Card
            className="group glass-card p-6 cursor-pointer hover:shadow-elevated transition-all duration-300"
            onClick={() => onModeSelect('schemes')}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl from-secondary to-warning bg-gradient-to-br flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                  {t('schemes') || 'Schemes'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('schemesCardDesc') || 'Government schemes and how to apply'}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
