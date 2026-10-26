/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentComparisonResult } from '../types/hardware';
import {
  cleanHardwareString,
  ResolutionResult,
  resolveCpuModel,
  resolveGpuModel,
  resolveMobileSoc,
  splitRequirementModels,
} from './hardwareNormalization';

/**
 * Compare User GPU against Game Requirement (which may contain multiple example GPUs)
 */
export function compareGpus(
  userGpuInput: string,
  requiredGpuInput: string,
  options?: {
    requiredVramGb?: number;
    targetResolution?: '720p' | '1080p' | '1440p' | '4k';
    mandatoryFeatures?: {
      minDirectXFeatureLevel?: string;
      requiresRayTracing?: boolean;
    };
  }
): ComponentComparisonResult {
  const userRes = resolveGpuModel(userGpuInput);
  const targetRes = options?.targetResolution || '1080p';

  // Ambiguity in user input
  if (userRes.isAmbiguous) {
    return {
      status: 'uncertain',
      confidence: 'low',
      userHardware: userGpuInput,
      requiredHardware: requiredGpuInput,
      comparisonMethod: 'unknown',
      explanation: `Ambiguous GPU name "${userGpuInput}". ${userRes.ambiguousCandidates?.[0] || 'Please specify exact model number.'}`,
      sourceReferences: [],
      limitations: 'Model identifier cannot be resolved uniquely.',
    };
  }

  // Parse requirement string for multiple reference models (e.g. "GTX 1060 3GB or AMD Radeon RX 580 4GB")
  const requiredParts = splitRequirementModels(requiredGpuInput);
  const resolvedReqs: ResolutionResult[] = requiredParts.map(part => resolveGpuModel(part));

  // Find the most relevant resolved requirement model
  const reqRes = resolvedReqs.find(r => r.record) || resolvedReqs[0];

  // If user hardware cannot be resolved
  if (!userRes.record) {
    return {
      status: 'uncertain',
      confidence: 'low',
      userHardware: userGpuInput,
      requiredHardware: reqRes?.record?.canonicalName || requiredGpuInput,
      comparisonMethod: 'unknown',
      explanation: `Could not identify verified benchmark records for "${userGpuInput}". Hardware comparison is uncertain.`,
      sourceReferences: [],
      limitations: 'Missing verified hardware entry in local capability database.',
    };
  }

  // If requirement model cannot be resolved to a benchmark record
  if (!reqRes?.record) {
    return {
      status: 'uncertain',
      confidence: 'low',
      userHardware: userRes.record.canonicalName,
      requiredHardware: requiredGpuInput,
      comparisonMethod: 'unknown',
      explanation: `Published requirement model "${requiredGpuInput}" has not yet been mapped to a verified benchmark reference.`,
      sourceReferences: [],
      limitations: 'Requirement reference unverified.',
    };
  }

  const userRec = userRes.record;
  const reqRec = reqRes.record;

  // 1. Check Mandatory Hardware Features / APIs
  if (options?.mandatoryFeatures?.requiresRayTracing && !userRec.specifications.gpu?.hardwareRayTracing) {
    return {
      status: 'unsupported',
      confidence: 'high',
      userHardware: userRec.canonicalName,
      userRecord: userRec,
      requiredHardware: reqRec.canonicalName,
      requiredRecord: reqRec,
      comparisonMethod: 'architecture-capability',
      explanation: `${userRec.canonicalName} lacks hardware-accelerated ray tracing required by this title.`,
      missingFeatures: ['Hardware Ray Tracing (DirectX Raytracing / Vulkan RT)'],
      sourceReferences: userRec.sourceReferences,
    };
  }

  if (options?.mandatoryFeatures?.minDirectXFeatureLevel) {
    const requiredLevel = options.mandatoryFeatures.minDirectXFeatureLevel;
    const userLevel = userRec.specifications.gpu?.directXFeatureLevel;
    if (userLevel && userLevel < requiredLevel) {
      return {
        status: 'unsupported',
        confidence: 'high',
        userHardware: userRec.canonicalName,
        userRecord: userRec,
        requiredHardware: reqRec.canonicalName,
        requiredRecord: reqRec,
        comparisonMethod: 'architecture-capability',
        explanation: `${userRec.canonicalName} only supports DirectX Feature Level ${userLevel}, but game requires Feature Level ${requiredLevel}.`,
        missingFeatures: [`DirectX Feature Level ${requiredLevel}`],
        sourceReferences: userRec.sourceReferences,
      };
    }
  }

  // 2. VRAM Check
  const effectiveUserVram = userRes.inferredVramGb || userRec.specifications.gpu?.vramGb || 0;
  const reqVram = options?.requiredVramGb || reqRec.specifications.gpu?.vramGb || 0;
  if (reqVram > 0 && effectiveUserVram > 0 && effectiveUserVram < reqVram) {
    // If VRAM is strictly insufficient
    return {
      status: 'below',
      confidence: 'high',
      userHardware: `${userRec.canonicalName} (${effectiveUserVram}GB VRAM)`,
      userRecord: userRec,
      requiredHardware: `${reqRec.canonicalName} (${reqVram}GB VRAM)`,
      requiredRecord: reqRec,
      comparisonMethod: 'architecture-capability',
      explanation: `VRAM constraint: Your graphics card has ${effectiveUserVram} GB VRAM, but this requirement mandates at least ${reqVram} GB VRAM.`,
      missingFeatures: [`${reqVram - effectiveUserVram} GB VRAM shortfall`],
      sourceReferences: userRec.sourceReferences,
    };
  }

  // 3. Benchmark Capability Comparison
  // Primary benchmark: 3DMark TimeSpy Graphics
  const userBenchmark = userRec.benchmarks.find(b => b.benchmarkName === '3dmark-timespy-graphics');
  const reqBenchmark = reqRec.benchmarks.find(b => b.benchmarkName === '3dmark-timespy-graphics');

  let userScore = userBenchmark?.score || userRec.performanceIndex * 150;
  let reqScore = reqBenchmark?.score || reqRec.performanceIndex * 150;

  // Resolution demand multiplier
  const resMultiplier = targetRes === '720p' ? 0.8 : targetRes === '1440p' ? 1.4 : targetRes === '4k' ? 2.0 : 1.0;
  const adjustedReqScore = reqScore * resMultiplier;

  const performanceRatio = userScore / Math.max(1, reqScore);

  let status: ComponentComparisonResult['status'] = 'meets';
  let explanation = '';

  if (userScore >= adjustedReqScore) {
    status = 'meets';
    const ratioStr = performanceRatio >= 1.2 ? ` (${performanceRatio.toFixed(1)}x reference performance)` : '';
    explanation = `${userRec.canonicalName} meets the reference graphics performance of ${reqRec.canonicalName}${ratioStr} for ${targetRes} target.`;
  } else if (userScore >= reqScore * 0.85) {
    status = 'meets';
    explanation = `${userRec.canonicalName} is within operating margin of ${reqRec.canonicalName}. Playable at ${targetRes} with potential setting adjustments.`;
  } else {
    status = 'below';
    explanation = `${userRec.canonicalName} falls below the reference performance of ${reqRec.canonicalName} for ${targetRes} (${(performanceRatio * 100).toFixed(0)}% of required capability).`;
  }

  return {
    status,
    confidence: userBenchmark && reqBenchmark ? 'high' : 'medium',
    userHardware: userRec.canonicalName,
    userRecord: userRec,
    requiredHardware: reqRec.canonicalName,
    requiredRecord: reqRec,
    comparisonMethod: userBenchmark && reqBenchmark ? 'direct-benchmark' : 'normalized-performance',
    explanation,
    relativePerformanceRatio: performanceRatio,
    sourceReferences: [...userRec.sourceReferences, ...reqRec.sourceReferences],
  };
}

