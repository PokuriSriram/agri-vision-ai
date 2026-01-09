import { useState } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { LiveCameraFeed } from '@/components/LiveCameraFeed';
import { ImageUpload } from '@/components/ImageUpload';
import { VideoUpload } from '@/components/VideoUpload';
import { DetectionHistory } from '@/components/DetectionHistory';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Smartphone, QrCode, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function MobileCameraSection({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  return (
    <Card className="glass-card p-8 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-wheat flex items-center justify-center">
        <QrCode className="w-10 h-10 text-secondary-foreground" />
      </div>
      <h3 className="text-xl font-bold mb-2">{t('mobileCamera')}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {t('mobileCameraDesc')}
      </p>
      <div className="p-6 bg-muted rounded-xl inline-block mb-6">
        <Smartphone className="w-24 h-24 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground mt-2">Coming Soon</p>
      </div>
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('back')}
      </Button>
    </Card>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const { t } = useLanguage();

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HeroSection onModeSelect={setActiveTab} />;
      case 'live':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('home')}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t('back')}
              </Button>
              <h2 className="text-xl font-bold">{t('liveFeed')}</h2>
            </div>
            <LiveCameraFeed />
          </div>
        );
      case 'image':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('home')}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t('back')}
              </Button>
              <h2 className="text-xl font-bold">{t('imageUpload')}</h2>
            </div>
            <ImageUpload />
          </div>
        );
      case 'video':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('home')}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t('back')}
              </Button>
              <h2 className="text-xl font-bold">{t('videoUpload')}</h2>
            </div>
            <VideoUpload />
          </div>
        );
      case 'mobile':
        return <MobileCameraSection onBack={() => setActiveTab('home')} />;
      case 'history':
        return <DetectionHistory />;
      default:
        return <HeroSection onModeSelect={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-earth">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {renderContent()}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>{t('madeFor')} 🌾</p>
      </footer>
    </div>
  );
}

export default function Index() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
