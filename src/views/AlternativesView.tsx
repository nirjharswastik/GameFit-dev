import React from 'react';
import { IconAlert, IconCheck, IconChevronRight, IconInfo, IconMonitor, IconSliders } from '../components/common/Icons';
import { useHardware } from '../context/HardwareContext';
import { CURATED_GAMES } from '../data/games';
import { checkGameCompatibility } from '../services/compatibility';
import { getSimilarAndAlternativeGames } from '../services/recommendations';
import { Game } from '../types';

interface AlternativesViewProps {
  baseGame: Game;
  onSelectGame: (game: Game) => void;
  onNavigate: (path: string) => void;
}

export const AlternativesView: React.FC<AlternativesViewProps> = ({
  baseGame,
  onSelectGame,
  onNavigate,
}) => {
  const { hardware, openHardwareModal } = useHardware();

  const baseCompatibility = checkGameCompatibility(baseGame, hardware);
  const alternatives = getSimilarAndAlternativeGames(baseGame, CURATED_GAMES, hardware);

  return (
    <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12 space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#85867F] font-mono">
        <button onClick={() => onNavigate('/')} className="hover:text-[#20211F] cursor-pointer">
          Home
        </button>
        <span>/</span>
        <button onClick={() => onNavigate('/games')} className="hover:text-[#20211F] cursor-pointer">
          Catalog
        </button>
        <span>/</span>
        <button onClick={() => onSelectGame(baseGame)} className="hover:text-[#20211F] cursor-pointer">
          {baseGame.title}
        </button>
        <span>/</span>
        <span className="text-[#20211F] font-semibold">Alternatives</span>
      </nav>

      {/* Header */}
      <div className="border-b border-[#DCDCD4] pb-6 space-y-2">
        <div className="text-[11px] font-mono font-semibold uppercase text-[#85867F]">
          RECOMMENDATION ANALYSIS
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#20211F] tracking-tight">
          Alternatives for {baseGame.title}
        </h1>
        <p className="text-sm text-[#686A64] max-w-2xl leading-relaxed">
          Comparing game feel, combat style, and world atmosphere while accounting for hardware headroom on your <span className="font-semibold text-[#20211F]">{hardware.name}</span>.
        </p>
      </div>

      {/* Reference Game Summary Banner */}
      <div className="bg-white border border-[#DCDCD4] rounded-[10px] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-12 rounded-[6px] bg-slate-900 overflow-hidden shrink-0">
            {baseGame.images.cover && (
              <img
                src={baseGame.images.cover}
                alt={baseGame.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <span className="text-[10px] text-[#85867F] font-mono uppercase block">Reference Title</span>
            <h2 className="text-lg font-bold text-[#20211F]">{baseGame.title}</h2>
            <div className="text-xs text-[#686A64]">
              Published minimum requires Tier {baseGame.estimatedTargetTier.minimumTier} ({baseGame.pcRequirements?.minimum.gpu || 'Discrete GPU'})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#F6F5F1] border border-[#DCDCD4] rounded-[8px] text-xs">
            <span className="text-[#85867F] block text-[10px]">Your Rig Compatibility:</span>
            <span className={`font-semibold ${
              baseCompatibility.status === 'meets_recommended'
                ? 'text-[#2F6B50]'
                : baseCompatibility.status === 'meets_minimum'
                ? 'text-[#946A28]'
                : 'text-[#B34335]'
            }`}>
              {baseCompatibility.statusLabel}
            </span>
          </div>

          <button
            onClick={openHardwareModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#20211F] bg-white hover:bg-[#EEEDE7] border border-[#DCDCD4] rounded-[8px] transition-colors cursor-pointer"
          >
            <IconSliders className="w-3.5 h-3.5 text-[#C85B38]" />
            Change Rig
          </button>
        </div>
      </div>

      {/* Alternative Recommendations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#20211F]">
            Ranked Recommendations ({alternatives.length})
          </h2>
          <span className="text-xs text-[#85867F]">
            Evaluated on gameplay similarity and device headroom
          </span>
        </div>

        <div className="space-y-4">
          {alternatives.map((rec, index) => {
            const candidateComp = checkGameCompatibility(rec.game, hardware);

            return (
              <div
                key={rec.game.id}
                className="bg-white border border-[#DCDCD4] hover:border-[#85867F] rounded-[10px] p-5 sm:p-6 shadow-xs transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                {/* Index + Artwork + Information */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-6 h-6 rounded-full bg-[#EEEDE7] text-[#686A64] text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </div>

                  <div className="w-24 sm:w-28 aspect-16/10 rounded-[6px] bg-slate-900 overflow-hidden shrink-0">
                    <img
                      src={rec.game.images.cover}
                      alt={rec.game.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 text-xs text-[#85867F]">
                      <span>{rec.game.genres.slice(0, 2).join(' / ')}</span>
                      <span>·</span>
                      <span>{rec.game.releaseYear}</span>
                      <span>·</span>
                      <span className="font-mono uppercase">{rec.game.platforms.join('/')}</span>
                    </div>

                    <h3
                      onClick={() => onSelectGame(rec.game)}
                      className="font-editorial text-lg font-bold text-[#20211F] hover:text-[#C85B38] transition-colors cursor-pointer"
                    >
                      {rec.game.title}
                    </h3>

                    <p className="text-xs text-[#686A64] leading-relaxed max-w-xl">
                      {rec.game.tagline}
                    </p>

                    {/* Recommendation rationale */}
                    <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-semibold text-[#C85B38] font-mono text-[11px]">
                        {rec.similarityScore}% Game Feel Match
                      </span>
                      <span className="text-[#85867F]">·</span>
                      <span className="text-[#686A64]">
                        {rec.reasons.join(' · ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hardware Delta & Action Panel */}
                <div className="w-full lg:w-72 bg-[#F6F5F1] border border-[#DCDCD4] rounded-[8px] p-4 text-xs space-y-2.5 shrink-0">
                  <div className="flex items-center justify-between text-[#20211F] font-semibold">
                    <span>Hardware Demand</span>
                    {rec.hardwareVerdict === 'runs_better' ? (
                      <span className="text-[#2F6B50] font-mono text-[11px]">+{rec.headroomImprovementPercent}% Headroom</span>
                    ) : (
                      <span className="text-[#85867F] font-mono text-[11px]">Comparable</span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#686A64] leading-snug">
                    {rec.hardwareSuitabilityMessage}
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-[#85867F]">Rig Status:</span>
                    <span className={`font-semibold ${
                      candidateComp.status === 'meets_recommended'
                        ? 'text-[#2F6B50]'
                        : candidateComp.status === 'meets_minimum'
                        ? 'text-[#946A28]'
                        : 'text-[#B34335]'
                    }`}>
                      {candidateComp.statusLabel}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectGame(rec.game)}
                    className="w-full mt-2 py-2 text-xs font-semibold text-white bg-[#20211F] hover:bg-[#C85B38] rounded-[6px] transition-colors cursor-pointer text-center block"
                  >
                    View Specifications →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