/**
 * Compare User CPU against Game Requirement
 * Evaluates single-core IPC, multi-core capacity, and instruction set support (e.g. AVX2).
 */
export function compareCpus(
  userCpuInput: string,
  requiredCpuInput: string,
  options?: {
    requiresAvx2?: boolean;
    minCores?: number;
  }
): ComponentComparisonResult {
  const userRes = resolveCpuModel(userCpuInput);

  if (userRes.isAmbiguous) {
    return {
      status: 'uncertain',
      confidence: 'low',
      userHardware: userCpuInput,
      requiredHardware: requiredCpuInput,
      comparisonMethod: 'unknown',
      explanation: `Ambiguous CPU name "${userCpuInput}". ${userRes.ambiguousCandidates?.[0] || 'Please provide exact model.'}`,
      sourceReferences: [],
    };
  }

  const requiredParts = splitRequirementModels(requiredCpuInput);
  const resolvedReqs = requiredParts.map(part => resolveCpuModel(part));
  const reqRes = resolvedReqs.find(r => r.record) || resolvedReqs[0];

  if (!userRes.record) {
    return {
      status: 'uncertain',
      confidence: 'low',
      userHardware: userCpuInput,
      requiredHardware: reqRes?.record?.canonicalName || requiredCpuInput,
      comparisonMethod: 'unknown',
      explanation: `Could not identify verified performance records for CPU "${userCpuInput}".`,
      sourceReferences: [],
    };
  }

  if (!reqRes?.record) {
    return {
      status: 'uncertain',
      confidence: 'low',
      userHardware: userRes.record.canonicalName,
      requiredHardware: requiredCpuInput,
      comparisonMethod: 'unknown',
      explanation: `Reference CPU requirement "${requiredCpuInput}" has not yet been mapped to a verified benchmark record.`,
      sourceReferences: [],
    };
  }

  const userRec = userRes.record;
  const reqRec = reqRes.record;

  // 1. Mandatory Instruction Set Checks
  if (options?.requiresAvx2) {
    const hasAvx2 = userRec.specifications.cpu?.instructionSets.includes('AVX2');
    if (!hasAvx2) {
      return {
        status: 'unsupported',
        confidence: 'high',
        userHardware: userRec.canonicalName,
        userRecord: userRec,
        requiredHardware: reqRec.canonicalName,
        requiredRecord: reqRec,
        comparisonMethod: 'architecture-capability',
        explanation: `${userRec.canonicalName} lacks AVX2 instruction set extensions required by this title.`,
        missingFeatures: ['AVX2 Vector Extensions'],
        sourceReferences: userRec.sourceReferences,
      };
    }
  }

  // 2. Physical Core Count Check
  if (options?.minCores && userRec.specifications.cpu) {
    if (userRec.specifications.cpu.cores < options.minCores) {
      return {
        status: 'below',
        confidence: 'high',
        userHardware: `${userRec.canonicalName} (${userRec.specifications.cpu.cores} cores)`,
        userRecord: userRec,
        requiredHardware: `${reqRec.canonicalName} (Minimum ${options.minCores} cores)`,
        requiredRecord: reqRec,
        comparisonMethod: 'architecture-capability',
        explanation: `Game mandates at least ${options.minCores} physical CPU cores. Your processor has ${userRec.specifications.cpu.cores} cores.`,
        sourceReferences: userRec.sourceReferences,
      };
    }
  }

  // 3. Sourced Benchmark Comparison (Single-Thread & Multi-Thread)
  const userSingle = userRec.benchmarks.find(b => b.benchmarkName === 'geekbench6-single')?.score || userRec.performanceIndex * 25;
  const reqSingle = reqRec.benchmarks.find(b => b.benchmarkName === 'geekbench6-single')?.score || reqRec.performanceIndex * 25;

  const userMulti = userRec.benchmarks.find(b => b.benchmarkName === 'geekbench6-multi')?.score || userRec.performanceIndex * 100;
  const reqMulti = reqRec.benchmarks.find(b => b.benchmarkName === 'geekbench6-multi')?.score || reqRec.performanceIndex * 100;

  // Game CPU performance is 60% single-thread IPC and 40% multi-thread throughput
  const userEffectiveScore = userSingle * 0.6 + (userMulti / 4) * 0.4;
  const reqEffectiveScore = reqSingle * 0.6 + (reqMulti / 4) * 0.4;

  const ratio = userEffectiveScore / Math.max(1, reqEffectiveScore);

  let status: ComponentComparisonResult['status'] = 'meets';
  let explanation = '';

  if (ratio >= 0.92) {
    status = 'meets';
    const margin = ratio >= 1.2 ? ` (~${((ratio - 1) * 100).toFixed(0)}% performance margin)` : '';
    explanation = `${userRec.canonicalName} meets or exceeds the processor capability of reference ${reqRec.canonicalName}${margin}.`;
  } else {
    status = 'below';
    explanation = `${userRec.canonicalName} single/multi-thread capability falls below reference ${reqRec.canonicalName} (${(ratio * 100).toFixed(0)}% of required baseline).`;
  }

  return {
    status,
    confidence: 'high',
    userHardware: userRec.canonicalName,
    userRecord: userRec,
    requiredHardware: reqRec.canonicalName,
    requiredRecord: reqRec,
    comparisonMethod: 'direct-benchmark',
    explanation,
    relativePerformanceRatio: ratio,
    sourceReferences: [...userRec.sourceReferences, ...reqRec.sourceReferences],
  };
}

