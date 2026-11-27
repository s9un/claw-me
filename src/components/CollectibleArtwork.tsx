import { Sparkles, Zap } from 'lucide-react';
import { TIER_CONFIG, type CollectibleItem } from '../data/collectibles';

interface CollectibleArtworkProps {
  item: CollectibleItem;
  silhouette?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CollectibleArtwork({
  item,
  silhouette = false,
  size = 'md',
}: CollectibleArtworkProps) {
  const cfg = TIER_CONFIG[item.tier];

  const sizeClasses = {
    sm: 'h-16 w-16 text-3xl rounded-xl',
    md: 'h-24 w-24 text-5xl rounded-2xl',
    lg: 'h-32 w-32 text-6xl rounded-3xl',
  }[size];

  if (silhouette) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden border border-white/10 bg-slate-900/90 ${sizeClasses}`}
      >
        <span className="select-none brightness-0 contrast-200 opacity-25">{item.emoji}</span>
        <span className="absolute bottom-1 right-1.5 text-[10px] font-bold text-slate-500">?</span>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${cfg.frameClass} ${sizeClasses}`}>
      {/* Tier SS Futuristic Grid Overlay */}
      {item.tier === 'SS' && (
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(to right, #facc15 1px, transparent 1px), linear-gradient(to bottom, #facc15 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        />
      )}

      {/* Tier SSR Sparkling Diamond Shimmer */}
      {item.tier === 'SSR' && (
        <>
          <div className="pointer-events-none absolute -inset-2 animate-pulse bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.45),transparent_55%)]" />
          <Sparkles className="pointer-events-none absolute right-1.5 top-1.5 h-3.5 w-3.5 animate-pulse text-cyan-200" />
        </>
      )}

      {item.tier === 'SS' && (
        <Zap className="pointer-events-none absolute right-1.5 top-1.5 h-3.5 w-3.5 text-yellow-300" />
      )}

      {item.kind === 'letter' ? (
        <span className="font-display relative z-10 bg-gradient-to-b from-cyan-200 to-sky-400 bg-clip-text font-extrabold text-transparent drop-shadow">
          {item.letterValue}
        </span>
      ) : (
        <span className="relative z-10 drop-shadow-md">{item.emoji}</span>
      )}
    </div>
  );
}
