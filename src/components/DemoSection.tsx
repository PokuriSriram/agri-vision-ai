import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, CheckCircle2, Target, Zap, Smartphone } from 'lucide-react';

export function DemoSection() {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: t('demoStep1Title') || 'Point Camera at Field',
      description: t('demoStep1Desc') || 'Use your phone or device camera to capture the crop area',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: t('demoStep2Title') || 'AI Scans for Weeds',
      description: t('demoStep2Desc') || 'Advanced neural network analyzes the image in real-time',
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: t('demoStep3Title') || 'Red Boxes Mark Weeds',
      description: t('demoStep3Desc') || 'Each weed is highlighted with a red bounding box',
    },
    {
      icon: <CheckCircle2 className="w-8 h-8" />,
      title: t('demoStep4Title') || 'Get Treatment Advice',
      description: t('demoStep4Desc') || 'Receive specific remedies for each weed type detected',
    },
  ];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % steps.length);
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, steps.length]);

  return (
    <Card className="glass-card p-6 md:p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          {t('howItWorks') || 'How It Works'}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('howItWorksDesc') || 'See how AgriScan AI detects weeds in your field with just a few simple steps'}
        </p>
      </div>

      {/* Demo Video Area */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl overflow-hidden mb-8">
        {/* Simulated Demo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* Field background simulation */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/40 to-green-800/40" />
            
            {/* Animated scanning effect */}
            {isPlaying && (
              <div className="absolute inset-0">
                <div className="scanning-line" />
                
                {/* Simulated weed detections */}
                <div className="absolute top-[20%] left-[25%] animate-pulse">
                  <div className="w-20 h-20 border-4 border-red-500 rounded-sm relative">
                    <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded-t font-bold">
                      🌿 Crabgrass 94%
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-[50%] right-[30%] animate-pulse" style={{ animationDelay: '0.5s' }}>
                  <div className="w-16 h-16 border-4 border-red-500 rounded-sm relative">
                    <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded-t font-bold">
                      🌿 Pigweed 89%
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-[25%] left-[45%] animate-pulse" style={{ animationDelay: '1s' }}>
                  <div className="w-14 h-14 border-4 border-red-500 rounded-sm relative">
                    <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded-t font-bold whitespace-nowrap">
                      🌿 Dandelion 92%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {!isPlaying && (
                <div className="text-center text-white">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => setIsPlaying(true)}
                  >
                    <Play className="w-10 h-10 text-white ml-1" />
                  </div>
                  <p className="text-lg font-medium">{t('watchDemo') || 'Watch Demo'}</p>
                </div>
              )}
            </div>

            {/* Status overlay */}
            {isPlaying && (
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">AI Scanning...</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white border-0"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white border-0"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl text-center transition-all duration-300 cursor-pointer ${
              currentStep === index
                ? 'bg-primary/20 ring-2 ring-primary scale-105'
                : 'bg-muted/50 hover:bg-muted'
            }`}
            onClick={() => setCurrentStep(index)}
          >
            <div className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center transition-colors ${
              currentStep === index ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
            }`}>
              {step.icon}
            </div>
            <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {steps.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              currentStep === index ? 'bg-primary w-6' : 'bg-muted-foreground/30'
            }`}
            onClick={() => setCurrentStep(index)}
          />
        ))}
      </div>
    </Card>
  );
}