/**
 * Compare Mobile SoC against Mobile Game Requirements
 * Correctly distinguishes chipsets (e.g. Snapdragon 8 Gen 3 vs Snapdragon 7s Gen 2).
 */
export function compareMobileSocs(
  userSocInput: string,
  requiredSocInput: string,
  options?: {
    deviceExclusions?: string[];
  }
): ComponentComparisonResult {
  const userRes = resolveMobileSoc(userSocInput);

  if (userRes.isAmbiguous) {
    return {
      status: 'uncertain',
      confidence: 'low',
      userHardware: userSocInput,
      requiredHardware: requiredSocInput,
      comparisonMethod: 'unknown',
      explanation: `Ambiguous mobile chipset name "${userSocInput}". ${userRes.ambiguousCandidates?.[0] || 'Please specify exact model.'}`,
      sourceReferences: [],
    };
  }

  const reqRes = resolveMobileSoc(requiredSocInput);

  if (!userRes.record) {
    return {
      status: 'uncertain',
      confidence: 'low',
      userHardware: userSocInput,
      requiredHardware: reqRes.record?.canonicalName || requiredSocInput,
      comparisonMethod: 'unknown',
      explanation: `Unverified mobile chipset record for "${userSocInput}".`,
      sourceReferences: [],
    };
  }

  if (!reqRes.record) {
    return {
      status: 'uncertain',
      confidence: 'low',
      userHardware: userRes.record.canonicalName,
      requiredHardware: requiredSocInput,
      comparisonMethod: 'unknown',
      explanation: `Unverified minimum mobile chipset requirement "${requiredSocInput}".`,
      sourceReferences: [],
    };
  }

  const userRec = userRes.record;
  const reqRec = reqRes.record;

  // 1. Device or Chipset Exclusion Check (Store restriction overrides raw power)
  if (options?.deviceExclusions && options.deviceExclusions.length > 0) {
    const isExcluded = options.deviceExclusions.some(ex => {
      const cleanEx = cleanHardwareString(ex);
      return (
        cleanHardwareString(userRec.canonicalName).includes(cleanEx) ||
        cleanHardwareString(userRec.modelIdentifier).includes(cleanEx) ||
        userRec.aliases.some(a => cleanHardwareString(a).includes(cleanEx))
      );
    });

    if (isExcluded) {
      return {
        status: 'unsupported',
        confidence: 'high',
        userHardware: userRec.canonicalName,
        userRecord: userRec,
        requiredHardware: reqRec.canonicalName,
        requiredRecord: reqRec,
        comparisonMethod: 'verified-compatibility',
        explanation: `Confirmed device restriction: Publisher store listing explicitly excludes ${userRec.canonicalName} despite hardware capabilities.`,
        sourceReferences: userRec.sourceReferences,
      };
    }
  }

  // 2. GPU Capability (3DMark Wild Life Extreme)
  const userGpuScore = userRec.benchmarks.find(b => b.benchmarkName === '3dmark-wildlife-extreme')?.score || userRec.performanceIndex * 35;
  const reqGpuScore = reqRec.benchmarks.find(b => b.benchmarkName === '3dmark-wildlife-extreme')?.score || reqRec.performanceIndex * 35;

  // 3. CPU Capability (Geekbench 6 Multi)
  const userCpuScore = userRec.benchmarks.find(b => b.benchmarkName === 'geekbench6-multi')?.score || userRec.performanceIndex * 60;
  const reqCpuScore = reqRec.benchmarks.find(b => b.benchmarkName === 'geekbench6-multi')?.score || reqRec.performanceIndex * 60;

  const gpuRatio = userGpuScore / Math.max(1, reqGpuScore);
  const cpuRatio = userCpuScore / Math.max(1, reqCpuScore);

  // Overall SoC suitability
  const overallRatio = gpuRatio * 0.6 + cpuRatio * 0.4;

  let status: ComponentComparisonResult['status'] = 'meets';
  let explanation = '';

  if (overallRatio >= 0.92) {
    status = 'meets';
    const gpuTimes = gpuRatio >= 1.3 ? ` (~${gpuRatio.toFixed(1)}x graphics throughput)` : '';
    explanation = `${userRec.canonicalName} (${userRec.specifications.mobileSoc?.gpuModel || 'GPU'}) comfortably satisfies minimum capability requirements of reference ${reqRec.canonicalName}${gpuTimes}.`;
  } else {
    status = 'below';
    explanation = `${userRec.canonicalName} is below the reference capability of ${reqRec.canonicalName} (${(overallRatio * 100).toFixed(0)}% of reference baseline).`;
  }

  return {
    status,
    confidence: 'high',
    userHardware: userRec.canonicalName,
    userRecord: userRec,
    requiredHardware: reqRec.canonicalName,
    requiredRecord: reqRec,
    comparisonMethod: 'direct-benchmark',
    explanation,
    relativePerformanceRatio: overallRatio,
    sourceReferences: [...userRec.sourceReferences, ...reqRec.sourceReferences],
  };
}

