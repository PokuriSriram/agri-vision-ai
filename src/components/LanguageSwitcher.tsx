import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-switcher">
      <Globe className="w-4 h-4 text-muted-foreground ml-2" />
      <Button
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('en')}
        className="rounded-full h-8 px-3 text-sm font-medium"
      >
        EN
      </Button>
      <Button
        variant={language === 'hi' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('hi')}
        className="rounded-full h-8 px-3 text-sm font-medium"
      >
        हिंदी
      </Button>
    </div>
  );
}
