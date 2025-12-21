import { Plus, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Button } from '@/components/ui/button';

export const ChildrenPage = () => {
  const { t } = useLanguage();
  const { children } = useApp();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav_children')}</h1>
        <Button size="sm" className="rounded-xl">
          <Plus className="w-4 h-4 mr-1" />
          {t('add_child')}
        </Button>
      </div>

      {/* Children List */}
      <div className="space-y-4">
        {children.map((child, index) => (
          <div 
            key={child.id}
            className="bg-card rounded-2xl p-5 shadow-card interactive-card animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-4">
              <ChildAvatar avatar={child.avatar_url || '🦁'} size="xl" />
              
              <div className="flex-1">
                <h3 className="text-xl font-bold">{child.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <CoinBadge amount={child.balance} size="md" />
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {child.language_preference === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}
                  </span>
                </div>
              </div>

              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
