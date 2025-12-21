import { Plus, Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Button } from '@/components/ui/button';

export const ParentStorePage = () => {
  const { t, language } = useLanguage();
  const { storeItems } = useApp();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav_store')}</h1>
        <Button size="sm" className="rounded-xl">
          <Plus className="w-4 h-4 mr-1" />
          {t('add_store_item')}
        </Button>
      </div>

      {/* Store Items */}
      <div className="space-y-3">
        {storeItems.map((item, index) => (
          <div 
            key={item.id}
            className="bg-card rounded-2xl p-4 shadow-card interactive-card animate-fade-in-up flex items-center gap-4"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Icon */}
            <div className="text-4xl flex-shrink-0">{item.image_url || '🎁'}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold">{language === 'ru' ? item.name_ru : item.name_en}</h3>
              <CoinBadge amount={item.price} size="sm" />
            </div>

            {/* Status */}
            <span className={`text-xs px-2 py-1 rounded-full ${
              item.active 
                ? 'bg-success/20 text-success' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {item.active ? 'Активен' : 'Скрыт'}
            </span>

            {/* Actions */}
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
