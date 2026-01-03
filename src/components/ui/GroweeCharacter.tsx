import { cn } from "@/lib/utils";

interface GroweeCharacterProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'calm' | 'happy' | 'encouraging';
  className?: string;
  animate?: boolean;
}

export const GroweeCharacter = ({ 
  size = 'md', 
  mood = 'calm',
  className,
  animate = false
}: GroweeCharacterProps) => {
  const sizeClasses = {
    xs: 'w-8 h-10',
    sm: 'w-12 h-15',
    md: 'w-16 h-20',
    lg: 'w-24 h-30',
    xl: 'w-32 h-40',
  };

  const eyePositions = {
    xs: { y: 3.5, size: 1.2, gap: 2 },
    sm: { y: 5, size: 1.8, gap: 3 },
    md: { y: 7, size: 2.5, gap: 4 },
    lg: { y: 10, size: 3.5, gap: 6 },
    xl: { y: 14, size: 4.5, gap: 8 },
  };

  const smileWidth = {
    xs: 3,
    sm: 4.5,
    md: 6,
    lg: 9,
    xl: 12,
  };

  const sproutSize = {
    xs: { height: 4, leafSize: 2 },
    sm: { height: 6, leafSize: 3 },
    md: { height: 8, leafSize: 4 },
    lg: { height: 12, leafSize: 6 },
    xl: { height: 16, leafSize: 8 },
  };

  const eyePos = eyePositions[size];
  const smile = smileWidth[size];
  const sprout = sproutSize[size];

  // Smile curve based on mood
  const smileCurve = mood === 'happy' ? 2 : mood === 'encouraging' ? 1.5 : 1;

  return (
    <div className={cn(
      "relative inline-flex items-center justify-center",
      sizeClasses[size],
      animate && "animate-float",
      className
    )}>
      <svg 
        viewBox="0 0 32 40" 
        fill="none" 
        className="w-full h-full"
        aria-label="Growee character"
      >
        {/* Body - soft oval, slightly taller than wide */}
        <ellipse 
          cx="16" 
          cy="24" 
          rx="12" 
          ry="14" 
          className="fill-primary"
        />
        
        {/* Left eye */}
        <circle 
          cx={16 - eyePos.gap} 
          cy={24 - eyePos.y} 
          r={eyePos.size} 
          className="fill-secondary"
        />
        
        {/* Right eye */}
        <circle 
          cx={16 + eyePos.gap} 
          cy={24 - eyePos.y} 
          r={eyePos.size} 
          className="fill-secondary"
        />
        
        {/* Small calm smile */}
        <path 
          d={`M ${16 - smile/2} ${24 - eyePos.y + eyePos.size * 3} Q 16 ${24 - eyePos.y + eyePos.size * 3 + smileCurve * 2} ${16 + smile/2} ${24 - eyePos.y + eyePos.size * 3}`}
          stroke="hsl(var(--secondary))"
          strokeWidth={size === 'xs' ? 0.8 : size === 'sm' ? 1 : 1.5}
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Sprout stem */}
        <line 
          x1="16" 
          y1="10" 
          x2="16" 
          y2={10 - sprout.height}
          stroke="hsl(var(--accent))"
          strokeWidth={size === 'xs' ? 1 : size === 'sm' ? 1.5 : 2}
          strokeLinecap="round"
        />
        
        {/* Sprout leaf */}
        <ellipse 
          cx={16 + sprout.leafSize * 0.8} 
          cy={10 - sprout.height + 1} 
          rx={sprout.leafSize} 
          ry={sprout.leafSize * 0.6}
          className="fill-accent"
          transform={`rotate(-30 ${16 + sprout.leafSize * 0.8} ${10 - sprout.height + 1})`}
        />
      </svg>
    </div>
  );
};