/**
 * RAM Capability Check
 */
export function compareRam(
  userRamGb: number,
  minRamGb: number,
  recRamGb?: number
): ComponentComparisonResult {
  const meetsMin = userRamGb >= minRamGb;
  const meetsRec = recRamGb ? userRamGb >= recRamGb : meetsMin;

  if (meetsRec) {
    return {
      status: 'meets',
      confidence: 'high',
      userHardware: `${userRamGb} GB RAM`,
      requiredHardware: recRamGb ? `Rec: ${recRamGb} GB` : `Min: ${minRamGb} GB`,
      comparisonMethod: 'architecture-capability',
      explanation: `System memory (${userRamGb} GB) meets recommended specifications. No paging bottleneck expected.`,
      sourceReferences: [],
    };
  } else if (meetsMin) {
    return {
      status: 'meets',
      confidence: 'high',
      userHardware: `${userRamGb} GB RAM`,
      requiredHardware: `Min: ${minRamGb} GB (Rec: ${recRamGb || minRamGb} GB)`,
      comparisonMethod: 'architecture-capability',
      explanation: `System memory (${userRamGb} GB) meets baseline minimum requirement. Close background applications to prevent paging.`,
      sourceReferences: [],
    };
  } else {
    return {
      status: 'below',
      confidence: 'high',
      userHardware: `${userRamGb} GB RAM`,
      requiredHardware: `Min: ${minRamGb} GB`,
      comparisonMethod: 'architecture-capability',
      explanation: `Insufficient RAM. System has ${userRamGb} GB, but the game mandates at least ${minRamGb} GB (${minRamGb - userRamGb} GB short).`,
      missingFeatures: [`${minRamGb - userRamGb} GB RAM shortfall`],
      sourceReferences: [],
    };
  }
}

/**
 * Storage Space Check
 */
export function compareStorage(
  userFreeGb: number,
  requiredGb: number,
  storageType?: string
): ComponentComparisonResult {
  if (userFreeGb >= requiredGb) {
    return {
      status: 'meets',
      confidence: 'high',
      userHardware: `${userFreeGb} GB Free`,
      requiredHardware: `${requiredGb} GB (${storageType || 'Storage'})`,
      comparisonMethod: 'architecture-capability',
      explanation: `Sufficient drive space available (${userFreeGb} GB free vs ${requiredGb} GB required).`,
      sourceReferences: [],
    };
  } else {
    return {
      status: 'below',
      confidence: 'high',
      userHardware: `${userFreeGb} GB Free`,
      requiredHardware: `${requiredGb} GB (${storageType || 'Storage'})`,
      comparisonMethod: 'architecture-capability',
      explanation: `Insufficient storage space. Need ${requiredGb} GB free (${requiredGb - userFreeGb} GB short).`,
      missingFeatures: [`${requiredGb - userFreeGb} GB storage space shortfall`],
      sourceReferences: [],
    };
  }
}
