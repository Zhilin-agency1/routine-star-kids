import { useMemo } from 'react';
import { Trophy, Heart, Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { useWishlist } from '@/hooks/useWishlist';
import { CoinBadge } from '@/components/ui/CoinBadge';
import { Progress } from '@/components/ui/progress';

export const MyRewardsPage = () => {
  const { t, language } = useLanguage();
  const { currentChild, storeItems } = useApp();
  const { wishlistItems, isLoading } = useWishlist(currentChild?.id);

  const wishlistWithItems = useMemo(() => {
    return wishlistItems
      .map(wishItem => {
        const storeItem = storeItems.find(si => si.id === wishItem.store_item_id);
        if (!storeItem) return null;
        
        const remaining = Math.max(0, storeItem.price - (currentChild?.balance || 0));
        const progress = Math.min(100, ((currentChild?.balance || 0) / storeItem.price) * 100);
        
        return {
          ...wishItem,
          storeItem,
          remaining,
          progress,
        };
      })
      .filter(Boolean);
  }, [wishlistItems, storeItems, currentChild?.balance]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {t('my_rewards')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('balance')}</p>
          </div>
        </div>
        
        {currentChild && (
          <div className="text-center py-4">
            <CoinBadge amount={currentChild.balance} size="xl" />
          </div>
        )}
      </div>

      {/* Wishlist Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-bold">
            {t('wishlist')}
          </h2>
        </div>

        {wishlistWithItems.length === 0 ? (
          <div className="text-center py-8 bg-card rounded-2xl">
            <span className="text-4xl block mb-2">💫</span>
            <p className="text-muted-foreground">
              {t('add_from_store')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {wishlistWithItems.map((item) => {
              if (!item) return null;
              const { storeItem, remaining, progress } = item;
              const canAfford = (currentChild?.balance || 0) >= storeItem.price;
              
              return (
                <div 
                  key={item.id} 
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-2xl">
                      {storeItem.image_url || '🎁'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {language === 'ru' ? storeItem.name_ru : storeItem.name_en}
                      </p>
                      <div className="flex items-center gap-2">
                        <CoinBadge amount={storeItem.price} size="sm" />
                      </div>
                    </div>
                    {canAfford && (
                      <div className="text-success text-xs font-medium px-2 py-1 bg-success/10 rounded-full">
                        {t('can_buy')}
                      </div>
                    )}
                  </div>
                  
                  {!canAfford && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {t('remaining')}
                        </span>
                        <CoinBadge amount={remaining} size="xs" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};