/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CompatibilityResult, Game, HardwarePreset, SpecCheck } from '../types';
import {
  compareCpus,
  compareGpus,
  compareMobileSocs,
  compareRam,
  compareStorage,
} from './hardwareComparison';

/**
 * GameFit Centralized Hardware Intelligence & Compatibility Evaluation Engine
 * Evaluates hardware capabilities using comparative benchmark evidence, architecture features,
 * and memory/storage constraints, rather than strict verbatim string matching.
 */
export function checkGameCompatibility(
  game: Game,
  hardware: HardwarePreset
): CompatibilityResult {
  // 1. Platform Availability Verification
  const isPlatformSupported = game.platforms.includes(hardware.platform);

  if (!isPlatformSupported) {
    return {
      status: 'unsupported_platform',
      statusLabel: 'Not Available on Platform',
      summary: `${game.title} is not released for ${hardware.platform.toUpperCase()}. Supported platforms: ${game.platforms.map(p => p.toUpperCase()).join(', ')}.`,
      overallScorePercent: 0,
      confidence: 'high',
      checks: {
        cpu: { status: 'fail', required: 'N/A', userHas: hardware.cpu, metricLabel: 'Platform Availability', message: `Unavailable on ${hardware.platform.toUpperCase()}` },
        gpu: { status: 'fail', required: 'N/A', userHas: hardware.gpu, metricLabel: 'Platform Availability', message: `Unavailable on ${hardware.platform.toUpperCase()}` },
        ram: { status: 'fail', required: 'N/A', userHas: `${hardware.ramGb} GB`, metricLabel: 'Platform Availability', message: `Unavailable on ${hardware.platform.toUpperCase()}` },
        storage: { status: 'fail', required: 'N/A', userHas: `${hardware.storageFreeGb} GB free`, metricLabel: 'Platform Availability', message: `Unavailable on ${hardware.platform.toUpperCase()}` },
        os: { status: 'fail', required: 'N/A', userHas: hardware.os, metricLabel: 'Platform Availability', message: `Unavailable on ${hardware.platform.toUpperCase()}` },
      },
      headroomDescription: `This title only supports ${game.platforms.map(p => p.toUpperCase()).join(' and ')}. Check alternatives for native ${hardware.platform.toUpperCase()} options.`,
      resolutionImpactNote: 'Platform architecture mismatch.',
    };
  }

  // 2. Mobile Platforms Evaluation (Android / iOS)
  if (hardware.platform === 'android' || hardware.platform === 'ios') {
    const mobileReqs = hardware.platform === 'android' ? game.mobileRequirements?.android : game.mobileRequirements?.ios;

    if (!mobileReqs) {
      return {
        status: 'uncertain',
        statusLabel: 'Requirements Uncertain',
        summary: `Mobile version is known to exist, but detailed hardware specifications for ${hardware.platform.toUpperCase()} have not been verified by the publisher.`,
        overallScorePercent: 50,
        confidence: 'low',
        checks: {
          cpu: { status: 'uncertain', required: 'Unspecified', userHas: hardware.cpu, metricLabel: 'Processor / SoC', message: 'No minimum chipset published.' },
          gpu: { status: 'uncertain', required: 'Unspecified', userHas: hardware.gpu, metricLabel: 'Graphics', message: 'No minimum GPU published.' },
          ram: { status: 'uncertain', required: 'Unspecified', userHas: `${hardware.ramGb} GB`, metricLabel: 'Memory', message: 'Memory footprint pending publisher benchmark.' },
          storage: { status: 'uncertain', required: 'Unspecified', userHas: `${hardware.storageFreeGb} GB`, metricLabel: 'Storage', message: 'Install size varies with asset download.' },
          os: { status: 'uncertain', required: 'Unspecified', userHas: hardware.os, metricLabel: 'Operating System', message: 'Verify OS via app store listing.' },
        },
        headroomDescription: 'Incomplete publisher metadata. Compatibility cannot be confirmed with certainty.',
        resolutionImpactNote: 'Mobile resolution scales dynamically with device thermal envelope.',
      };
    }

    // Extract reference chipset string from targetGpuDesc or fallback tier description
    const refChipsetString = mobileReqs.targetGpuDesc || `Tier ${mobileReqs.minChipsetTier} Mobile SoC`;

    // Check device exclusions if mentioned in known limitations
    const deviceExclusions: string[] = [];
    if (mobileReqs.knownLimitations) {
      const match = mobileReqs.knownLimitations.match(/excludes?\s+([a-zA-Z0-9\s,]+)/i);
      if (match) {
        deviceExclusions.push(...match[1].split(',').map(s => s.trim()));
      }
    }

    // Compare Mobile SoC capability
    const socComparison = compareMobileSocs(
      hardware.cpu,
      refChipsetString,
      { deviceExclusions }
    );

    // RAM check
    const ramComp = compareRam(hardware.ramGb, mobileReqs.minRamGb);

    // Storage check
    const storageComp = compareStorage(hardware.storageFreeGb, mobileReqs.storageGb);

    // Map comparison results to SpecCheck
    const cpuStatus: SpecCheck['status'] =
      socComparison.status === 'unsupported' ? 'fail' :
      socComparison.status === 'meets' ? 'pass' :
      socComparison.status === 'below' ? 'fail' : 'uncertain';

    const ramStatus: SpecCheck['status'] =
      ramComp.status === 'meets' ? 'pass' : 'fail';

    const storageStatus: SpecCheck['status'] =
      storageComp.status === 'meets' ? 'pass' : 'fail';

    const allMandatoryMet = cpuStatus === 'pass' && ramStatus === 'pass' && storageStatus === 'pass';
    const isUnsupported = socComparison.status === 'unsupported';
    const hasUncertainty = cpuStatus === 'uncertain';

    let status: CompatibilityResult['status'] = 'below_minimum';
    let statusLabel = 'Below Minimum Mobile Specs';
    let summary = '';
    let limitingBottleneck: string | undefined;

    if (isUnsupported) {
      status = 'below_minimum';
      statusLabel = 'Device Architecture Incompatible';
      summary = socComparison.explanation;
      limitingBottleneck = 'Device / Architecture Exclusion';
    } else if (hasUncertainty) {
      status = 'uncertain';
      statusLabel = 'Performance Uncertain';
      summary = `Unable to verify mobile chipset benchmarks for ${hardware.cpu}.`;
    } else if (allMandatoryMet) {
      const hasRec = Boolean(mobileReqs.recommendedChipsetTier);
      if (hasRec && (socComparison.relativePerformanceRatio || 1) >= 1.4) {
        status = 'meets_recommended';
        statusLabel = 'Meets Recommended Mobile Specs';
        summary = `Your mobile device comfortably meets recommended performance criteria for ${game.title}.`;
      } else {
        status = 'meets_minimum';
        statusLabel = 'Meets Listed Minimum Specs';
        summary = `Your mobile device satisfies baseline requirements. Playable, though frame rates may dip in demanding scenes.`;
      }
    } else {
      status = 'below_minimum';
      statusLabel = 'Below Listed Minimum Mobile Specs';
      const shortfalls: string[] = [];
      if (cpuStatus !== 'pass') shortfalls.push('Processor / SoC');
      if (ramStatus !== 'pass') shortfalls.push('RAM');
      if (storageStatus !== 'pass') shortfalls.push('Storage Space');
      limitingBottleneck = shortfalls.join(', ');
      summary = `Your device falls short in: ${shortfalls.join(', ')}.`;
    }

    return {
      status,
      statusLabel,
      summary,
      overallScorePercent: status === 'meets_recommended' ? 95 : status === 'meets_minimum' ? 75 : isUnsupported ? 20 : 40,
      confidence: socComparison.confidence,
      hasVerifiedRecommended: Boolean(mobileReqs.recommendedChipsetTier),
      checks: {
        cpu: {
          status: cpuStatus,
          required: refChipsetString,
          userHas: hardware.cpu,
          metricLabel: 'Processor / Mobile SoC',
          message: socComparison.explanation,
          comparisonResult: socComparison,
          confidence: socComparison.confidence,
        },
        gpu: {
          status: cpuStatus,
          required: mobileReqs.targetGpuDesc || 'Compatible Integrated GPU',
          userHas: hardware.gpu,
          metricLabel: 'Graphics Core',
          message: socComparison.userRecord?.specifications.mobileSoc?.gpuModel
            ? `Integrated GPU: ${socComparison.userRecord.specifications.mobileSoc.gpuModel}.`
            : 'Integrated GPU evaluated with SoC profile.',
          comparisonResult: socComparison,
        },
        ram: {
          status: ramStatus,
          required: `${mobileReqs.minRamGb} GB RAM`,
          userHas: `${hardware.ramGb} GB RAM`,
          metricLabel: 'Device RAM',
          message: ramComp.explanation,
          comparisonResult: ramComp,
        },
        storage: {
          status: storageStatus,
          required: `${mobileReqs.storageGb} GB Free`,
          userHas: `${hardware.storageFreeGb} GB Available`,
          metricLabel: 'Internal Storage',
          message: storageComp.explanation,
          comparisonResult: storageComp,
        },
        os: {
          status: 'pass',
          required: mobileReqs.minOs,
          userHas: hardware.os,
          metricLabel: 'Operating System',
          message: `Compatible with ${mobileReqs.minOs}.`,
        },
      },
      limitingBottleneck,
      headroomDescription: mobileReqs.knownLimitations || 'Performance sustained under typical ambient temperatures.',
      resolutionImpactNote: 'Resolution is managed dynamically by the mobile operating system.',
    };
  }

  // 3. Desktop PC Platform Evaluation
  const pcReqs = game.pcRequirements;
  if (!pcReqs) {
    return {
      status: 'uncertain',
      statusLabel: 'Requirements Pending',
      summary: `Verified PC requirements for ${game.title} are currently being audited from official sources.`,
      overallScorePercent: 50,
      confidence: 'low',
      checks: {
        cpu: { status: 'uncertain', required: 'Unspecified', userHas: hardware.cpu, metricLabel: 'CPU', message: 'Requirement unverified' },
        gpu: { status: 'uncertain', required: 'Unspecified', userHas: hardware.gpu, metricLabel: 'GPU', message: 'Requirement unverified' },
        ram: { status: 'uncertain', required: 'Unspecified', userHas: `${hardware.ramGb} GB`, metricLabel: 'RAM', message: 'Requirement unverified' },
        storage: { status: 'uncertain', required: 'Unspecified', userHas: `${hardware.storageFreeGb} GB`, metricLabel: 'Storage', message: 'Requirement unverified' },
        os: { status: 'uncertain', required: 'Windows 64-bit', userHas: hardware.os, metricLabel: 'OS', message: 'Standard 64-bit Windows required' },
      },
      headroomDescription: 'No verified specifications available to calculate headroom.',
      resolutionImpactNote: 'Uncertain resolution impact.',
    };
  }

  const { minimum, recommended } = pcReqs;
  const hasVerifiedRecommended = Boolean(recommended && recommended.gpu && recommended.cpu);

  // Determine if title mandates special features
  const mandatoryGpuFeatures: { minDirectXFeatureLevel?: string; requiresRayTracing?: boolean } = {};
  if (minimum.notes?.toLowerCase().includes('ray tracing') || minimum.gpu.toLowerCase().includes('ray tracing')) {
    mandatoryGpuFeatures.requiresRayTracing = true;
  }
  if (minimum.os.toLowerCase().includes('dx12') || minimum.notes?.toLowerCase().includes('dx12') || game.description.toLowerCase().includes('directx 12')) {
    mandatoryGpuFeatures.minDirectXFeatureLevel = '12_0';
  }

  // Mandatory CPU features (e.g. AVX2 in modern heavy games like Baldur's Gate 3)
  const mandatoryCpuFeatures: { requiresAvx2?: boolean; minCores?: number } = {};
  if (game.id === 'game-baldurs-gate-3' || minimum.notes?.toLowerCase().includes('quad-core')) {
    mandatoryCpuFeatures.minCores = 4;
  }

  // Compare GPU against Minimum
  const gpuMinComp = compareGpus(hardware.gpu, minimum.gpu, {
    requiredVramGb: minimum.vramGb,
    targetResolution: hardware.targetResolution,
    mandatoryFeatures: mandatoryGpuFeatures,
  });

  // Compare GPU against Recommended (if available)
  const gpuRecComp = hasVerifiedRecommended
    ? compareGpus(hardware.gpu, recommended.gpu, {
        requiredVramGb: recommended.vramGb,
        targetResolution: hardware.targetResolution,
      })
    : gpuMinComp;

  // Compare CPU against Minimum
  const cpuMinComp = compareCpus(hardware.cpu, minimum.cpu, mandatoryCpuFeatures);

  // Compare CPU against Recommended (if available)
  const cpuRecComp = hasVerifiedRecommended
    ? compareCpus(hardware.cpu, recommended.cpu)
    : cpuMinComp;

  // Compare RAM against Minimum and Recommended
  const ramComp = compareRam(hardware.ramGb, minimum.ramGb, recommended?.ramGb);

  // Compare Storage
  const storageComp = compareStorage(hardware.storageFreeGb, minimum.storageGb, minimum.storageType);

  // Map to SpecChecks
  const gpuStatus: SpecCheck['status'] =
    gpuMinComp.status === 'unsupported' ? 'fail' :
    gpuRecComp.status === 'meets' ? 'pass' :
    gpuMinComp.status === 'meets' ? 'warning' :
    gpuMinComp.status === 'below' ? 'fail' : 'uncertain';

  const cpuStatus: SpecCheck['status'] =
    cpuMinComp.status === 'unsupported' ? 'fail' :
    cpuRecComp.status === 'meets' ? 'pass' :
    cpuMinComp.status === 'meets' ? 'warning' :
    cpuMinComp.status === 'below' ? 'fail' : 'uncertain';

  const ramStatus: SpecCheck['status'] =
    ramComp.status === 'meets' && hardware.ramGb >= (recommended?.ramGb || minimum.ramGb) ? 'pass' :
    ramComp.status === 'meets' ? 'warning' : 'fail';

  const storageStatus: SpecCheck['status'] =
    storageComp.status === 'meets' ? 'pass' : 'fail';

  // Overall logic:
  // A strong GPU CANNOT compensate for insufficient RAM, storage, or unsupported features!
  const hasUnsupportedFeature = gpuMinComp.status === 'unsupported' || cpuMinComp.status === 'unsupported';
  const hasHardwareFailure = gpuStatus === 'fail' || cpuStatus === 'fail' || ramStatus === 'fail' || storageStatus === 'fail';
  const hasUncertainty = gpuStatus === 'uncertain' || cpuStatus === 'uncertain';

  const meetsAllMinimum = !hasUnsupportedFeature && !hasHardwareFailure && !hasUncertainty;
  
  // Rule: Do not show "meets_recommended" unless:
  // 1. Game has verified recommended requirements, AND
  // 2. Hardware meets all recommended specs (GPU, CPU, RAM, Storage)
  const meetsAllRecommended =
    hasVerifiedRecommended &&
    meetsAllMinimum &&
    gpuRecComp.status === 'meets' &&
    cpuRecComp.status === 'meets' &&
    hardware.ramGb >= (recommended?.ramGb || minimum.ramGb);

  let status: CompatibilityResult['status'] = 'below_minimum';
  let statusLabel = 'Below Listed Minimum Requirements';
  let summary = '';
  let limitingBottleneck: string | undefined;

  if (hasUnsupportedFeature) {
    status = 'below_minimum';
    statusLabel = 'Mandatory Feature Unsupported';
    limitingBottleneck = gpuMinComp.missingFeatures?.[0] || cpuMinComp.missingFeatures?.[0] || 'Hardware Constraint';
    summary = gpuMinComp.status === 'unsupported' ? gpuMinComp.explanation : cpuMinComp.explanation;
  } else if (hasHardwareFailure) {
    status = 'below_minimum';
    statusLabel = 'Below Listed Minimum Requirements';
    const shortfalls: string[] = [];
    if (gpuStatus === 'fail') shortfalls.push('Graphics Card');
    if (cpuStatus === 'fail') shortfalls.push('Processor');
    if (ramStatus === 'fail') shortfalls.push(`RAM (${hardware.ramGb}GB vs ${minimum.ramGb}GB min)`);
    if (storageStatus === 'fail') shortfalls.push('Storage Space');
    limitingBottleneck = shortfalls.join(', ');
    summary = `Your configuration falls short of published minimums in: ${shortfalls.join(', ')}.`;
  } else if (hasUncertainty) {
    status = 'uncertain';
    statusLabel = 'Performance Uncertain';
    summary = `Could not verify comparative benchmarks for one or more components against official requirements.`;
  } else if (meetsAllRecommended) {
    status = 'meets_recommended';
    statusLabel = 'Meets Recommended Requirements';
    summary = `Your hardware exceeds recommended specifications for ${game.title} at ${hardware.targetResolution}. Expected smooth gameplay without major bottlenecks.`;
  } else if (meetsAllMinimum) {
    status = 'meets_minimum';
    statusLabel = hasVerifiedRecommended ? 'Meets Listed Minimum Specs' : 'Meets Listed Minimum (No Rec Verified)';
    summary = `Your hardware satisfies listed minimum specifications. Expect playable frame rates at modest graphics settings at ${hardware.targetResolution}.`;
    if (gpuRecComp.status !== 'meets') limitingBottleneck = 'GPU is the primary performance limiter';
    else if (cpuRecComp.status !== 'meets') limitingBottleneck = 'CPU may restrict peak frame rates';
    else if (hardware.ramGb < (recommended?.ramGb || minimum.ramGb)) limitingBottleneck = 'RAM meets minimum but recommended is higher';
  }

  // Calculate score
  let score = 0;
  if (cpuStatus === 'pass') score += 25; else if (cpuStatus === 'warning') score += 15;
  if (gpuStatus === 'pass') score += 35; else if (gpuStatus === 'warning') score += 20;
  if (ramStatus === 'pass') score += 25; else if (ramStatus === 'warning') score += 15;
  if (storageStatus === 'pass') score += 15;

  let headroomDescription = '';
  if (meetsAllRecommended) {
    headroomDescription = 'High headroom. System has ample capacity for smooth rendering without severe thermal throttling.';
  } else if (meetsAllMinimum) {
    headroomDescription = 'Operational baseline. Meeting minimum requirements allows game launch, but does not guarantee high frame rates in demanding scenarios.';
  } else {
    headroomDescription = 'Negative headroom. Recommended to consider lightweight alternatives designed for your component tier.';
  }

  const resNotes: Record<string, string> = {
    '720p': 'Lower resolution yields ~25% graphics headroom improvement.',
    '1080p': 'Standard native resolution baseline.',
    '1440p': 'Increases GPU demand by ~40% over 1080p baseline.',
    '4k': 'Increases GPU demand by ~100% over 1080p baseline.',
  };

  return {
    status,
    statusLabel,
    summary,
    overallScorePercent: score,
    confidence: gpuMinComp.confidence === 'high' && cpuMinComp.confidence === 'high' ? 'high' : 'medium',
    hasVerifiedRecommended,
    checks: {
      cpu: {
        metricLabel: 'Processor (CPU)',
        required: `Min: ${minimum.cpu} ${recommended ? `| Rec: ${recommended.cpu}` : ''}`,
        userHas: hardware.cpu,
        status: cpuStatus,
        message: cpuRecComp.status === 'meets'
          ? cpuRecComp.explanation
          : cpuMinComp.explanation,
        comparisonResult: cpuRecComp.status === 'meets' ? cpuRecComp : cpuMinComp,
        confidence: cpuMinComp.confidence,
      },
      gpu: {
        metricLabel: 'Graphics Card (GPU)',
        required: `Min: ${minimum.gpu} ${recommended ? `| Rec: ${recommended.gpu}` : ''}`,
        userHas: `${hardware.gpu} (${hardware.targetResolution})`,
        status: gpuStatus,
        message: gpuRecComp.status === 'meets'
          ? gpuRecComp.explanation
          : gpuMinComp.explanation,
        comparisonResult: gpuRecComp.status === 'meets' ? gpuRecComp : gpuMinComp,
        confidence: gpuMinComp.confidence,
      },
      ram: {
        metricLabel: 'System Memory (RAM)',
        required: `Min: ${minimum.ramGb} GB ${recommended ? `| Rec: ${recommended.ramGb} GB` : ''}`,
        userHas: `${hardware.ramGb} GB`,
        status: ramStatus,
        message: ramComp.explanation,
        comparisonResult: ramComp,
        confidence: ramComp.confidence,
      },
      storage: {
        metricLabel: 'Storage Space',
        required: `${minimum.storageGb} GB (${minimum.storageType || 'Storage'})`,
        userHas: `${hardware.storageFreeGb} GB Free`,
        status: storageStatus,
        message: storageComp.explanation,
        comparisonResult: storageComp,
        confidence: storageComp.confidence,
      },
      os: {
        metricLabel: 'Operating System',
        required: minimum.os,
        userHas: hardware.os,
        status: 'pass',
        message: 'Architecture and OS version compatible.',
      },
    },
    limitingBottleneck,
    headroomDescription,
    resolutionImpactNote: resNotes[hardware.targetResolution] || 'Standard baseline.',
  };
}
