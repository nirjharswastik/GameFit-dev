import { AlternativeRecommendation, Game, HardwarePreset } from '../types';
import { checkGameCompatibility } from './compatibility';

export function calculateGameSimilarity(gameA: Game, gameB: Game): {
  totalScore: number;
  breakdown: { genreMatch: number; gameplayMatch: number; worldMatch: number; atmosphereMatch: number };
  reasons: string[];
} {
  const reasons: string[] = [];

  // 1. Genre Overlap (30%)
  const sharedGenres = gameA.genres.filter(g => gameB.genres.includes(g));
  const genreRatio = sharedGenres.length / Math.max(1, Math.min(gameA.genres.length, gameB.genres.length));
  const genreScore = Math.min(30, Math.round(genreRatio * 30));
  if (sharedGenres.length > 0) {
    reasons.push(`Shares ${sharedGenres.slice(0, 2).join(' & ')} core style`);
  }

  // 2. Gameplay Tags Overlap (25%)
  const sharedGameplay = gameA.gameplayTags.filter(t => gameB.gameplayTags.includes(t));
  const gameplayRatio = sharedGameplay.length / Math.max(1, Math.min(gameA.gameplayTags.length, gameB.gameplayTags.length));
  const gameplayScore = Math.min(25, Math.round(gameplayRatio * 25));
  if (sharedGameplay.length > 0) {
    reasons.push(`Similar mechanics: ${sharedGameplay.slice(0, 2).join(', ')}`);
  }

  // 3. World & Exploration Match (20%)
  let worldScore = 0;
  if (gameA.worldType === gameB.worldType) {
    worldScore += 10;
    reasons.push(`Both feature ${gameA.worldType.replace('-', ' ')} world design`);
  }
  if (gameA.explorationLevel === gameB.explorationLevel) {
    worldScore += 10;
  }

  // 4. Atmosphere & Story Match (15%)
  const sharedAtmo = gameA.atmosphereTags.filter(t => gameB.atmosphereTags.includes(t));
  const atmoRatio = sharedAtmo.length / Math.max(1, Math.min(gameA.atmosphereTags.length, gameB.atmosphereTags.length));
  const atmoScore = Math.min(15, Math.round(atmoRatio * 15));
  if (sharedAtmo.length > 0) {
    reasons.push(`Shared tone: ${sharedAtmo.slice(0, 2).join(', ')}`);
  }

  // 5. Combat style match (10%)
  let combatScore = 0;
  if (gameA.combatStyle === gameB.combatStyle) {
    combatScore = 10;
    reasons.push(`Matching ${gameA.combatStyle.replace('-', ' ')} combat style`);
  }

  const totalScore = Math.min(100, genreScore + gameplayScore + worldScore + atmoScore + combatScore);

  return {
    totalScore,
    breakdown: {
      genreMatch: genreScore,
      gameplayMatch: gameplayScore,
      worldMatch: worldScore,
      atmosphereMatch: atmoScore,
    },
    reasons,
  };
}

