import { useState, useEffect } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { LiveCameraFeed } from '@/components/LiveCameraFeed';
import { ImageUpload } from '@/components/ImageUpload';
import { VideoUpload } from '@/components/VideoUpload';
import { DetectionHistory } from '@/components/DetectionHistory';
import { MobileCameraConnection } from '@/components/MobileCameraConnection';
import { UserGuide } from '@/components/UserGuide';
import { Chatbot } from '@/components/Chatbot';
import { DemoSection } from '@/components/DemoSection';
import { SmartPlantingPlanner } from '@/components/SmartPlantingPlanner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');
  const { t } = useLanguage();

  // Check URL params for mobile camera mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'mobile-camera') {
      setActiveTab('mobile');
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8">
            <HeroSection onModeSelect={setActiveTab} />
            <DemoSection />
          </div>
        );
      case 'live':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="lg" onClick={() => setActiveTab('home')} className="h-12">
                <ArrowLeft className="w-5 h-5 mr-1" />
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
              <Button variant="ghost" size="lg" onClick={() => setActiveTab('home')} className="h-12">
                <ArrowLeft className="w-5 h-5 mr-1" />
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
              <Button variant="ghost" size="lg" onClick={() => setActiveTab('home')} className="h-12">
                <ArrowLeft className="w-5 h-5 mr-1" />
                {t('back')}
              </Button>
              <h2 className="text-xl font-bold">{t('videoUpload')}</h2>
            </div>
            <VideoUpload />
          </div>
        );
      case 'mobile':
        return <MobileCameraConnection onBack={() => setActiveTab('home')} />;
      case 'guide':
        return <UserGuide onBack={() => setActiveTab('home')} />;
      case 'planner':
        return <SmartPlantingPlanner onBack={() => setActiveTab('home')} />;
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
      <Chatbot />
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
