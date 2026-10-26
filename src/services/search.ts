import { CURATED_GAMES } from '../data/games';
import { Game, HardwarePreset, Platform } from '../types';
import { checkGameCompatibility } from './compatibility';

export interface SearchResultItem {
  game: Game;
  score: number;
  matchType: 'exact-title' | 'prefix-title' | 'partial-title' | 'tag-match' | 'natural-intent';
  matchReason: string;
  matchedHighlightRange?: [number, number]; // for title substring highlight
}

export interface SearchEngineOptions {
  query: string;
  platform?: Platform | 'all';
  genre?: string;
  hardwareFilter?: boolean;
  hardware?: HardwarePreset;
}

/**
 * Shared deterministic search engine used across Homepage, Catalog, and Discovery
 */
export function executeSearch(options: SearchEngineOptions, games = CURATED_GAMES): SearchResultItem[] {
  const { query, platform = 'all', genre = 'all', hardwareFilter = false, hardware } = options;
  const rawQ = query.trim();
  const lowerQ = rawQ.toLowerCase();

  // If no search query and no filters, return default list sorted by relevance
  if (!rawQ && platform === 'all' && genre === 'all' && !hardwareFilter) {
    return games.map(g => ({
      game: g,
      score: 100,
      matchType: 'partial-title',
      matchReason: 'Curated featured title',
    }));
  }

  const results: SearchResultItem[] = [];

  for (const game of games) {
    // 1. Platform check
    if (platform !== 'all' && !game.platforms.includes(platform)) {
      continue;
    }

    // 2. Genre check
    if (genre !== 'all' && !game.genres.includes(genre)) {
      continue;
    }

    // 3. Hardware compatibility filter check
    if (hardwareFilter && hardware) {
      const comp = checkGameCompatibility(game, hardware);
      if (comp.status === 'below_minimum' || comp.status === 'unsupported_platform') {
        continue;
      }
    }

    // If query is empty, it matched the filters
    if (!rawQ) {
      results.push({
        game,
        score: 100,
        matchType: 'partial-title',
        matchReason: 'Matches active filters',
      });
      continue;
    }

    const titleLower = game.title.toLowerCase();
    let score = 0;
    let matchType: SearchResultItem['matchType'] = 'tag-match';
    let matchReason = '';
    let matchedHighlightRange: [number, number] | undefined;

    // A. Exact title match
    if (titleLower === lowerQ) {
      score = 1000;
      matchType = 'exact-title';
      matchReason = 'Exact title match';
      matchedHighlightRange = [0, game.title.length];
    }
    // B. Title prefix match
    else if (titleLower.startsWith(lowerQ)) {
      score = 800;
      matchType = 'prefix-title';
      matchReason = 'Title begins with query';
      matchedHighlightRange = [0, rawQ.length];
    }
    // C. Title partial match
    else if (titleLower.includes(lowerQ)) {
      score = 600;
      matchType = 'partial-title';
      matchReason = 'Title contains query';
      const startIndex = titleLower.indexOf(lowerQ);
      matchedHighlightRange = [startIndex, startIndex + rawQ.length];
    }
    // D. Developer or Publisher match
    else if (game.developer.toLowerCase().includes(lowerQ) || game.publisher.toLowerCase().includes(lowerQ)) {
      score = 400;
      matchType = 'tag-match';
      matchReason = `Developer: ${game.developer}`;
    }
    // E. Genre match
    else if (game.genres.some(g => g.toLowerCase().includes(lowerQ))) {
      score = 300;
      const matchedGenre = game.genres.find(g => g.toLowerCase().includes(lowerQ));
      matchType = 'tag-match';
      matchReason = `Genre: ${matchedGenre}`;
    }
    // F. Gameplay tags & atmosphere match
    else if (game.gameplayTags.some(t => t.toLowerCase().includes(lowerQ)) || game.atmosphereTags.some(a => a.toLowerCase().includes(lowerQ))) {
      score = 250;
      const matchedTag = game.gameplayTags.find(t => t.toLowerCase().includes(lowerQ)) || game.atmosphereTags.find(a => a.toLowerCase().includes(lowerQ));
      matchType = 'tag-match';
      matchReason = `Tag: ${matchedTag}`;
    }
    // G. Natural language token matching
    else {
      const tokens = lowerQ.split(/\s+/).filter(t => t.length > 2);
      let matchedTokensCount = 0;
      const reasonsList: string[] = [];

      for (const tok of tokens) {
        if (titleLower.includes(tok)) {
          matchedTokensCount += 2;
          reasonsList.push(`Title includes "${tok}"`);
        } else if (game.genres.some(g => g.toLowerCase().includes(tok))) {
          matchedTokensCount += 2;
          reasonsList.push(`Genre "${tok}"`);
        } else if (game.gameplayTags.some(t => t.toLowerCase().includes(tok))) {
          matchedTokensCount += 1.5;
          reasonsList.push(`Tag "${tok}"`);
        } else if (game.atmosphereTags.some(a => a.toLowerCase().includes(tok))) {
          matchedTokensCount += 1.5;
          reasonsList.push(`Atmosphere "${tok}"`);
        } else if (game.description.toLowerCase().includes(tok)) {
          matchedTokensCount += 0.8;
        }
      }

      if (matchedTokensCount > 0) {
        score = Math.round(matchedTokensCount * 50);
        matchType = 'natural-intent';
        matchReason = reasonsList.length > 0 ? reasonsList.slice(0, 2).join(' · ') : 'Content relevance';
      }
    }

    if (score > 0) {
      // Small bonus if user's hardware is compatible
      if (hardware) {
        const comp = checkGameCompatibility(game, hardware);
        if (comp.status === 'meets_recommended') score += 20;
        else if (comp.status === 'meets_minimum') score += 10;
      }

      results.push({
        game,
        score,
        matchType,
        matchReason,
        matchedHighlightRange,
      });
    }
  }

  // Sort descending by score
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Autocomplete suggestions for search input (limit to 5-8 items)
 */
export function getSearchSuggestions(query: string, maxSuggestions = 6): SearchResultItem[] {
  if (!query.trim()) return [];
  const results = executeSearch({ query, platform: 'all' });
  return results.slice(0, maxSuggestions);
}
