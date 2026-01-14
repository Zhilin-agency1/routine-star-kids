import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

// Predefined color palette
const COLOR_PALETTE = [
  // Blues
  '#3B82F6', '#2563EB', '#1D4ED8', '#60A5FA',
  // Greens
  '#22C55E', '#16A34A', '#10B981', '#34D399',
  // Purples
  '#8B5CF6', '#7C3AED', '#A855F7', '#C084FC',
  // Pinks/Reds
  '#EC4899', '#F472B6', '#EF4444', '#F87171',
  // Oranges/Yellows
  '#F97316', '#FB923C', '#EAB308', '#FACC15',
  // Teals/Cyans
  '#14B8A6', '#06B6D4', '#0891B2', '#22D3EE',
  // Grays
  '#6B7280', '#9CA3AF', '#4B5563', '#374151',
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export const ColorPicker = ({ color, onChange, className }: ColorPickerProps) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState(color);

  const handleColorSelect = (selectedColor: string) => {
    onChange(selectedColor);
    setCustomColor(selectedColor);
    setOpen(false);
  };

  const handleCustomColorChange = (value: string) => {
    setCustomColor(value);
    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onChange(value);
    }
  };

  const t = {
    customColor: language === 'ru' ? 'Свой цвет' : 'Custom color',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-10 h-10 rounded-xl p-1 border-2",
            className
          )}
          style={{ borderColor: color }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{ backgroundColor: color }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          {/* Color grid */}
          <div className="grid grid-cols-8 gap-1.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleColorSelect(c)}
                className={cn(
                  "w-6 h-6 rounded-md border-2 transition-all hover:scale-110",
                  color === c ? "border-foreground" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <Check className="w-3 h-3 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>

          {/* Custom color input */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-md border"
              style={{ backgroundColor: customColor }}
            />
            <Input
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              placeholder="#3B82F6"
              className="flex-1 h-8 text-sm"
              maxLength={7}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
