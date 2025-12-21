import { ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { StoreCard } from '@/components/StoreCard';
import { CoinBadge } from '@/components/ui/CoinBadge';

export const StorePage = () => {
  const { t } = useLanguage();
  const { storeItems, currentChild } = useApp();

  const activeItems = storeItems.filter(item => item.active);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('store_title')}</h1>
            <p className="text-sm text-muted-foreground">{t('balance')}:</p>
          </div>
        </div>
        {currentChild && (
          <CoinBadge amount={currentChild.balance} size="lg" />
        )}
      </div>

      {/* Store Grid */}
      <div className="grid grid-cols-2 gap-4">
        {activeItems.map((item, index) => (
          <div 
            key={item.id} 
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <StoreCard item={item} />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {activeItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <p className="text-muted-foreground">Магазин пуст</p>
        </div>
      )}
    </div>
  );
};
