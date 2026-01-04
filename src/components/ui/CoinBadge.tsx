import { cn } from "@/lib/utils";
import groweeCoins from "@/assets/growee-coins.png";

interface CoinBadgeProps {
  amount: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showPlus?: boolean;
  className?: string;
  animate?: boolean;
}

export const CoinBadge = ({ 
  amount, 
  size = 'md', 
  showPlus = false,
  className,
  animate = false
}: CoinBadgeProps) => {
  const sizeClasses = {
    xs: 'text-sm px-2 py-1 gap-1',
    sm: 'text-base px-3 py-1.5 gap-1.5',
    md: 'text-lg px-4 py-2 gap-2',
    lg: 'text-2xl px-5 py-2.5 gap-2.5',
    xl: 'text-4xl px-6 py-3 gap-3',
  };

  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full bg-accent/40 text-foreground font-bold",
        sizeClasses[size],
        animate && "animate-bounce-in",
        className
      )}
    >
      <img 
        src={groweeCoins} 
        alt="coins" 
        className={cn(
          iconSizes[size], 
          "object-contain",
          animate && "animate-coin-spin animate-coin-glow"
        )}
      />
      <span>{showPlus && amount > 0 ? '+' : ''}{amount}</span>
    </div>
  );
};
