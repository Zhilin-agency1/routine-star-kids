import { cn } from "@/lib/utils";
import groweeImage from "@/assets/growee-character.png";

interface GroweeCharacterProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

export const GroweeCharacter = ({ 
  size = 'md', 
  className,
  animate = false
}: GroweeCharacterProps) => {
  const sizeClasses = {
    xs: 'w-10 h-12',
    sm: 'w-14 h-16',
    md: 'w-24 h-28',
    lg: 'w-32 h-36',
    xl: 'w-40 h-44',
  };

  return (
    <div className={cn(
      "relative inline-flex items-center justify-center",
      sizeClasses[size],
      animate && "animate-float",
      className
    )}>
      <img 
        src={groweeImage} 
        alt="Growee" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};
