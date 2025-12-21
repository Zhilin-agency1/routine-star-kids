import { ShoppingCart, Lock, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp, StoreItem } from '@/contexts/AppContext';
import { useWishlist } from '@/hooks/useWishlist';
import { CoinBadge } from './ui/CoinBadge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { toast } from '@/hooks/use-toast';

interface StoreCardProps {
  item: StoreItem;
  onPurchase?: () => void;
}

export const StoreCard = ({ item, onPurchase }: StoreCardProps) => {
  const { language, t } = useLanguage();
  const { currentChild, purchaseItem } = useApp();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist(currentChild?.id);

  const name = language === 'ru' ? item.name_ru : item.name_en;
  const balance = currentChild?.balance || 0;
  const canAfford = balance >= item.price;
  const progress = Math.min((balance / item.price) * 100, 100);
  const coinsNeeded = item.price - balance;
  const inWishlist = isInWishlist(item.id);

  const handlePurchase = () => {
    if (canAfford) {
      purchaseItem(item.id);
      onPurchase?.();
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentChild) {
      toast({
        title: language === 'ru' ? 'Ошибка' : 'Error',
        description: language === 'ru' ? 'Выберите ребёнка' : 'Select a child',
        variant: 'destructive',
      });
      return;
    }
    
    if (inWishlist) {
      removeFromWishlist.mutate(
        { childId: currentChild.id, storeItemId: item.id },
        {
          onSuccess: () => {
            toast({
              title: language === 'ru' ? 'Удалено' : 'Removed',
              description: language === 'ru' ? `${name} удалён из списка желаний` : `${name} removed from wishlist`,
            });
          },
        }
      );
    } else {
      addToWishlist.mutate(
        { childId: currentChild.id, storeItemId: item.id },
        {
          onSuccess: () => {
            toast({
              title: language === 'ru' ? 'Добавлено!' : 'Added!',
              description: language === 'ru' ? `${name} добавлен в список желаний` : `${name} added to wishlist`,
            });
          },
        }
      );
    }
  };

  return (
    <div 
      className={cn(
        "bg-card rounded-2xl p-4 shadow-card interactive-card border-2 relative",
        canAfford ? "border-success/30" : "border-transparent"
      )}
    >
      {/* Wishlist Button */}
      <button
        onClick={handleWishlistToggle}
        className={cn(
          "absolute top-3 right-3 p-2 rounded-full transition-all",
          inWishlist 
            ? "bg-destructive/10 text-destructive" 
            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Heart 
          className={cn("w-5 h-5", inWishlist && "fill-current")} 
        />
      </button>

      {/* Image/Icon */}
      <div className="text-5xl text-center mb-3 animate-float">
        {item.image_url || '🎁'}
      </div>

      {/* Name */}
      <h3 className="font-bold text-center text-lg mb-2">{name}</h3>

      {/* Price */}
      <div className="flex justify-center mb-3">
        <CoinBadge amount={item.price} size="md" />
      </div>

      {/* Progress to purchase */}
      {!canAfford && (
        <div className="mb-3">
          <Progress value={progress} className="h-2 mb-1" />
          <p className="text-xs text-center text-muted-foreground">
            {coinsNeeded} {t('coins_to_go')}
          </p>
        </div>
      )}

      {/* Buy Button */}
      <Button
        onClick={handlePurchase}
        disabled={!canAfford}
        className={cn(
          "w-full rounded-xl font-bold transition-all",
          canAfford 
            ? "bg-success hover:bg-success/90 text-success-foreground" 
            : "bg-muted text-muted-foreground"
        )}
      >
        {canAfford ? (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t('buy')}
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            {t('not_enough')}
          </>
        )}
      </Button>
    </div>
  );
};