export function getSimilarAndAlternativeGames(
  targetGame: Game,
  allGames: Game[],
  userHardware?: HardwarePreset
): AlternativeRecommendation[] {
  const candidates = allGames.filter(g => g.id !== targetGame.id);

  const results: AlternativeRecommendation[] = candidates.map(candidate => {
    const similarity = calculateGameSimilarity(targetGame, candidate);

    let hardwareVerdict: AlternativeRecommendation['hardwareVerdict'] = 'uncertain';
    let hardwareSuitabilityMessage = 'Hardware comparison pending device profile.';
    let headroomImprovementPercent = 0;

    if (userHardware) {
      const candidateComp = checkGameCompatibility(candidate, userHardware);
      const targetComp = checkGameCompatibility(targetGame, userHardware);

      const targetMinTier = targetGame.estimatedTargetTier.minimumTier;
      const candidateMinTier = candidate.estimatedTargetTier.minimumTier;

      headroomImprovementPercent = Math.max(0, Math.round(((targetMinTier - candidateMinTier) / Math.max(1, targetMinTier)) * 100));

      if (candidateComp.status === 'unsupported_platform') {
        hardwareVerdict = 'uncertain';
        hardwareSuitabilityMessage = `Not natively available on your current ${userHardware.platform.toUpperCase()} profile.`;
      } else if (targetComp.status === 'below_minimum' && (candidateComp.status === 'meets_minimum' || candidateComp.status === 'meets_recommended')) {
        hardwareVerdict = 'runs_better';
        hardwareSuitabilityMessage = `Compatible with your ${userHardware.gpu || userHardware.cpu}. Excellent playable alternative to ${targetGame.title}.`;
      } else if (candidateMinTier < targetMinTier) {
        hardwareVerdict = 'runs_better';
        hardwareSuitabilityMessage = `Requires ~${headroomImprovementPercent}% less hardware horsepower. Runs comfortably on your ${userHardware.gpu || userHardware.cpu}.`;
      } else if (candidateMinTier === targetMinTier) {
        hardwareVerdict = 'runs_same';
        hardwareSuitabilityMessage = `Similar hardware demand as ${targetGame.title}. Expected compatibility: ${candidateComp.statusLabel}.`;
      } else {
        hardwareVerdict = 'more_demanding';
        hardwareSuitabilityMessage = `More hardware-intensive than ${targetGame.title}.`;
      }
    } else {
      // General baseline comparison without user profile
      const targetMinTier = targetGame.estimatedTargetTier.minimumTier;
      const candidateMinTier = candidate.estimatedTargetTier.minimumTier;
      if (candidateMinTier < targetMinTier) {
        hardwareVerdict = 'runs_better';
        hardwareSuitabilityMessage = `Significantly lighter system requirements than ${targetGame.title}.`;
      } else if (candidateMinTier === targetMinTier) {
        hardwareVerdict = 'runs_same';
        hardwareSuitabilityMessage = `Comparable published minimum specifications.`;
      } else {
        hardwareVerdict = 'more_demanding';
        hardwareSuitabilityMessage = `Higher published minimum specifications.`;
      }
    }

    return {
      game: candidate,
      similarityScore: similarity.totalScore,
      similarityBreakdown: similarity.breakdown,
      reasons: similarity.reasons.length > 0 ? similarity.reasons : ['Shares genre and pacing elements'],
      hardwareVerdict,
      hardwareSuitabilityMessage,
      headroomImprovementPercent,
    };
  });

  // Sort by a composite ranking:
  // If user hardware is below minimum on target game, heavily boost lighter 'runs_better' alternatives!
  return results.sort((a, b) => {
    let scoreA = a.similarityScore;
    let scoreB = b.similarityScore;

    if (userHardware) {
      if (a.hardwareVerdict === 'runs_better') scoreA += 25;
      if (b.hardwareVerdict === 'runs_better') scoreB += 25;
      if (a.hardwareVerdict === 'more_demanding') scoreA -= 20;
      if (b.hardwareVerdict === 'more_demanding') scoreB -= 20;
    }

    return scoreB - scoreA;
  });
}

export interface NaturalSearchQuery {
  rawText: string;
  detectedGenres: string[];
  detectedWorld?: string;
  detectedCombat?: string;
  lowEndIntent: boolean;
}

export function parseNaturalLanguageQuery(query: string): NaturalSearchQuery {
  const text = query.toLowerCase();

  const detectedGenres: string[] = [];
  if (text.includes('rpg') || text.includes('role playing')) detectedGenres.push('Action RPG', 'RPG');
  if (text.includes('open world') || text.includes('sandbox')) detectedGenres.push('Open World');
  if (text.includes('indie')) detectedGenres.push('Indie');
  if (text.includes('action') || text.includes('hack and slash')) detectedGenres.push('Action');
  if (text.includes('roguelike') || text.includes('roguelite')) detectedGenres.push('Action Roguelike');
  if (text.includes('cozy') || text.includes('farming') || text.includes('relaxing')) detectedGenres.push('Cozy', 'Farming Sim');
  if (text.includes('platformer') || text.includes('jump')) detectedGenres.push('Platformer');
  if (text.includes('shooter') || text.includes('fps')) detectedGenres.push('Shooter', 'First-Person Shooter');

  let detectedCombat: string | undefined;
  if (text.includes('sword') || text.includes('melee') || text.includes('combat') || text.includes('fight')) {
    detectedCombat = 'action-melee';
  } else if (text.includes('turn based') || text.includes('tactical') || text.includes('strategy')) {
    detectedCombat = 'turn-based';
  } else if (text.includes('peaceful') || text.includes('farming') || text.includes('relax')) {
    detectedCombat = 'peaceful';
  }

  let detectedWorld: string | undefined;
  if (text.includes('open world') || text.includes('vast')) detectedWorld = 'open-world';
  else if (text.includes('linear') || text.includes('level based')) detectedWorld = 'linear';

  const lowEndIntent =
    text.includes('low end') ||
    text.includes('low-end') ||
    text.includes('integrated') ||
    text.includes('laptop') ||
    text.includes('potato') ||
    text.includes('weak pc') ||
    text.includes('old pc') ||
    text.includes('budget');

  return {
    rawText: query,
    detectedGenres,
    detectedWorld,
    detectedCombat,
    lowEndIntent,
  };
}
