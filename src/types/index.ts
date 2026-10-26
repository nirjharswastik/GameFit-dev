import { ComponentComparisonResult } from './hardware';

export type Platform = 'pc' | 'android' | 'ios';

export type ProvenanceConfidence = 'publisher-direct' | 'verified-storefront' | 'community-tested';

export interface DataProvenance {
  sourceName: string;
  sourceUrl: string;
  lastVerified: string;
  confidence: ProvenanceConfidence;
  verificationNotes?: string;
}

export interface SystemRequirements {
  os: string;
  osFamily: 'windows' | 'macos' | 'linux';
  cpu: string;
  cpuTier: number; // 1 (lowest / dual-core) to 10 (ultra high-end)
  gpu: string;
  gpuTier: number; // 1 (basic integrated) to 10 (top-tier discrete)
  vramGb: number;
  ramGb: number;
  storageGb: number;
  storageType?: 'SSD' | 'HDD' | 'SSD Recommended';
  notes?: string;
}

export interface MobileRequirements {
  minOs: string; // e.g. "Android 10.0+" or "iOS 15.0+"
  minChipsetTier: number; // 1 (entry) to 8 (flagship)
  recommendedChipsetTier?: number;
  minRamGb: number;
  storageGb: number;
  targetGpuDesc?: string;
  knownLimitations?: string;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  releaseYear: number;
  developer: string;
  publisher: string;
  platforms: Platform[];
  genres: string[];
  gameplayTags: string[];
  atmosphereTags: string[];
  worldType: 'open-world' | 'linear' | 'semi-open' | 'arena' | 'procedural';
  combatStyle: 'action-melee' | 'shooter' | 'turn-based' | 'tactical' | 'peaceful' | 'platforming';
  explorationLevel: 'deep' | 'moderate' | 'minimal';
  storyFocus: 'heavy' | 'moderate' | 'ambient' | 'minimal';
  images: {
    cover: string;
    hero?: string;
    accentColor: string;
  };
  pcRequirements?: {
    minimum: SystemRequirements;
    recommended: SystemRequirements;
  };
  mobileRequirements?: {
    android?: MobileRequirements;
    ios?: MobileRequirements;
  };
  provenance: DataProvenance;
  estimatedTargetTier: {
    minimumTier: number; // 1-10 overall
    recommendedTier: number;
  };
}

export interface HardwarePreset {
  id: string;
  name: string;
  category: 'pc' | 'mobile';
  tagline: string;
  platform: Platform;
  cpu: string;
  cpuTier: number;
  gpu: string;
  gpuTier: number;
  ramGb: number;
  os: string;
  storageFreeGb: number;
  targetResolution: '720p' | '1080p' | '1440p' | '4k';
  deviceModel?: string;
}

export interface SpecCheck {
  status: 'pass' | 'fail' | 'warning' | 'uncertain';
  required: string;
  userHas: string;
  metricLabel: string;
  message: string;
  comparisonResult?: ComponentComparisonResult;
  confidence?: 'high' | 'medium' | 'low';
}

export interface CompatibilityResult {
  status: 'meets_recommended' | 'meets_minimum' | 'below_minimum' | 'uncertain' | 'unsupported_platform';
  statusLabel: string;
  summary: string;
  overallScorePercent: number; // 0-100%
  checks: {
    cpu: SpecCheck;
    gpu: SpecCheck;
    ram: SpecCheck;
    storage: SpecCheck;
    os: SpecCheck;
  };
  limitingBottleneck?: string;
  headroomDescription: string;
  resolutionImpactNote: string;
  confidence?: 'high' | 'medium' | 'low';
  hasVerifiedRecommended?: boolean;
}

export interface AlternativeRecommendation {
  game: Game;
  similarityScore: number; // 0-100
  similarityBreakdown: {
    genreMatch: number;
    gameplayMatch: number;
    worldMatch: number;
    atmosphereMatch: number;
  };
  reasons: string[];
  hardwareVerdict: 'runs_better' | 'runs_same' | 'more_demanding' | 'uncertain';
  hardwareSuitabilityMessage: string;
  headroomImprovementPercent: number;
}
