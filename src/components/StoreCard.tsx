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
        title: t('error'),
        description: t('select_child'),
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
              title: t('removed'),
              description: `${name} ${t('removed_from_wishlist')}`,
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
              title: t('added'),
              description: `${name} ${t('added_to_wishlist')}`,
            });
          },
        }
      );
    }
  };

  return (
    <div 
      className={cn(
        "bg-card rounded-3xl p-5 shadow-card interactive-card border-2 relative",
        canAfford ? "border-success/30" : "border-transparent"
      )}
    >
      {/* Image/Icon */}
      <div className="text-6xl text-center mb-4 animate-float">
        {item.image_url || '🎁'}
      </div>

      {/* Wishlist Button - positioned after image for proper z-index stacking */}
      <button
        onClick={handleWishlistToggle}
        className={cn(
          "absolute top-4 right-4 z-10 p-3 rounded-full transition-all active:scale-90",
          inWishlist 
            ? "bg-destructive/15 text-destructive shadow-md" 
            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Heart 
          className={cn("w-6 h-6 transition-transform", inWishlist && "fill-current scale-110")} 
        />
      </button>

      {/* Name */}
      <h3 className="font-bold text-center text-xl mb-3">{name}</h3>

      {/* Price */}
      <div className="flex justify-center mb-4">
        <CoinBadge amount={item.price} size="lg" />
      </div>

      {/* Progress to purchase */}
      {!canAfford && (
        <div className="mb-4">
          <Progress value={progress} className="h-3 mb-2" />
          <p className="text-sm text-center text-muted-foreground font-medium">
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
            <ShoppingCart className="w-5 h-5 mr-2" />
            {t('buy')}
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            {t('save_coins')}
          </>
        )}
      </Button>
    </div>
  );
};