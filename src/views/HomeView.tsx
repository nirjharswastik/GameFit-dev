import React, { useState } from 'react';
import { GameCard } from '../components/games/GameCard';
import { IconAlert, IconArrowRight, IconCheck, IconChevronRight, IconInfo, IconMonitor, IconSliders } from '../components/common/Icons';
import { SearchAutocomplete } from '../components/search/SearchAutocomplete';
import { useHardware } from '../context/HardwareContext';
import { CURATED_GAMES } from '../data/games';
import { HARDWARE_PRESETS } from '../data/hardware';
import { checkGameCompatibility } from '../services/compatibility';
import { getSimilarAndAlternativeGames } from '../services/recommendations';
import { Game } from '../types';

interface HomeViewProps {
  onSelectGame: (game: Game) => void;
  onNavigate: (path: string) => void;
  onSearchSubmit: (query: string, compatibleOnly: boolean) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectGame, onNavigate, onSearchSubmit }) => {
  const { hardware, setHardwarePreset, openHardwareModal } = useHardware();

  // Curated showcase: 4 games for "Worth a closer look"
  const showcaseGames = CURATED_GAMES.slice(0, 4);

  // Experience categories represented in actual catalog metadata
  const experienceCategories = [
    { title: 'Open-World Exploration', query: 'open world', count: 4, desc: 'Vast interconnecting landscapes & secrets' },
    { title: 'Story-Driven Adventures', query: 'story', count: 5, desc: 'Deep narratives & memorable character arcs' },
    { title: 'Tactical & Melee Combat', query: 'melee', count: 5, desc: 'Precision parrying, timing, and bosses' },
    { title: 'Survival & Crafting', query: 'crafting', count: 2, desc: 'Resource mastery & homestead building' },
    { title: 'Relaxing & Low-Demand', query: 'relaxing', count: 3, desc: 'Comfortable pacing on entry-level hardware' },
  ];

  // Section D interactive preview state
  const [previewGameId, setPreviewGameId] = useState(CURATED_GAMES[0].id);
  const previewGame = CURATED_GAMES.find(g => g.id === previewGameId) || CURATED_GAMES[0];
  const previewCompatibility = checkGameCompatibility(previewGame, hardware);

  // Section E featured alternative game: Elden Ring vs lighter alternatives
  const eldenRing = CURATED_GAMES.find(g => g.slug === 'elden-ring') || CURATED_GAMES[0];
  const eldenAlternatives = getSimilarAndAlternativeGames(eldenRing, CURATED_GAMES, hardware).slice(0, 3);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* SECTION A: HERO */}
      <section className="pt-8 sm:pt-16 pb-12 sm:pb-20 border-b border-[#DCDCD4]">
        <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column (50%) */}
            <div className="lg:col-span-6 space-y-6">
              {/* 1. Small introductory label */}
              <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#686A64]">
                GAME DISCOVERY / HARDWARE FIT
              </div>

              {/* 2. Large editorial headline */}
              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[58px] leading-[1.08] font-bold text-[#20211F] tracking-tight [text-wrap:balance]">
                Find your next game. Know your hardware.
              </h1>

              {/* 3. Short supporting paragraph */}
              <p className="text-base sm:text-lg text-[#686A64] leading-relaxed max-w-xl font-sans">
                Explore games that match your taste, check their requirements against your device, and discover alternatives worth playing.
              </p>

              {/* 4. Search field */}
              <div className="pt-2 max-w-xl">
                <SearchAutocomplete
                  placeholder="Search a game or describe what you want to play..."
                  onSearchSubmit={(q) => onSearchSubmit(q, false)}
                  onSelectGame={onSelectGame}
                />
              </div>

              {/* 5. Two secondary actions */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('/games')}
                  className="px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-[#C85B38] hover:bg-[#A9472B] rounded-[8px] transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                >
                  Explore games
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/compatibility')}
                  className="px-5 py-3 text-xs sm:text-sm font-semibold text-[#20211F] bg-white hover:bg-[#EEEDE7] border border-[#DCDCD4] rounded-[8px] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Check compatibility
                </button>
              </div>

              {/* Hardware Profile Context Note */}
              <div className="pt-2 flex items-center gap-2 text-xs text-[#686A64]">
                <span className="text-[#85867F]">Active device test profile:</span>
                <button
                  type="button"
                  onClick={openHardwareModal}
                  className="font-semibold text-[#20211F] hover:text-[#C85B38] underline decoration-[#DCDCD4] underline-offset-4 cursor-pointer"
                >
                  {hardware.name}
                </button>
                <span className="text-[#85867F]">·</span>
                <span className="font-mono text-[11px] text-[#686A64]">{hardware.targetResolution}</span>
              </div>
            </div>

            {/* Right Column (50%): Large Permitted Editorial Game Artwork */}
            <div className="lg:col-span-6">
              <div className="relative rounded-[12px] overflow-hidden border border-[#DCDCD4] bg-[#20211F] shadow-sm">
                <div className="aspect-16/10 w-full overflow-hidden">
                  <img
                    src="/src/assets/images/hero_editorial_hardware_1792925144437.jpg"
                    alt="Precision hardware gaming workspace"
                    className="w-full h-full object-cover object-center hover:scale-101 transition-transform duration-500"
                  />
                </div>
                {/* Editorial Caption */}
                <div className="p-4 bg-white border-t border-[#DCDCD4] flex items-center justify-between text-xs text-[#686A64]">
                  <div>
                    <span className="font-semibold text-[#20211F] block text-sm">
                      Elden Ring: Shadow of the Erdtree Edition
                    </span>
                    <span className="text-[11px] font-mono text-[#85867F]">
                      Action RPG · FromSoftware · Verified PC Requirements
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectGame(CURATED_GAMES[0])}
                    className="text-xs font-semibold text-[#C85B38] hover:text-[#A9472B] flex items-center gap-1 cursor-pointer"
                  >
                    <span>View specs</span>
                    <IconChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: CONTINUE EXPLORING ("Worth a closer look") */}
      <section className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-8 border-b border-[#E8E7E0] pb-4">
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#20211F] tracking-tight">
              Worth a closer look
            </h2>
            <p className="text-xs sm:text-sm text-[#686A64] mt-1 font-sans">
              Curated titles with verified publisher system specifications and tested performance tiers.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/games')}
            className="text-xs font-semibold text-[#C85B38] hover:text-[#A9472B] flex items-center gap-1 cursor-pointer"
          >
            <span>All catalog titles ({CURATED_GAMES.length})</span>
            <IconChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {showcaseGames.map(game => (
            <GameCard key={game.id} game={game} onSelect={onSelectGame} />
          ))}
        </div>
      </section>

      {/* SECTION C: DISCOVER BY EXPERIENCE */}
      <section className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12">
        <div className="border-b border-[#E8E7E0] pb-4 mb-6">
          <div className="text-[11px] font-mono font-semibold uppercase text-[#85867F] mb-1">
            CATEGORICAL NAVIGATION
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#20211F] tracking-tight">
            Discover by experience
          </h2>
          <p className="text-xs sm:text-sm text-[#686A64] mt-1">
            Browse through concrete gameplay mechanics and artistic atmospheres.
          </p>
        </div>

        {/* Editorial Horizontal List Structure */}
        <div className="divide-y divide-[#E8E7E0] border-y border-[#E8E7E0] bg-white rounded-[10px] overflow-hidden">
          {experienceCategories.map((cat, idx) => (
            <button
              key={cat.title}
              onClick={() => onSearchSubmit(cat.query, false)}
              className="w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-[#F6E8E1]/30 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-6">
                <span className="font-mono text-xs text-[#85867F] w-6 shrink-0">
                  0{idx + 1}
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-[#20211F] group-hover:text-[#C85B38] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[#686A64] mt-0.5">
                    {cat.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono text-[#85867F]">
                  {cat.count} verified titles
                </span>
                <IconChevronRight className="w-4 h-4 text-[#85867F] group-hover:text-[#C85B38] group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION D: HARDWARE COMPATIBILITY FEATURE */}
      <section className="bg-[#EEEDE7] py-14 sm:py-20 border-y border-[#DCDCD4]">
        <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12">
          <div className="max-w-2xl mb-8">
            <div className="text-[11px] font-mono font-semibold uppercase text-[#85867F] mb-1">
              HARDWARE AUDIT ENGINE
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#20211F] tracking-tight">
              A great game should fit your setup.
            </h2>
            <p className="text-sm sm:text-base text-[#686A64] mt-2 leading-relaxed">
              Compare your hardware with published requirements and understand where your system matches, falls short, or needs further checking.
            </p>
          </div>

          {/* Working Interactive Preview */}
          <div className="bg-white border border-[#DCDCD4] rounded-[12px] p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Controls: Select game & specs */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#85867F]">
                  Select Game to Compare
                </h3>
                <select
                  value={previewGameId}
                  onChange={(e) => setPreviewGameId(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-[#F6F5F1] border border-[#DCDCD4] rounded-[8px] p-3 text-[#20211F] font-medium focus:outline-none focus:border-[#C85B38]"
                >
                  {CURATED_GAMES.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.releaseYear}) — {g.platforms.map(p => p.toUpperCase()).join('/')}
                    </option>
                  ))}
                </select>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#686A64]">Testing against your profile:</span>
                    <button
                      onClick={openHardwareModal}
                      className="text-[#C85B38] font-semibold hover:underline cursor-pointer"
                    >
                      Change rig
                    </button>
                  </div>
                  <div className="p-3 bg-[#F6F5F1] border border-[#DCDCD4] rounded-[8px] text-xs font-mono space-y-1">
                    <div className="font-bold text-[#20211F]">{hardware.name}</div>
                    <div className="text-[#686A64]">CPU: {hardware.cpu}</div>
                    <div className="text-[#686A64]">GPU: {hardware.gpu}</div>
                    <div className="text-[#686A64]">RAM: {hardware.ramGb}GB · Target: {hardware.targetResolution}</div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onNavigate('/compatibility')}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#20211F] hover:bg-[#C85B38] rounded-[8px] transition-colors cursor-pointer text-center"
                  >
                    Check your PC in Full Workbench →
                  </button>
                </div>
              </div>

              {/* Right Diagnostic Result Panel */}
              <div className="lg:col-span-7 bg-[#F6F5F1] border border-[#DCDCD4] rounded-[10px] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#DCDCD4] pb-3">
                  <div className="text-xs text-[#85867F] font-mono">
                    Instant Compatibility Result
                  </div>
                  <div className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold ${
                    previewCompatibility.status === 'meets_recommended'
                      ? 'bg-[#2F6B50]/15 text-[#2F6B50]'
                      : previewCompatibility.status === 'meets_minimum'
                      ? 'bg-[#946A28]/15 text-[#946A28]'
                      : 'bg-[#B34335]/15 text-[#B34335]'
                  }`}>
                    {previewCompatibility.statusLabel}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-base font-bold text-[#20211F]">
                    {previewGame.title} vs {hardware.gpu}
                  </h4>
                  <p className="text-xs text-[#686A64] leading-relaxed">
                    {previewCompatibility.summary}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2">
                  <div className="p-2.5 bg-white border border-[#DCDCD4] rounded-[6px]">
                    <span className="text-[#85867F] block text-[10px]">Processor</span>
                    <span className="font-semibold text-[#20211F]">{previewCompatibility.checks.cpu.status.toUpperCase()}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#DCDCD4] rounded-[6px]">
                    <span className="text-[#85867F] block text-[10px]">Graphics</span>
                    <span className="font-semibold text-[#20211F]">{previewCompatibility.checks.gpu.status.toUpperCase()}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#DCDCD4] rounded-[6px]">
                    <span className="text-[#85867F] block text-[10px]">Memory</span>
                    <span className="font-semibold text-[#20211F]">{previewCompatibility.checks.ram.status.toUpperCase()}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#DCDCD4] rounded-[6px]">
                    <span className="text-[#85867F] block text-[10px]">Drive Space</span>
                    <span className="font-semibold text-[#20211F]">{previewCompatibility.checks.storage.status.toUpperCase()}</span>
                  </div>
                </div>

                <div className="text-[11px] text-[#85867F]">
                  Source verified against official publisher documentation on {previewGame.provenance.lastVerified}.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION E: FIND AN ALTERNATIVE */}
      <section className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12">
        <div className="max-w-2xl mb-8">
          <div className="text-[11px] font-mono font-semibold uppercase text-[#85867F] mb-1">
            HEADROOM-AWARE RECOMMENDATIONS
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#20211F] tracking-tight">
            Love the idea. Need a lighter game?
          </h2>
          <p className="text-sm sm:text-base text-[#686A64] mt-2 leading-relaxed font-sans">
            Start with a game you like and discover similar experiences that better match your device.
          </p>
        </div>

        {/* Featured Source Game vs Alternatives Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Featured Source Game Card */}
          <div className="lg:col-span-4 bg-white border border-[#DCDCD4] rounded-[12px] p-6 space-y-4">
            <span className="text-[10px] font-mono uppercase text-[#85867F] font-semibold">
              Demanding Reference Title
            </span>
            <div className="aspect-16/10 rounded-[8px] overflow-hidden bg-slate-900">
              <img
                src={eldenRing.images.cover}
                alt={eldenRing.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#20211F]">{eldenRing.title}</h3>
              <p className="text-xs text-[#686A64] mt-1 leading-relaxed">
                Demands Tier 5+ GPU (GTX 1060 6GB) and 12GB RAM for base 1080p rendering.
              </p>
            </div>
            <button
              onClick={() => onNavigate(`/alternatives/${eldenRing.slug}`)}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#C85B38] hover:bg-[#A9472B] rounded-[8px] transition-colors cursor-pointer text-center block"
            >
              Find alternatives for {eldenRing.title}
            </button>
          </div>

          {/* Lighter Alternatives List */}
          <div className="lg:col-span-8 space-y-4">
            {eldenAlternatives.map(rec => (
              <div
                key={rec.game.id}
                onClick={() => onSelectGame(rec.game)}
                className="p-5 bg-white border border-[#DCDCD4] hover:border-[#85867F] rounded-[12px] transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 rounded-[6px] bg-slate-900 overflow-hidden shrink-0">
                    <img
                      src={rec.game.images.cover}
                      alt={rec.game.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#85867F]">
                      <span className="font-semibold text-[#C85B38] font-mono">{rec.similarityScore}% Match</span>
                      <span>·</span>
                      <span>{rec.game.genres[0]}</span>
                    </div>
                    <h4 className="text-base font-bold text-[#20211F] group-hover:text-[#C85B38] transition-colors">
                      {rec.game.title}
                    </h4>
                    <p className="text-xs text-[#686A64] mt-0.5 line-clamp-1">
                      {rec.reasons.join(' · ')}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-xs font-semibold text-[#2F6B50]">
                    {rec.hardwareSuitabilityMessage}
                  </div>
                  <span className="text-[11px] text-[#85867F] font-mono">
                    Min GPU: {rec.game.pcRequirements?.minimum.gpu || 'Modest integrated'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION F: FINAL DISCOVERY ENTRY */}
      <section className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12">
        <div className="bg-white border border-[#DCDCD4] rounded-[12px] p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
          <div className="text-[11px] font-mono font-semibold uppercase text-[#85867F]">
            EXPLORATION SEARCH
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#20211F] tracking-tight">
            What do you feel like playing?
          </h2>
          <p className="text-xs sm:text-sm text-[#686A64] max-w-md mx-auto leading-relaxed">
            Search games by title, mechanics, or atmospheric feel. GameFit checks specifications on every match.
          </p>

          <div className="max-w-lg mx-auto">
            <SearchAutocomplete
              placeholder="Search a game or describe what you want to play..."
              onSearchSubmit={(q) => onSearchSubmit(q, false)}
              onSelectGame={onSelectGame}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
