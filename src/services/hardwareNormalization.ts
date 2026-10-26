/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  NORMALIZED_CPUS,
  NORMALIZED_GPUS,
  NORMALIZED_MOBILE_SOCS,
} from '../data/hardwareDatabase';
import { HardwareType, NormalizedHardwareRecord } from '../types/hardware';

export interface ResolutionResult {
  record?: NormalizedHardwareRecord;
  confidence: 'high' | 'medium' | 'low' | 'none';
  matchType: 'exact' | 'alias' | 'fuzzy' | 'unknown';
  normalizedInput: string;
  isAmbiguous?: boolean;
  ambiguousCandidates?: string[];
  inferredVramGb?: number;
}

// In-memory cache to prevent repeated parsing of the same strings
const resolutionCache = new Map<string, ResolutionResult>();

/**
 * Clean and standardize raw hardware strings
 */
export function cleanHardwareString(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[®™]/g, '')
    .replace(/[\(\)\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract VRAM in GB from a string (e.g. "8GB", "12 GB VRAM")
 */
export function extractVramFromInput(input: string): number | undefined {
  const match = input.match(/(\d{1,2})\s*(?:gb|gigabytes?)/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val > 0 && val <= 48) {
      return val;
    }
  }
  return undefined;
}

/**
 * Inverted alias index for O(1) matching
 */
const gpuAliasMap = new Map<string, NormalizedHardwareRecord>();
const cpuAliasMap = new Map<string, NormalizedHardwareRecord>();
const mobileSocAliasMap = new Map<string, NormalizedHardwareRecord>();

// Populate indexes
function buildIndexes() {
  for (const gpu of NORMALIZED_GPUS) {
    gpuAliasMap.set(cleanHardwareString(gpu.canonicalName), gpu);
    gpuAliasMap.set(cleanHardwareString(gpu.modelIdentifier), gpu);
    for (const alias of gpu.aliases) {
      gpuAliasMap.set(cleanHardwareString(alias), gpu);
    }
  }

  for (const cpu of NORMALIZED_CPUS) {
    cpuAliasMap.set(cleanHardwareString(cpu.canonicalName), cpu);
    cpuAliasMap.set(cleanHardwareString(cpu.modelIdentifier), cpu);
    for (const alias of cpu.aliases) {
      cpuAliasMap.set(cleanHardwareString(alias), cpu);
    }
  }

  for (const soc of NORMALIZED_MOBILE_SOCS) {
    mobileSocAliasMap.set(cleanHardwareString(soc.canonicalName), soc);
    mobileSocAliasMap.set(cleanHardwareString(soc.modelIdentifier), soc);
    for (const alias of soc.aliases) {
      mobileSocAliasMap.set(cleanHardwareString(alias), soc);
    }
  }
}

buildIndexes();

/**
 * Resolves a Desktop GPU input string to a canonical record
 */
export function resolveGpuModel(rawInput: string): ResolutionResult {
  const cleaned = cleanHardwareString(rawInput);
  if (!cleaned) {
    return { confidence: 'none', matchType: 'unknown', normalizedInput: cleaned };
  }

  const cacheKey = `gpu:${cleaned}`;
  if (resolutionCache.has(cacheKey)) {
    return resolutionCache.get(cacheKey)!;
  }

  const inferredVramGb = extractVramFromInput(rawInput);

  // 1. Direct Alias Index Match
  if (gpuAliasMap.has(cleaned)) {
    const res: ResolutionResult = {
      record: gpuAliasMap.get(cleaned),
      confidence: 'high',
      matchType: 'exact',
      normalizedInput: cleaned,
      inferredVramGb,
    };
    resolutionCache.set(cacheKey, res);
    return res;
  }

  // 2. Stripped noise match (remove "nvidia", "geforce", "amd", "radeon", "intel")
  const stripped = cleaned
    .replace(/\b(nvidia|geforce|amd|radeon|intel|graphics|edition|gaming|series|discrete|card)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (gpuAliasMap.has(stripped)) {
    const res: ResolutionResult = {
      record: gpuAliasMap.get(stripped),
      confidence: 'high',
      matchType: 'alias',
      normalizedInput: cleaned,
      inferredVramGb,
    };
    resolutionCache.set(cacheKey, res);
    return res;
  }

  // 3. Ambiguity check: If input is broad (e.g. "rtx", "geforce", "radeon", "arc") with no model number
  if (/^(rtx|gtx|geforce|radeon|rx|arc)$/.test(stripped) || stripped.length < 3) {
    const res: ResolutionResult = {
      confidence: 'none',
      matchType: 'unknown',
      normalizedInput: cleaned,
      isAmbiguous: true,
      ambiguousCandidates: ['Please specify exact model number (e.g., RTX 5060, RX 580, Arc A750)'],
    };
    resolutionCache.set(cacheKey, res);
    return res;
  }

  // 4. Controlled Token / Identifier Matching
  // Extract number sequences (e.g. 5060, 4060, 1060, 580, 7800, 770)
  const numbers = cleaned.match(/\b\d{3,4}\b/g) || [];
  const candidates: NormalizedHardwareRecord[] = [];

  for (const gpu of NORMALIZED_GPUS) {
    const gpuClean = cleanHardwareString(gpu.canonicalName);
    // Ensure all numeric identifiers match
    const matchesAllNumbers = numbers.length > 0 && numbers.every(num => gpuClean.includes(num));
    
    // Check key prefixes to prevent matching RTX 4060 with RTX 4060 Ti incorrectly unless specified
    const isTiRequested = cleaned.includes('ti') || cleaned.includes('super');
    const isGpuTi = gpuClean.includes('ti') || gpuClean.includes('super');
    
    if (matchesAllNumbers && (isTiRequested === isGpuTi || !isTiRequested)) {
      candidates.push(gpu);
    }
  }

  if (candidates.length === 1) {
    const res: ResolutionResult = {
      record: candidates[0],
      confidence: 'high',
      matchType: 'fuzzy',
      normalizedInput: cleaned,
      inferredVramGb,
    };
    resolutionCache.set(cacheKey, res);
    return res;
  } else if (candidates.length > 1) {
    // Check if one has exact model identifier match
    const exactModel = candidates.find(c => cleaned.includes(cleanHardwareString(c.modelIdentifier)));
    if (exactModel) {
      const res: ResolutionResult = {
        record: exactModel,
        confidence: 'medium',
        matchType: 'fuzzy',
        normalizedInput: cleaned,
        inferredVramGb,
      };
      resolutionCache.set(cacheKey, res);
      return res;
    }

    const res: ResolutionResult = {
      confidence: 'low',
      matchType: 'unknown',
      normalizedInput: cleaned,
      isAmbiguous: true,
      ambiguousCandidates: candidates.map(c => c.canonicalName),
    };
    resolutionCache.set(cacheKey, res);
    return res;
  }

  const res: ResolutionResult = {
    confidence: 'none',
    matchType: 'unknown',
    normalizedInput: cleaned,
    inferredVramGb,
  };
  resolutionCache.set(cacheKey, res);
  return res;
}

/**
 * Resolves a Desktop CPU input string to a canonical record
 */
export function resolveCpuModel(rawInput: string): ResolutionResult {
  const cleaned = cleanHardwareString(rawInput);
  if (!cleaned) {
    return { confidence: 'none', matchType: 'unknown', normalizedInput: cleaned };
  }

  const cacheKey = `cpu:${cleaned}`;
  if (resolutionCache.has(cacheKey)) {
    return resolutionCache.get(cacheKey)!;
  }

  // 1. Direct Alias Match
  if (cpuAliasMap.has(cleaned)) {
    const res: ResolutionResult = {
      record: cpuAliasMap.get(cleaned),
      confidence: 'high',
      matchType: 'exact',
      normalizedInput: cleaned,
    };
    resolutionCache.set(cacheKey, res);
    return res;
  }

  // 2. Stripped noise match
  const stripped = cleaned
    .replace(/\b(intel|amd|core|processor|cpu|series|unlocked)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cpuAliasMap.has(stripped)) {
    const res: ResolutionResult = {
      record: cpuAliasMap.get(stripped),
      confidence: 'high',
      matchType: 'alias',
      normalizedInput: cleaned,
    };
    resolutionCache.set(cacheKey, res);
    return res;
  }

  // 3. Ambiguity check: user enters just "i5", "i7", "ryzen 5", "core i5"
  if (/^(i3|i5|i7|i9|ryzen\s*3|ryzen\s*5|ryzen\s*7|ryzen\s*9|ryzen|core)$/.test(stripped) || stripped.length < 3) {
    const res: ResolutionResult = {
      confidence: 'none',
      matchType: 'unknown',
      normalizedInput: cleaned,
      isAmbiguous: true,
      ambiguousCandidates: ['Please provide processor model number (e.g. i5-12400F, Ryzen 5 3600)'],
    };
    resolutionCache.set(cacheKey, res);
    return res;
  }

  // 4. Controlled Model Number Matching
  const numbers = cleaned.match(/\b\d{4,5}[a-z0-9]*\b|\be\d{4}\b/g) || [];
  const candidates: NormalizedHardwareRecord[] = [];

  for (const cpu of NORMALIZED_CPUS) {
    const cpuClean = cleanHardwareString(cpu.canonicalName);
    const matchesNumber = numbers.length > 0 && numbers.some(num => cpuClean.includes(num));
    if (matchesNumber) {
      candidates.push(cpu);
    }
  }

  if (candidates.length === 1) {
    const res: ResolutionResult = {
      record: candidates[0],
      confidence: 'high',
      matchType: 'fuzzy',
      normalizedInput: cleaned,
    };
    resolutionCache.set(cacheKey, res);
    return res;
  } else if (candidates.length > 1) {
    const exactModel = candidates.find(c => cleaned.includes(cleanHardwareString(c.modelIdentifier)));
    if (exactModel) {
      const res: ResolutionResult = {
        record: exactModel,
        confidence: 'medium',
        matchType: 'fuzzy',
        normalizedInput: cleaned,
      };
      resolutionCache.set(cacheKey, res);
      return res;
    }

    const res: ResolutionResult = {
      confidence: 'low',
      matchType: 'unknown',
      normalizedInput: cleaned,
      isAmbiguous: true,
      ambiguousCandidates: candidates.map(c => c.canonicalName),
    };
    resolutionCache.set(cacheKey, res);
    return res;
  }

  const res: ResolutionResult = {
    confidence: 'none',
    matchType: 'unknown',
    normalizedInput: cleaned,
  };
  resolutionCache.set(cacheKey, res);
  return res;
}

/**
 * Resolves a Mobile SoC input string to a canonical record
 * Strictly distinguishes 8 Gen 3 vs 8s Gen 3, and 7s Gen 2 vs 7s Gen 3.
 */
export function resolveMobileSoc(rawInput: string): ResolutionResult {
  const cleaned = cleanHardwareString(rawInput);
  if (!cleaned) {
    return { confidence: 'none', matchType: 'unknown', normalizedInput: cleaned };
  }

  const cacheKey = `soc:${cleaned}`;
  if (resolutionCache.has(cacheKey)) {
    return resolutionCache.get(cacheKey)!;
  }

  // 1. Direct Alias Match
  if (mobileSocAliasMap.has(cleaned)) {
    const res: ResolutionResult = {
      record: mobileSocAliasMap.get(cleaned),
      confidence: 'high',
      matchType: 'exact',
      normalizedInput: cleaned,
    };
    resolutionCache.set(cacheKey, res);
    return res;
  }

  // 2. Strict distinguishing of Snapdragon Gen variants
  // Check exact tokens for "8s", "7s", "7+", "8+"
  if (cleaned.includes('8s gen 3') || cleaned.includes('8sgen3') || cleaned.includes('sm8635')) {
    const record = NORMALIZED_MOBILE_SOCS.find(s => s.id === 'soc-snapdragon-8s-gen-3');
    if (record) {
      const res: ResolutionResult = { record, confidence: 'high', matchType: 'exact', normalizedInput: cleaned };
      resolutionCache.set(cacheKey, res);
      return res;
    }
  }

  if (cleaned.includes('7s gen 2') || cleaned.includes('7sgen2') || cleaned.includes('sm7435')) {
    const record = NORMALIZED_MOBILE_SOCS.find(s => s.id === 'soc-snapdragon-7s-gen-2');
    if (record) {
      const res: ResolutionResult = { record, confidence: 'high', matchType: 'exact', normalizedInput: cleaned };
      resolutionCache.set(cacheKey, res);
      return res;
    }
  }

  if (cleaned.includes('7s gen 3') || cleaned.includes('7sgen3')) {
    const record = NORMALIZED_MOBILE_SOCS.find(s => s.id === 'soc-snapdragon-7s-gen-3');
    if (record) {
      const res: ResolutionResult = { record, confidence: 'high', matchType: 'exact', normalizedInput: cleaned };
      resolutionCache.set(cacheKey, res);
      return res;
    }
  }

  if (cleaned.includes('8 gen 3') || cleaned.includes('8gen3') || cleaned.includes('sd8g3') || cleaned.includes('sm8650')) {
    // Ensure it's not 8s
    if (!cleaned.includes('8s')) {
      const record = NORMALIZED_MOBILE_SOCS.find(s => s.id === 'soc-snapdragon-8-gen-3');
      if (record) {
        const res: ResolutionResult = { record, confidence: 'high', matchType: 'exact', normalizedInput: cleaned };
        resolutionCache.set(cacheKey, res);
        return res;
      }
    }
  }

  // 3. iPhone model shorthand
  if (cleaned.includes('iphone 15 pro')) {
    const record = NORMALIZED_MOBILE_SOCS.find(s => s.id === 'soc-apple-a17-pro');
    if (record) {
      const res: ResolutionResult = { record, confidence: 'high', matchType: 'alias', normalizedInput: cleaned };
      resolutionCache.set(cacheKey, res);
      return res;
    }
  }
  if (cleaned.includes('iphone 13') || cleaned.includes('iphone 14')) {
    const record = NORMALIZED_MOBILE_SOCS.find(s => s.id === 'soc-apple-a15-bionic');
    if (record) {
      const res: ResolutionResult = { record, confidence: 'high', matchType: 'alias', normalizedInput: cleaned };
      resolutionCache.set(cacheKey, res);
      return res;
    }
  }
  if (cleaned.includes('iphone 11')) {
    const record = NORMALIZED_MOBILE_SOCS.find(s => s.id === 'soc-apple-a13-bionic');
    if (record) {
      const res: ResolutionResult = { record, confidence: 'high', matchType: 'alias', normalizedInput: cleaned };
      resolutionCache.set(cacheKey, res);
      return res;
    }
  }

  // 4. Ambiguity check: Broad generic brand
  if (/^(snapdragon|dimensity|qualcomm|mediatek|exynos|tensor)$/.test(cleaned) || cleaned.length < 3) {
    const res: ResolutionResult = {
      confidence: 'none',
      matchType: 'unknown',
      normalizedInput: cleaned,
      isAmbiguous: true,
      ambiguousCandidates: ['Please specify chipset model (e.g. Snapdragon 8 Gen 3, Dimensity 1080)'],
    };
    resolutionCache.set(cacheKey, res);
    return res;
  }

  // 5. Fallback iterative scan
  for (const soc of NORMALIZED_MOBILE_SOCS) {
    const cleanId = cleanHardwareString(soc.modelIdentifier);
    if (cleaned.includes(cleanId)) {
      const res: ResolutionResult = {
        record: soc,
        confidence: 'medium',
        matchType: 'fuzzy',
        normalizedInput: cleaned,
      };
      resolutionCache.set(cacheKey, res);
      return res;
    }
  }

  const res: ResolutionResult = {
    confidence: 'none',
    matchType: 'unknown',
    normalizedInput: cleaned,
  };
  resolutionCache.set(cacheKey, res);
  return res;
}

/**
 * Helper to split multi-model requirement strings
 * e.g., "NVIDIA GeForce GTX 1060 3GB or AMD Radeon RX 580 4GB"
 * returns ["NVIDIA GeForce GTX 1060 3GB", "AMD Radeon RX 580 4GB"]
 */
export function splitRequirementModels(reqString: string): string[] {
  if (!reqString) return [];
  // Split on " or ", " / ", " /", "/ "
  return reqString
    .split(/\s+or\s+|\s*\/\s*|\s*,\s*(?=[a-zA-Z])/i)
    .map(s => s.trim())
    .filter(Boolean);
}
