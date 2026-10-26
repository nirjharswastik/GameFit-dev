import React, { useState } from 'react';
import { useHardware } from '../../context/HardwareContext';
import { Game } from '../../types';
import { IconAlert, IconCheck, IconChevronRight, IconInfo, IconMonitor } from '../common/Icons';

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelect }) => {
  const { checkCompatibility, hardware } = useHardware();
  const [imageError, setImageError] = useState(false);

  const compatibility = checkCompatibility(game);

  // Status visual mapping (pairs color with clear text label + icon)
  const getStatusBadge = () => {
    switch (compatibility.status) {
      case 'meets_recommended':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2F6B50] bg-[#2F6B50]/10 border border-[#2F6B50]/30 px-2 py-0.5 rounded-[5px]">
            <IconCheck className="w-3.5 h-3.5 text-[#2F6B50]" />
            <span>Meets Recommended Specs</span>
          </div>
        );
      case 'meets_minimum':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#946A28] bg-[#946A28]/10 border border-[#946A28]/30 px-2 py-0.5 rounded-[5px]">
            <IconCheck className="w-3.5 h-3.5 text-[#946A28]" />
            <span>Meets Minimum Requirements</span>
          </div>
        );
      case 'below_minimum':
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B34335] bg-[#B34335]/10 border border-[#B34335]/30 px-2 py-0.5 rounded-[5px]">
            <IconAlert className="w-3.5 h-3.5 text-[#B34335]" />
            <span>Below Minimum Requirements</span>
          </div>
        );
      case 'unsupported_platform':
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#656B73] bg-[#EEEDE7] border border-[#DCDCD4] px-2 py-0.5 rounded-[5px]">
            <IconInfo className="w-3.5 h-3.5 text-[#656B73]" />
            <span>Unavailable on {hardware.platform.toUpperCase()}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#946A28] bg-[#946A28]/10 border border-[#946A28]/30 px-2 py-0.5 rounded-[5px]">
            <IconInfo className="w-3.5 h-3.5 text-[#946A28]" />
            <span>Requirements Uncertain</span>
          </div>
        );
    }
  };

  return (
    <article
      onClick={() => onSelect(game)}
      className="group bg-white rounded-[10px] border border-[#DCDCD4] hover:border-[#85867F] transition-all duration-150 overflow-hidden flex flex-col cursor-pointer text-left shadow-xs"
    >
      {/* Visual Asset Container */}
      <div className="relative aspect-16/10 w-full bg-[#20211F] overflow-hidden">
        {!imageError && game.images.cover ? (
          <img
            src={game.images.cover}
            alt={`${game.title} cover`}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#EEEDE7] text-[#686A64] p-4">
            <IconMonitor className="w-7 h-7 text-[#85867F] mb-1.5" />
            <span className="text-xs font-semibold text-[#20211F]">{game.title}</span>
          </div>
        )}

        {/* Platform tag indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#20211F]/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-[4px]">
          {game.platforms.map(p => p.toUpperCase()).join(' / ')}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata: NO PILLS, unboxed text */}
          <div className="flex items-center gap-1.5 text-xs text-[#85867F] mb-1.5">
            <span>{game.genres.slice(0, 2).join(' / ')}</span>
            <span aria-hidden="true">·</span>
            <span>{game.releaseYear}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{game.developer.split('/')[0].trim()}</span>
          </div>

          {/* Title */}
          <h3 className="text-[16px] font-bold text-[#20211F] group-hover:text-[#C85B38] transition-colors line-clamp-1 mb-1 font-editorial sm:text-[17px]">
            {game.title}
          </h3>

          {/* Tagline */}
          <p className="text-xs text-[#686A64] line-clamp-2 leading-relaxed mb-4">
            {game.tagline}
          </p>
        </div>

        {/* Compatibility Verdict & Action */}
        <div className="pt-3 border-t border-[#E8E7E0] space-y-2">
          <div className="flex items-center justify-between">
            {getStatusBadge()}
          </div>

          {/* Specific bottleneck note if below minimum */}
          {compatibility.status === 'below_minimum' && compatibility.limitingBottleneck && (
            <div className="text-[11px] text-[#85867F] font-mono">
              Bottleneck: <span className="text-[#B34335]">{compatibility.limitingBottleneck}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-semibold text-[#20211F] pt-1 group-hover:text-[#C85B38] transition-colors">
            <span>View specifications</span>
            <IconChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </article>
  );
};
