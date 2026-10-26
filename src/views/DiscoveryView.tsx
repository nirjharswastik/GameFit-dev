import React, { useMemo, useState } from 'react';
import { GameCard } from '../components/games/GameCard';
import { IconAlert, IconCheck, IconInfo, IconMonitor, IconSearch, IconSliders } from '../components/common/Icons';
import { useHardware } from '../context/HardwareContext';
import { CURATED_GAMES } from '../data/games';
import { parseNaturalLanguageQuery } from '../services/recommendations';
import { Game } from '../types';

interface DiscoveryViewProps {
  onSelectGame: (game: Game) => void;
  onNavigate: (path: string) => void;
}

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ onSelectGame, onNavigate }) => {
  const { hardware, checkCompatibility, openHardwareModal } = useHardware();

  const [promptText, setPromptText] = useState('atmospheric open-world action with sword combat and exploration for my PC');
  const [selectedWorld, setSelectedWorld] = useState<string>('all');
  const [selectedCombat, setSelectedCombat] = useState<string>('all');
  const [selectedExploration, setSelectedExploration] = useState<string>('all');
  const [onlyFitMyRig, setOnlyFitMyRig] = useState(false);

  const samplePrompts = [
    'atmospheric open-world action with sword combat and exploration for my PC',
    'fast-paced indie action roguelike with great soundtrack that runs on laptop',
    'cozy relaxing farming and exploration for low-spec computer',
    'deep story-rich RPG with tactical combat and high replayability',
  ];

  // Natural query parsing
  const parsedIntent = useMemo(() => {
    return parseNaturalLanguageQuery(promptText);
  }, [promptText]);

  // Scored discovery matching
  const matchedGames = useMemo(() => {
    return CURATED_GAMES.map(game => {
      let score = 0;
      const reasons: string[] = [];

      const tokens = promptText.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      let textTokenMatches = 0;
      tokens.forEach(tok => {
        if (game.title.toLowerCase().includes(tok)) textTokenMatches += 3;
        if (game.genres.some(g => g.toLowerCase().includes(tok))) textTokenMatches += 2;
        if (game.gameplayTags.some(t => t.toLowerCase().includes(tok))) textTokenMatches += 2;
        if (game.atmosphereTags.some(a => a.toLowerCase().includes(tok))) textTokenMatches += 2;
        if (game.description.toLowerCase().includes(tok)) textTokenMatches += 1;
      });
      score += Math.min(40, textTokenMatches * 5);

      if (selectedWorld !== 'all') {
        if (game.worldType === selectedWorld) {
          score += 15;
          reasons.push(`Matches ${selectedWorld} world`);
        }
      } else if (parsedIntent.detectedWorld && game.worldType === parsedIntent.detectedWorld) {
        score += 15;
        reasons.push(`Features ${game.worldType} world`);
      }

      if (selectedCombat !== 'all') {
        if (game.combatStyle === selectedCombat) {
          score += 15;
          reasons.push(`Features ${selectedCombat} combat`);
        }
      } else if (parsedIntent.detectedCombat && game.combatStyle === parsedIntent.detectedCombat) {
        score += 15;
        reasons.push(`Features ${game.combatStyle} combat`);
      }

      if (selectedExploration !== 'all' && game.explorationLevel === selectedExploration) {
        score += 10;
        reasons.push(`Offers ${selectedExploration} exploration`);
      }

      const compatibility = checkCompatibility(game);
      const isPlayable = compatibility.status === 'meets_recommended' || compatibility.status === 'meets_minimum';

      if (parsedIntent.lowEndIntent || onlyFitMyRig) {
        if (isPlayable) {
          score += 20;
          reasons.push(`Runs on your ${hardware.name}`);
        } else {
          score -= 30;
        }
      }

      return {
        game,
        score: Math.max(10, Math.min(100, score)),
        reasons: reasons.slice(0, 3),
        compatibility,
      };
    })
    .filter(item => {
      if (onlyFitMyRig) {
        return item.compatibility.status !== 'below_minimum' && item.compatibility.status !== 'unsupported_platform';
      }
      return true;
    })
    .sort((a, b) => b.score - a.score);
  }, [promptText, selectedWorld, selectedCombat, selectedExploration, onlyFitMyRig, hardware, parsedIntent]);

  return (
    <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-[#DCDCD4] pb-6 space-y-2">
        <div className="text-[11px] font-mono font-semibold uppercase text-[#85867F]">
          NATURAL QUERY INTERPRETER
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#20211F] tracking-tight">
          Describe what you want to play
        </h1>
        <p className="text-sm text-[#686A64] max-w-2xl leading-relaxed">
          Describe the mood, combat mechanics, and setting in your own words. GameFit translates your intent into structured attributes and checks device headroom.
        </p>
      </div>

      {/* Query Input Box */}
      <div className="bg-white border border-[#DCDCD4] rounded-[10px] p-6 sm:p-8 space-y-5 shadow-xs">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#686A64] mb-2">
            Your Desired Gaming Experience
          </label>
          <textarea
            rows={3}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Describe what you want to play..."
            className="w-full p-4 text-sm bg-[#F6F5F1] border border-[#DCDCD4] rounded-[8px] text-[#20211F] placeholder-[#85867F] focus:outline-none focus:bg-white focus:border-[#C85B38] leading-relaxed"
          />
        </div>

        {/* Sample Prompt Chips */}
        <div>
          <span className="text-xs text-[#85867F] font-medium mr-2">Try examples:</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {samplePrompts.map((sp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPromptText(sp)}
                className="text-xs text-[#20211F] bg-[#EEEDE7] hover:bg-[#E8E7E0] px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer text-left"
              >
                "{sp}"
              </button>
            ))}
          </div>
        </div>

        {/* Refinements */}
        <div className="pt-4 border-t border-[#E8E7E0] grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#686A64] mb-1">World Type:</label>
            <select
              value={selectedWorld}
              onChange={(e) => setSelectedWorld(e.target.value)}
              className="w-full bg-[#F6F5F1] border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F]"
            >
              <option value="all">Any World Design</option>
              <option value="open-world">Open World</option>
              <option value="semi-open">Semi-Open / Hubs</option>
              <option value="linear">Linear / Stage</option>
              <option value="procedural">Procedural / Infinite</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#686A64] mb-1">Combat Focus:</label>
            <select
              value={selectedCombat}
              onChange={(e) => setSelectedCombat(e.target.value)}
              className="w-full bg-[#F6F5F1] border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F]"
            >
              <option value="all">Any Combat Style</option>
              <option value="action-melee">Melee / Swords</option>
              <option value="shooter">Shooter / Guns</option>
              <option value="turn-based">Turn-Based / Tactical</option>
              <option value="platforming">Precision Platforming</option>
              <option value="peaceful">Peaceful / No Combat</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#686A64] mb-1">Exploration Depth:</label>
            <select
              value={selectedExploration}
              onChange={(e) => setSelectedExploration(e.target.value)}
              className="w-full bg-[#F6F5F1] border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F]"
            >
              <option value="all">Any Exploration</option>
              <option value="deep">Deep Exploration</option>
              <option value="moderate">Moderate</option>
              <option value="minimal">Minimal / Linear</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 p-2 bg-[#F6E8E1] border border-[#C85B38]/30 rounded-[6px] text-[#20211F] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyFitMyRig}
                onChange={(e) => setOnlyFitMyRig(e.target.checked)}
                className="w-4 h-4 rounded text-[#C85B38] focus:ring-[#C85B38] border-[#DCDCD4]"
              />
              <span className="font-semibold text-[11px] truncate">Fit My Rig ({hardware.name.split('·')[0]})</span>
            </label>
          </div>
        </div>
      </div>

      {/* Discovered Matches */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#20211F]">
            Top Discovered Matches ({matchedGames.length})
          </h2>
          <span className="text-xs text-[#85867F]">
            Ranked by intent relevance and verified compatibility
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {matchedGames.map(({ game, score, reasons }) => (
            <div key={game.id} className="flex flex-col space-y-2">
              <GameCard game={game} onSelect={onSelectGame} />
              <div className="p-3 bg-white border border-[#DCDCD4] rounded-[8px] text-xs space-y-1 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#20211F]">Intent Match</span>
                  <span className="font-mono text-[#C85B38] font-bold text-[11px]">{score}% Match</span>
                </div>
                {reasons.length > 0 ? (
                  <ul className="text-[11px] text-[#686A64] space-y-0.5">
                    {reasons.map((r, i) => (
                      <li key={i} className="truncate">· {r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-[#85867F]">Matched via genre taxonomy.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
