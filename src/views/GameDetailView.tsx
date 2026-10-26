import React, { useState } from 'react';
import { CompatibilityMatrix } from '../components/games/CompatibilityMatrix';
import { GameCard } from '../components/games/GameCard';
import { IconAlert, IconArrowRight, IconCheck, IconChevronRight, IconExternalLink, IconInfo, IconMonitor, IconSliders, IconSmartphone } from '../components/common/Icons';
import { useHardware } from '../context/HardwareContext';
import { CURATED_GAMES } from '../data/games';
import { getSimilarAndAlternativeGames } from '../services/recommendations';
import { Game } from '../types';

interface GameDetailViewProps {
  game: Game;
  onSelectGame: (game: Game) => void;
  onNavigate: (path: string) => void;
  onViewAlternatives: (game: Game) => void;
}

export const GameDetailView: React.FC<GameDetailViewProps> = ({
  game,
  onSelectGame,
  onNavigate,
  onViewAlternatives,
}) => {
  const { hardware, checkCompatibility, openHardwareModal } = useHardware();
  const [imageError, setImageError] = useState(false);

  const compatibility = checkCompatibility(game);
  const alternatives = getSimilarAndAlternativeGames(game, CURATED_GAMES, hardware);

  const pcReqs = game.pcRequirements;
  const androidReqs = game.mobileRequirements?.android;
  const iosReqs = game.mobileRequirements?.ios;

  const scrollToCompatibility = () => {
    document.getElementById('compatibility-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12 space-y-12">
      {/* Top Section: Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#85867F] font-mono">
        <button onClick={() => onNavigate('/')} className="hover:text-[#20211F] cursor-pointer">
          Home
        </button>
        <span>/</span>
        <button onClick={() => onNavigate('/games')} className="hover:text-[#20211F] cursor-pointer">
          Catalog
        </button>
        <span>/</span>
        <span className="text-[#20211F] font-semibold truncate max-w-[240px]">{game.title}</span>
      </nav>

      {/* Main Editorial Hero Section (2-Column Desktop, Stacked Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start bg-white border border-[#DCDCD4] rounded-[12px] p-6 sm:p-10 shadow-xs">
        {/* Left Column (7 cols): Title, metadata, description, actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#85867F]">
              <span className="uppercase font-mono font-semibold text-[#C85B38]">{game.platforms.join(' / ')}</span>
              <span>·</span>
              <span>{game.releaseYear}</span>
              <span>·</span>
              <span>{game.developer}</span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#20211F] tracking-tight">
              {game.title}
            </h1>

            <p className="text-base text-[#686A64] font-medium leading-relaxed">
              {game.tagline}
            </p>
          </div>

          <div className="text-sm text-[#20211F] leading-relaxed pt-2 border-t border-[#E8E7E0]">
            {game.description}
          </div>

          {/* Categorization & Tags (NO PILLS) */}
          <div className="pt-3 border-t border-[#E8E7E0] space-y-2 text-xs">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-[#20211F] w-24 shrink-0">Genres:</span>
              <span className="text-[#686A64]">{game.genres.join(' · ')}</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-[#20211F] w-24 shrink-0">Gameplay:</span>
              <span className="text-[#686A64]">{game.gameplayTags.join(' · ')}</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-[#20211F] w-24 shrink-0">Atmosphere:</span>
              <span className="text-[#686A64]">{game.atmosphereTags.join(' · ')}</span>
            </div>
          </div>

          {/* Primary & Secondary Actions */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={scrollToCompatibility}
              className="px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-[#C85B38] hover:bg-[#A9472B] rounded-[8px] transition-colors cursor-pointer shadow-xs"
            >
              Check compatibility
            </button>
            <button
              onClick={() => onViewAlternatives(game)}
              className="px-5 py-3 text-xs sm:text-sm font-semibold text-[#20211F] bg-white hover:bg-[#EEEDE7] border border-[#DCDCD4] rounded-[8px] transition-colors cursor-pointer"
            >
              Find similar games ({alternatives.length})
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Large Artwork & Provenance Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-16/10 rounded-[10px] overflow-hidden bg-[#20211F] border border-[#DCDCD4] shadow-xs">
            {!imageError && game.images.cover ? (
              <img
                src={game.images.cover}
                alt={game.title}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#85867F]">
                Artwork for {game.title}
              </div>
            )}
          </div>

          {/* Data Freshness and Publisher Provenance */}
          <div className="p-4 bg-[#F6F5F1] border border-[#DCDCD4] rounded-[8px] text-xs space-y-2">
            <div className="flex items-center justify-between text-[#20211F] font-semibold">
              <span>Publisher Manifest Provenance</span>
              <span className="text-[11px] font-mono text-[#2F6B50] bg-[#2F6B50]/10 px-2 py-0.5 rounded">
                {game.provenance.confidence}
              </span>
            </div>
            <p className="text-[11px] text-[#686A64]">
              {game.provenance.sourceName}
            </p>
            <div className="flex items-center justify-between text-[11px] text-[#85867F] font-mono pt-1 border-t border-[#E8E7E0]">
              <span>Last audit: {game.provenance.lastVerified}</span>
              {game.provenance.sourceUrl && (
                <a
                  href={game.provenance.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[#C85B38] hover:underline flex items-center gap-1 font-sans font-semibold"
                >
                  <span>Storefront source</span>
                  <IconExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: SYSTEM REQUIREMENTS */}
      <section className="space-y-6">
        <div className="border-b border-[#DCDCD4] pb-4">
          <div className="text-[11px] font-mono font-semibold uppercase text-[#85867F] mb-1">
            SPECIFICATION REFERENCE
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#20211F]">
            Published system requirements
          </h2>
          <p className="text-xs sm:text-sm text-[#686A64] mt-1">
            Verified publisher minimum operational floor vs recommended target settings.
          </p>
        </div>

        {pcReqs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Minimum Requirements */}
            <div className="bg-white border border-[#DCDCD4] rounded-[10px] p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E8E7E0] pb-2">
                <h3 className="font-bold text-sm text-[#20211F]">Minimum Requirements (PC)</h3>
                <span className="text-xs text-[#85867F] font-mono">Baseline Launch</span>
              </div>
              <dl className="space-y-2.5 text-xs">
                <div>
                  <dt className="text-[#85867F] font-medium">Operating System</dt>
                  <dd className="font-mono text-[#20211F]">{pcReqs.minimum.os}</dd>
                </div>
                <div>
                  <dt className="text-[#85867F] font-medium">Processor (CPU)</dt>
                  <dd className="font-mono text-[#20211F]">{pcReqs.minimum.cpu}</dd>
                </div>
                <div>
                  <dt className="text-[#85867F] font-medium">Graphics Card (GPU)</dt>
                  <dd className="font-mono text-[#20211F]">{pcReqs.minimum.gpu} ({pcReqs.minimum.vramGb}GB VRAM)</dd>
                </div>
                <div>
                  <dt className="text-[#85867F] font-medium">Memory (RAM)</dt>
                  <dd className="font-mono text-[#20211F]">{pcReqs.minimum.ramGb} GB</dd>
                </div>
                <div>
                  <dt className="text-[#85867F] font-medium">Storage</dt>
                  <dd className="font-mono text-[#20211F]">{pcReqs.minimum.storageGb} GB ({pcReqs.minimum.storageType || 'Storage'})</dd>
                </div>
                {pcReqs.minimum.notes && (
                  <div className="pt-2 text-[11px] text-[#686A64] bg-[#F6F5F1] p-2.5 rounded-[6px]">
                    {pcReqs.minimum.notes}
                  </div>
                )}
              </dl>
            </div>

            {/* Recommended Requirements */}
            <div className="bg-white border border-[#DCDCD4] rounded-[10px] p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E8E7E0] pb-2">
                <h3 className="font-bold text-sm text-[#20211F]">Recommended Requirements (PC)</h3>
                <span className="text-xs text-[#2F6B50] font-mono font-semibold">60 FPS Target</span>
              </div>
              <dl className="space-y-2.5 text-xs">
                <div>
                  <dt className="text-[#85867F] font-medium">Operating System</dt>
                  <dd className="font-mono text-[#20211F]">{pcReqs.recommended.os}</dd>
                </div>
                <div>
                  <dt className="text-[#85867F] font-medium">Processor (CPU)</dt>
                  <dd className="font-mono text-[#20211F]">{pcReqs.recommended.cpu}</dd>
                </div>
                <div>
                  <dt className="text-[#85867F] font-medium">Graphics Card (GPU)</dt>
                  <dd className="font-mono text-[#20211F]">{pcReqs.recommended.gpu} ({pcReqs.recommended.vramGb}GB VRAM)</dd>
                </div>
                <div>
                  <dt className="text-[#85867F] font-medium">Memory (RAM)</dt>
                  <dd className="font-mono text-[#20211F]">{pcReqs.recommended.ramGb} GB</dd>
                </div>
                <div>
                  <dt className="text-[#85867F] font-medium">Storage</dt>
                  <dd className="font-mono text-[#20211F]">{pcReqs.recommended.storageGb} GB ({pcReqs.recommended.storageType || 'SSD'})</dd>
                </div>
                {pcReqs.recommended.notes && (
                  <div className="pt-2 text-[11px] text-[#686A64] bg-[#F6F5F1] p-2.5 rounded-[6px]">
                    {pcReqs.recommended.notes}
                  </div>
                )}
              </dl>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white border border-[#DCDCD4] rounded-[10px] text-xs text-[#686A64]">
            PC requirements for {game.title} are not applicable or currently unverified.
          </div>
        )}

        {/* Mobile Platform Details */}
        {(androidReqs || iosReqs) && (
          <div className="bg-white border border-[#DCDCD4] rounded-[10px] p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-sm text-[#20211F]">Mobile Availability & Hardware Constraints</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {androidReqs && (
                <div className="space-y-1.5 border-l-2 border-[#DCDCD4] pl-3">
                  <span className="font-bold text-[#20211F] block">Android</span>
                  <div className="text-[#686A64] font-mono">Min OS: {androidReqs.minOs}</div>
                  <div className="text-[#686A64] font-mono">Min RAM: {androidReqs.minRamGb} GB</div>
                  <div className="text-[#686A64] font-mono">Storage: {androidReqs.storageGb} GB</div>
                  {androidReqs.knownLimitations && (
                    <p className="text-[11px] text-[#85867F] mt-1">{androidReqs.knownLimitations}</p>
                  )}
                </div>
              )}
              {iosReqs && (
                <div className="space-y-1.5 border-l-2 border-[#DCDCD4] pl-3">
                  <span className="font-bold text-[#20211F] block">Apple iOS</span>
                  <div className="text-[#686A64] font-mono">Min OS: {iosReqs.minOs}</div>
                  <div className="text-[#686A64] font-mono">Hardware: {iosReqs.targetGpuDesc}</div>
                  <div className="text-[#686A64] font-mono">Storage: {iosReqs.storageGb} GB</div>
                  {iosReqs.knownLimitations && (
                    <p className="text-[11px] text-[#85867F] mt-1">{iosReqs.knownLimitations}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* SECTION: COMPATIBILITY CHECKER */}
      <section id="compatibility-section" className="space-y-6 pt-4">
        <div className="border-b border-[#DCDCD4] pb-4">
          <div className="text-[11px] font-mono font-semibold uppercase text-[#85867F] mb-1">
            ACTIVE PROFILE VERIFICATION
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#20211F]">
            Compatibility with your active rig
          </h2>
          <p className="text-xs sm:text-sm text-[#686A64] mt-1">
            Component audit comparing {game.title} against your active device setup ({hardware.name}).
          </p>
        </div>

        <CompatibilityMatrix game={game} compatibility={compatibility} />
      </section>

      {/* SECTION: SIMILAR GAMES & ALTERNATIVES */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[#DCDCD4] pb-4">
          <div>
            <div className="text-[11px] font-mono font-semibold uppercase text-[#85867F] mb-1">
              RECOMMENDATIONS
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#20211F]">
              Similar games & playable alternatives
            </h2>
            <p className="text-xs sm:text-sm text-[#686A64] mt-1">
              Ranked by gameplay similarity and performance headroom on your hardware.
            </p>
          </div>
          <button
            onClick={() => onViewAlternatives(game)}
            className="text-xs font-semibold text-[#C85B38] hover:text-[#A9472B] flex items-center gap-1 cursor-pointer"
          >
            <span>All alternatives ({alternatives.length})</span>
            <IconChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {alternatives.slice(0, 3).map(rec => (
            <div key={rec.game.id} className="flex flex-col space-y-2">
              <GameCard game={rec.game} onSelect={onSelectGame} />
              <div className="p-3 bg-white border border-[#DCDCD4] rounded-[8px] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#20211F]">Match Reason:</span>
                  <span className="font-mono text-[#C85B38] font-bold text-[11px]">{rec.similarityScore}%</span>
                </div>
                <p className="text-[11px] text-[#686A64] leading-snug">
                  {rec.reasons.join(' · ')}
                </p>
                <div className="pt-1 text-[11px] font-medium text-[#2F6B50]">
                  {rec.hardwareSuitabilityMessage}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
