import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, ArrowLeft, Copy, Check, ExternalLink, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LiveCameraFeed } from './LiveCameraFeed';

interface MobileCameraConnectionProps {
  onBack: () => void;
}

export function MobileCameraConnection({ onBack }: MobileCameraConnectionProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    // Check if user is on mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
      
      // If on mobile, automatically show camera
      if (isMobileDevice) {
        setShowCamera(true);
      }
    };
    checkMobile();
  }, []);

  const mobileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}?mode=mobile-camera`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      toast.success(t('linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenInMobile = () => {
    window.open(mobileUrl, '_blank');
  };

  // If on mobile, show camera directly
  if (isMobile || showCamera) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('back')}
          </Button>
          <h2 className="text-xl font-bold">{t('mobileCamera')}</h2>
        </div>
        <LiveCameraFeed />
      </div>
    );
  }

  return (
    <Card className="glass-card p-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('back')}
        </Button>
      </div>

      <div className="text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-wheat flex items-center justify-center">
          <Smartphone className="w-10 h-10 text-secondary-foreground" />
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-2">{t('mobileCamera')}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t('mobileCameraDesc')}
          </p>
        </div>

        {/* QR Code Placeholder - Using a simple visual representation */}
        <div className="p-6 bg-white rounded-xl inline-block shadow-lg">
          <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
            <div className="text-center">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{t('scanQRCode')}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={handleCopyLink} 
            variant="outline"
            className="flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {t('copyLink')}
          </Button>
          <Button 
            onClick={handleOpenInMobile}
            className="bg-gradient-hero flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            {t('openInMobile')}
          </Button>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('waitingForConnection')}
          </p>
        </div>

        {/* Direct camera option */}
        <div className="pt-4 border-t">
          <Button 
            onClick={() => setShowCamera(true)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {t('startCamera')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
