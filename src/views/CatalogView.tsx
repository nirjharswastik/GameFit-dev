import React, { useEffect, useMemo, useState } from 'react';
import { GameCard } from '../components/games/GameCard';
import { IconAlert, IconCheck, IconClose, IconInfo, IconMonitor, IconSearch, IconSliders, IconSmartphone } from '../components/common/Icons';
import { SearchAutocomplete } from '../components/search/SearchAutocomplete';
import { useHardware } from '../context/HardwareContext';
import { CURATED_GAMES } from '../data/games';
import { executeSearch } from '../services/search';
import { Game, Platform } from '../types';

interface CatalogViewProps {
  onSelectGame: (game: Game) => void;
  initialQuery?: string;
  initialCompatibleOnly?: boolean;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  onSelectGame,
  initialQuery = '',
  initialCompatibleOnly = false,
}) => {
  const { hardware, checkCompatibility, openHardwareModal } = useHardware();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedGameplayTags, setSelectedGameplayTags] = useState<string[]>([]);
  const [selectedReleasePeriod, setSelectedReleasePeriod] = useState<string>('all');
  const [hardwareSuitability, setHardwareSuitability] = useState<'all' | 'meets_min' | 'meets_rec' | 'below_min'>(
    initialCompatibleOnly ? 'meets_min' : 'all'
  );
  const [sortBy, setSortBy] = useState<'relevance' | 'title' | 'newest' | 'lightest'>('relevance');

  // Mobile filter drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync with initialQuery when changed from navigation
  useEffect(() => {
    if (initialQuery !== undefined) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  // Extract all unique genres & gameplay tags from dataset
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    CURATED_GAMES.forEach(g => g.genres.forEach(gen => set.add(gen)));
    return Array.from(set).sort();
  }, []);

  const availableGameplayTags = useMemo(() => {
    const set = new Set<string>();
    CURATED_GAMES.forEach(g => g.gameplayTags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, []);

  // Filter & Rank games using deterministic pipeline
  const filteredGames = useMemo(() => {
    // First run shared search ranking if query present
    let pool = searchQuery.trim()
      ? executeSearch({ query: searchQuery, hardware }, CURATED_GAMES).map(res => res.game)
      : [...CURATED_GAMES];

    // Filter by platforms (OR within group)
    if (selectedPlatforms.length > 0) {
      pool = pool.filter(game => selectedPlatforms.some(p => game.platforms.includes(p)));
    }

    // Filter by genres (OR within group)
    if (selectedGenres.length > 0) {
      pool = pool.filter(game => selectedGenres.some(g => game.genres.includes(g)));
    }

    // Filter by gameplay tags (OR within group)
    if (selectedGameplayTags.length > 0) {
      pool = pool.filter(game => selectedGameplayTags.some(t => game.gameplayTags.includes(t)));
    }

    // Filter by release period
    if (selectedReleasePeriod === 'last5') {
      pool = pool.filter(game => game.releaseYear >= 2021);
    } else if (selectedReleasePeriod === 'last10') {
      pool = pool.filter(game => game.releaseYear >= 2016);
    } else if (selectedReleasePeriod === 'older') {
      pool = pool.filter(game => game.releaseYear < 2016);
    }

    // Filter by hardware suitability
    if (hardwareSuitability !== 'all') {
      pool = pool.filter(game => {
        const comp = checkCompatibility(game);
        if (hardwareSuitability === 'meets_rec') {
          return comp.status === 'meets_recommended';
        }
        if (hardwareSuitability === 'meets_min') {
          return comp.status === 'meets_recommended' || comp.status === 'meets_minimum';
        }
        if (hardwareSuitability === 'below_min') {
          return comp.status === 'below_minimum';
        }
        return true;
      });
    }

    // Sorting
    return pool.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'newest') {
        return b.releaseYear - a.releaseYear;
      }
      if (sortBy === 'lightest') {
        return a.estimatedTargetTier.minimumTier - b.estimatedTargetTier.minimumTier;
      }
      return 0; // relevance preserves search order
    });
  }, [searchQuery, selectedPlatforms, selectedGenres, selectedGameplayTags, selectedReleasePeriod, hardwareSuitability, sortBy, hardware]);

  const activeFiltersCount =
    (selectedPlatforms.length > 0 ? 1 : 0) +
    (selectedGenres.length > 0 ? selectedGenres.length : 0) +
    (selectedGameplayTags.length > 0 ? selectedGameplayTags.length : 0) +
    (selectedReleasePeriod !== 'all' ? 1 : 0) +
    (hardwareSuitability !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedPlatforms([]);
    setSelectedGenres([]);
    setSelectedGameplayTags([]);
    setSelectedReleasePeriod('all');
    setHardwareSuitability('all');
    setSortBy('relevance');
  };

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(item => item !== g) : [...prev, g]
    );
  };

  const toggleTag = (t: string) => {
    setSelectedGameplayTags(prev =>
      prev.includes(t) ? prev.filter(item => item !== t) : [...prev, t]
    );
  };

  // Close mobile drawer on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileFiltersOpen) {
        setMobileFiltersOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileFiltersOpen]);

  // Sidebar Filter Content (Shared between desktop sidebar & mobile drawer)
  const renderFilterGroups = () => (
    <div className="space-y-6 text-xs text-[#20211F]">
      {/* 1. Platform Filter */}
      <div className="space-y-2.5">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-[#686A64]">
          Platform
        </h3>
        <div className="space-y-2">
          {(['pc', 'android', 'ios'] as Platform[]).map(p => (
            <label key={p} className="flex items-center gap-2 cursor-pointer select-none text-[#20211F]">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(p)}
                onChange={() => togglePlatform(p)}
                className="w-4 h-4 rounded text-[#C85B38] focus:ring-[#C85B38] border-[#DCDCD4]"
              />
              <span className="capitalize">{p === 'pc' ? 'PC (Windows)' : p === 'android' ? 'Android' : 'Apple iOS'}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 2. Hardware Suitability */}
      <div className="space-y-2.5 pt-4 border-t border-[#E8E7E0]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-[#686A64]">
            Hardware Suitability
          </h3>
          <button
            onClick={openHardwareModal}
            className="text-[11px] text-[#C85B38] hover:underline cursor-pointer"
          >
            Edit Rig
          </button>
        </div>
        <p className="text-[11px] text-[#85867F]">Tested vs: {hardware.name}</p>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="hw-suit"
              checked={hardwareSuitability === 'all'}
              onChange={() => setHardwareSuitability('all')}
              className="text-[#C85B38] focus:ring-[#C85B38]"
            />
            <span>All Requirements</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="hw-suit"
              checked={hardwareSuitability === 'meets_min'}
              onChange={() => setHardwareSuitability('meets_min')}
              className="text-[#C85B38] focus:ring-[#C85B38]"
            />
            <span>Meets Minimum Requirements</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="hw-suit"
              checked={hardwareSuitability === 'meets_rec'}
              onChange={() => setHardwareSuitability('meets_rec')}
              className="text-[#C85B38] focus:ring-[#C85B38]"
            />
            <span>Meets Recommended Specs</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="hw-suit"
              checked={hardwareSuitability === 'below_min'}
              onChange={() => setHardwareSuitability('below_min')}
              className="text-[#C85B38] focus:ring-[#C85B38]"
            />
            <span>Below Minimum (Needs Upgrade)</span>
          </label>
        </div>
      </div>

      {/* 3. Genres */}
      <div className="space-y-2.5 pt-4 border-t border-[#E8E7E0]">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-[#686A64]">
          Genre
        </h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {availableGenres.map(genre => (
            <label key={genre} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedGenres.includes(genre)}
                onChange={() => toggleGenre(genre)}
                className="w-4 h-4 rounded text-[#C85B38] focus:ring-[#C85B38] border-[#DCDCD4]"
              />
              <span>{genre}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 4. Gameplay Mechanics */}
      <div className="space-y-2.5 pt-4 border-t border-[#E8E7E0]">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-[#686A64]">
          Gameplay Tags
        </h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {availableGameplayTags.slice(0, 10).map(tag => (
            <label key={tag} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedGameplayTags.includes(tag)}
                onChange={() => toggleTag(tag)}
                className="w-4 h-4 rounded text-[#C85B38] focus:ring-[#C85B38] border-[#DCDCD4]"
              />
              <span>{tag}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 5. Release Period */}
      <div className="space-y-2.5 pt-4 border-t border-[#E8E7E0]">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-[#686A64]">
          Release Period
        </h3>
        <select
          value={selectedReleasePeriod}
          onChange={(e) => setSelectedReleasePeriod(e.target.value)}
          className="w-full text-xs bg-white border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F]"
        >
          <option value="all">Any year</option>
          <option value="last5">Last 5 years (2021+)</option>
          <option value="last10">Last 10 years (2016+)</option>
          <option value="older">Older classics (&lt;2016)</option>
        </select>
      </div>

      {/* Reset button */}
      {activeFiltersCount > 0 && (
        <div className="pt-4 border-t border-[#E8E7E0]">
          <button
            type="button"
            onClick={resetAllFilters}
            className="w-full py-2 text-xs font-semibold text-[#85867F] hover:text-[#20211F] bg-[#EEEDE7] rounded-[6px] transition-colors cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12 space-y-8">
      {/* Page Header (Compact) */}
      <div className="border-b border-[#DCDCD4] pb-6 space-y-3">
        <div className="text-xs text-[#85867F] font-mono">
          <span>GameFit</span> / <span>Catalog</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#20211F] tracking-tight">
              Explore games
            </h1>
            <p className="text-xs sm:text-sm text-[#686A64] mt-1">
              Search verified titles, filter by gameplay, and verify device compatibility.
            </p>
          </div>
          <div className="text-xs font-mono text-[#85867F]">
            Showing <span className="font-bold text-[#20211F] tabular-nums">{filteredGames.length}</span> of {CURATED_GAMES.length} games
          </div>
        </div>

        {/* Search input in header */}
        <div className="pt-2 max-w-xl">
          <SearchAutocomplete
            initialValue={searchQuery}
            placeholder="Search title, genre, gameplay tag, or developer..."
            onSearchSubmit={(q) => setSearchQuery(q)}
            onSelectGame={onSelectGame}
          />
        </div>
      </div>

      {/* Desktop Layout: 2-Column Structure (Left Sidebar 240px + Right Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar (Desktop only) */}
        <aside className="hidden lg:block lg:col-span-3 bg-white border border-[#DCDCD4] rounded-[10px] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E7E0] mb-4">
            <span className="font-bold text-sm text-[#20211F]">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="text-[11px] font-mono text-[#C85B38] font-semibold">
                {activeFiltersCount} active
              </span>
            )}
          </div>
          {renderFilterGroups()}
        </aside>

        {/* Right Results Area */}
        <div className="lg:col-span-9 space-y-6">
          {/* Controls Bar: Mobile Filters Button, Sorting, Active Chips */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#DCDCD4] rounded-[10px] p-4 shadow-xs">
            {/* Mobile Filter Drawer Trigger */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#20211F] bg-[#EEEDE7] hover:bg-[#E8E7E0] border border-[#DCDCD4] rounded-[8px] transition-colors cursor-pointer"
            >
              <IconSliders className="w-3.5 h-3.5 text-[#C85B38]" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#C85B38] text-white text-[10px] flex items-center justify-center font-mono">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Active Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#20211F] bg-[#EEEDE7] border border-[#DCDCD4] px-2.5 py-1 rounded-[6px]">
                  <span>"{searchQuery}"</span>
                  <button onClick={() => setSearchQuery('')} className="text-[#85867F] hover:text-[#20211F] cursor-pointer">
                    <IconClose className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedPlatforms.map(p => (
                <span key={p} className="inline-flex items-center gap-1.5 text-xs text-[#20211F] bg-[#EEEDE7] border border-[#DCDCD4] px-2.5 py-1 rounded-[6px]">
                  <span className="uppercase font-mono text-[11px]">{p}</span>
                  <button onClick={() => togglePlatform(p)} className="text-[#85867F] hover:text-[#20211F] cursor-pointer">
                    <IconClose className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selectedGenres.map(g => (
                <span key={g} className="inline-flex items-center gap-1.5 text-xs text-[#20211F] bg-[#EEEDE7] border border-[#DCDCD4] px-2.5 py-1 rounded-[6px]">
                  <span>{g}</span>
                  <button onClick={() => toggleGenre(g)} className="text-[#85867F] hover:text-[#20211F] cursor-pointer">
                    <IconClose className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {hardwareSuitability !== 'all' && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#20211F] bg-[#F6E8E1] border border-[#C85B38]/30 px-2.5 py-1 rounded-[6px]">
                  <span>Fits {hardware.name.split('·')[0]}</span>
                  <button onClick={() => setHardwareSuitability('all')} className="text-[#C85B38] hover:text-[#A9472B] cursor-pointer">
                    <IconClose className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-semibold text-[#686A64]">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-[#F6F5F1] border border-[#DCDCD4] rounded-[8px] py-1.5 px-3 text-[#20211F] focus:outline-none focus:border-[#C85B38]"
              >
                <option value="relevance">Relevance</option>
                <option value="title">Title A–Z</option>
                <option value="newest">Newest Release</option>
                <option value="lightest">Lightest Demand</option>
              </select>
            </div>
          </div>

          {/* Results Grid (4 col wide desktop, 3 col desktop, 2 col mobile) */}
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {filteredGames.map(game => (
                <GameCard key={game.id} game={game} onSelect={onSelectGame} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white border border-[#DCDCD4] rounded-[12px] p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#EEEDE7] text-[#686A64] flex items-center justify-center mx-auto">
                <IconInfo className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#20211F]">
                No matching games found.
              </h3>
              <p className="text-xs text-[#686A64] leading-relaxed">
                Try removing a filter, using a broader search query, or switching your active hardware test profile.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#C85B38] hover:bg-[#A9472B] rounded-[8px] transition-colors cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer / Modal */}
      {mobileFiltersOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#20211F]/60 backdrop-blur-xs flex justify-end animate-in fade-in-50 duration-150"
        >
          <div className="bg-[#F6F5F1] w-full max-w-xs h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[#DCDCD4] bg-white flex items-center justify-between">
              <span className="font-bold text-sm text-[#20211F]">Filter Games</span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 text-[#85867F] hover:text-[#20211F] rounded-md cursor-pointer"
                aria-label="Close filters"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              {renderFilterGroups()}
            </div>
            <div className="p-4 border-t border-[#DCDCD4] bg-white flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-3 py-2 text-xs text-[#85867F] hover:text-[#20211F] underline cursor-pointer"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#C85B38] rounded-[8px] cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
