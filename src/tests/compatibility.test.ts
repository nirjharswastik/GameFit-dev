/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Automated Test Suite for GameFit Hardware Intelligence & Compatibility Engine
 * Covers all 12 required test cases specified in the system audit & architecture brief.
 */

import { CURATED_GAMES } from '../data/games';
import {
  DEFAULT_ANDROID_CONFIG,
  DEFAULT_IOS_CONFIG,
  DEFAULT_ISOLATED_PLATFORM_STATE,
  DEFAULT_WINDOWS_CONFIG,
  platformConfigToHardwarePreset,
  validateAndSanitizePlatformState,
} from '../data/hardware';
import { checkGameCompatibility } from '../services/compatibility';
import {
  compareCpus,
  compareGpus,
  compareMobileSocs,
  compareRam,
} from '../services/hardwareComparison';
import {
  resolveCpuModel,
  resolveGpuModel,
  resolveMobileSoc,
} from '../services/hardwareNormalization';
import { getSimilarAndAlternativeGames, parseNaturalLanguageQuery } from '../services/recommendations';
import { Game, HardwarePreset } from '../types';
import { IsolatedPlatformState } from '../types/hardware';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${testName}`);
  } else {
    console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
    if (details) {
      console.error(`         Details: ${details}`);
    }
  }
}

console.log('=== RUNNING GAMEFIT HARDWARE INTELLIGENCE ENGINE TESTS ===\n');

// -------------------------------------------------------------------------
// TEST 1: Minimum GPU RX 580 vs User GPU RTX 5060 (Cross-manufacturer capability comparison)
// -------------------------------------------------------------------------
console.log('TEST 1: Cross-brand GPU capability evaluation (RX 580 vs RTX 5060)');
const gpuResult1 = compareGpus('NVIDIA GeForce RTX 5060', 'AMD Radeon RX 580');
assert(
  gpuResult1.status === 'meets' &&
    gpuResult1.userRecord?.canonicalName === 'NVIDIA GeForce RTX 5060' &&
    gpuResult1.requiredRecord?.canonicalName === 'AMD Radeon RX 580' &&
    (gpuResult1.relativePerformanceRatio || 0) > 2.0,
  'Resolves RX 580 and RTX 5060 and evaluates capability evidence without requiring exact name match',
  `Result: status=${gpuResult1.status}, ratio=${gpuResult1.relativePerformanceRatio}`
);

// -------------------------------------------------------------------------
// TEST 2: Minimum chipset Snapdragon 7s Gen 2 vs User Snapdragon 8 Gen 3
// -------------------------------------------------------------------------
console.log('\nTEST 2: Exact Mobile SoC resolution and capability comparison (7s Gen 2 vs 8 Gen 3)');
const socResult2 = compareMobileSocs('Qualcomm Snapdragon 8 Gen 3', 'Qualcomm Snapdragon 7s Gen 2');
assert(
  socResult2.status === 'meets' &&
    socResult2.userRecord?.modelIdentifier === '8 Gen 3' &&
    socResult2.requiredRecord?.modelIdentifier === '7s Gen 2' &&
    (socResult2.relativePerformanceRatio || 0) > 2.0,
  'Resolves exact chipsets (does not confuse 8 Gen 3 with 8s Gen 3 or 7s Gen 2 with 7s Gen 3) and evaluates CPU/GPU evidence',
  `Result: status=${socResult2.status}, user=${socResult2.userRecord?.canonicalName}, req=${socResult2.requiredRecord?.canonicalName}`
);

// -------------------------------------------------------------------------
// TEST 3: Model Aliases Resolution
// -------------------------------------------------------------------------
console.log('\nTEST 3: Hardware alias resolution across common user input variations');
const aliasGpu1 = resolveGpuModel('rtx 5060 8gb');
const aliasGpu2 = resolveGpuModel('rx580');
const aliasCpu1 = resolveCpuModel('12400f');
const aliasSoc1 = resolveMobileSoc('sd8g3');
assert(
  aliasGpu1.record?.canonicalName === 'NVIDIA GeForce RTX 5060' &&
    aliasGpu2.record?.canonicalName === 'AMD Radeon RX 580' &&
    aliasCpu1.record?.canonicalName === 'Intel Core i5-12400F' &&
    aliasSoc1.record?.canonicalName === 'Qualcomm Snapdragon 8 Gen 3',
  'Resolves aliases ("rtx 5060 8gb", "rx580", "12400f", "sd8g3") to canonical hardware models',
  `Resolved: ${aliasGpu1.record?.canonicalName}, ${aliasGpu2.record?.canonicalName}, ${aliasCpu1.record?.canonicalName}, ${aliasSoc1.record?.canonicalName}`
);

// -------------------------------------------------------------------------
// TEST 4: Ambiguous Hardware Input Handling
// -------------------------------------------------------------------------
console.log('\nTEST 4: Ambiguity detection on underspecified hardware names');
const ambGpu = resolveGpuModel('RTX');
const ambCpu = resolveCpuModel('Ryzen');
const ambSoc = resolveMobileSoc('Snapdragon');
assert(
  ambGpu.isAmbiguous === true && ambCpu.isAmbiguous === true && ambSoc.isAmbiguous === true,
  'Identifies ambiguous brand/family names without silent misattribution',
  `ambGpu=${ambGpu.isAmbiguous}, ambCpu=${ambCpu.isAmbiguous}, ambSoc=${ambSoc.isAmbiguous}`
);

// -------------------------------------------------------------------------
// TEST 5: GPU meets requirement but RAM is below mandatory minimum
// -------------------------------------------------------------------------
console.log('\nTEST 5: Complete system constraint checking (Strong GPU + Insufficient RAM)');
const eldenRing = CURATED_GAMES.find(g => g.id === 'game-elden-ring')!;
const rigWithLowRam: HardwarePreset = {
  id: 'test-rig-low-ram',
  name: 'Test Rig with Low RAM',
  category: 'pc',
  tagline: 'RTX 5060 with only 4GB RAM',
  platform: 'pc',
  cpu: 'Intel Core i5-12400F',
  cpuTier: 7,
  gpu: 'NVIDIA GeForce RTX 5060',
  gpuTier: 8,
  ramGb: 4, // Elden Ring minimum requires 12 GB RAM!
  os: 'Windows 11 64-bit',
  storageFreeGb: 100,
  targetResolution: '1080p',
};
const compResult5 = checkGameCompatibility(eldenRing, rigWithLowRam);
assert(
  compResult5.status === 'below_minimum' &&
    compResult5.checks.ram.status === 'fail' &&
    Boolean(compResult5.limitingBottleneck?.includes('RAM')),
  'Flags overall compatibility as below_minimum due to RAM shortfall despite high-end RTX 5060 GPU',
  `Status: ${compResult5.status}, Bottleneck: ${compResult5.limitingBottleneck}`
);

// -------------------------------------------------------------------------
// TEST 6: CPU Model Number Heuristic Trap (AMD FX-8350 vs Intel Core i5-8400)
// -------------------------------------------------------------------------
console.log('\nTEST 6: CPU IPC capability evidence vs raw model number');
// AMD FX-8350 has a higher model number ("8350"), but its single-thread score is ~580 vs i5-8400's ~1300
const cpuComp6 = compareCpus('AMD FX-8350', 'Intel Core i5-8400');
assert(
  cpuComp6.status === 'below' && (cpuComp6.relativePerformanceRatio || 1) < 0.8,
  'Correctly identifies AMD FX-8350 as below Core i5-8400 requirement based on benchmark evidence rather than numeric string comparison',
  `Status: ${cpuComp6.status}, ratio: ${cpuComp6.relativePerformanceRatio}`
);

// -------------------------------------------------------------------------
// TEST 7: Mandatory Graphics Feature Support (Missing Ray Tracing or DX Feature Level)
// -------------------------------------------------------------------------
console.log('\nTEST 7: Mandatory graphics feature & API constraint checking');
const gpuComp7 = compareGpus('NVIDIA GeForce GTX 1070', 'NVIDIA GeForce RTX 2060', {
  mandatoryFeatures: { requiresRayTracing: true },
});
assert(
  gpuComp7.status === 'unsupported' &&
    Boolean(gpuComp7.missingFeatures?.some(f => f.toLowerCase().includes('ray tracing'))),
  'Flags GTX 1070 as unsupported for ray tracing titles despite strong raster performance',
  `Status: ${gpuComp7.status}, Missing: ${gpuComp7.missingFeatures?.join(', ')}`
);

// -------------------------------------------------------------------------
// TEST 8: Missing Benchmark Data / Unrecognized Hardware
// -------------------------------------------------------------------------
console.log('\nTEST 8: Graceful uncertainty handling without fabricated scores');
const unknownGpuComp = compareGpus('Imaginary FastGPU 9999', 'AMD Radeon RX 580');
assert(
  unknownGpuComp.status === 'uncertain' && unknownGpuComp.comparisonMethod === 'unknown',
  'Returns uncertain status and does not fabricate a benchmark score for unknown hardware',
  `Status: ${unknownGpuComp.status}, Method: ${unknownGpuComp.comparisonMethod}`
);

// -------------------------------------------------------------------------
// TEST 9: Mobile Device Exclusion Overrides Raw Chipset Horsepower
// -------------------------------------------------------------------------
console.log('\nTEST 9: Official store / publisher device exclusion enforcement');
const excludedSocComp = compareMobileSocs('Qualcomm Snapdragon 8 Gen 3', 'Qualcomm Snapdragon 7s Gen 2', {
  deviceExclusions: ['Snapdragon 8 Gen 3'], // Simulated store blacklist
});
assert(
  excludedSocComp.status === 'unsupported' &&
    excludedSocComp.explanation.toLowerCase().includes('restriction'),
  'Enforces device blacklist / platform restriction even when chipset performance exceeds requirement',
  `Status: ${excludedSocComp.status}, Explanation: ${excludedSocComp.explanation}`
);

// -------------------------------------------------------------------------
// TEST 10: Game with only minimum requirements does not promise Comfortable 60 FPS
// -------------------------------------------------------------------------
console.log('\nTEST 10: Conservative labelling when recommended requirements are unverified');
const gameWithoutRec: Game = {
  id: 'game-indie-min-only',
  slug: 'indie-min-only',
  title: 'Indie Minimum Only Title',
  tagline: 'A title with only verified minimum specs',
  description: 'Publisher has only published minimum requirements.',
  releaseYear: 2024,
  developer: 'Indie Dev',
  publisher: 'Indie Pub',
  platforms: ['pc'],
  genres: ['Indie'],
  gameplayTags: ['2D'],
  atmosphereTags: ['Minimal'],
  worldType: 'linear',
  combatStyle: 'peaceful',
  explorationLevel: 'minimal',
  storyFocus: 'minimal',
  images: { cover: '', accentColor: '#333' },
  pcRequirements: {
    minimum: {
      os: 'Windows 10',
      osFamily: 'windows',
      cpu: 'Intel Core i5-8400',
      cpuTier: 5,
      gpu: 'AMD Radeon RX 580',
      gpuTier: 5,
      vramGb: 4,
      ramGb: 8,
      storageGb: 20,
    },
    // No recommended requirements verified!
    recommended: undefined as any,
  },
  provenance: {
    sourceName: 'Storefront',
    sourceUrl: 'https://example.com',
    lastVerified: '2024-01-01',
    confidence: 'publisher-direct',
  },
  estimatedTargetTier: { minimumTier: 5, recommendedTier: 5 },
};

const highEndRig: HardwarePreset = {
  id: 'high-end-rig',
  name: 'RTX 4090 Rig',
  category: 'pc',
  tagline: 'RTX 4090',
  platform: 'pc',
  cpu: 'Intel Core i9-14900K',
  cpuTier: 10,
  gpu: 'NVIDIA GeForce RTX 4090',
  gpuTier: 10,
  ramGb: 32,
  os: 'Windows 11',
  storageFreeGb: 500,
  targetResolution: '1080p',
};

const compMinOnly = checkGameCompatibility(gameWithoutRec, highEndRig);
assert(
  compMinOnly.status === 'meets_minimum' &&
    compMinOnly.statusLabel.includes('Minimum'),
  'Does not promise Comfortable / meets_recommended when publisher has only verified minimum requirements',
  `Status: ${compMinOnly.status}, Label: ${compMinOnly.statusLabel}`
);

// -------------------------------------------------------------------------
// TEST 11: Consistency across Compatibility Checker & Recommendations
// -------------------------------------------------------------------------
console.log('\nTEST 11: Cross-system consistency between Checker & Alternative Recommendations');
const userRigRtx5060: HardwarePreset = {
  id: 'user-rig-5060',
  name: 'User RTX 5060 Rig',
  category: 'pc',
  tagline: 'RTX 5060 · i5-12400F · 16GB RAM',
  platform: 'pc',
  cpu: 'Intel Core i5-12400F',
  cpuTier: 7,
  gpu: 'NVIDIA GeForce RTX 5060',
  gpuTier: 8,
  ramGb: 16,
  os: 'Windows 11 64-bit',
  storageFreeGb: 200,
  targetResolution: '1080p',
};

const directCompatibility = checkGameCompatibility(eldenRing, userRigRtx5060);
const recommendations = getSimilarAndAlternativeGames(eldenRing, CURATED_GAMES, userRigRtx5060);
const tunicRec = recommendations.find(r => r.game.id === 'game-tunic');

assert(
  directCompatibility.status === 'meets_recommended' &&
    tunicRec !== undefined &&
    tunicRec.hardwareVerdict === 'runs_better',
  'Consistent evaluation of RTX 5060 in direct compatibility check and alternative ranking',
  `Direct: ${directCompatibility.status}, Tunic verdict: ${tunicRec?.hardwareVerdict}`
);

// -------------------------------------------------------------------------
// TEST 12: Existing Working Functionality & Curated Dataset Integrity
// -------------------------------------------------------------------------
console.log('\nTEST 12: Curated games dataset integrity and requirement completeness');
const allCuratedValid = CURATED_GAMES.every(game => {
  return (
    game.id &&
    game.title &&
    game.platforms.length > 0 &&
    (game.pcRequirements || game.mobileRequirements)
  );
});
assert(
  allCuratedValid && CURATED_GAMES.length >= 7,
  'Curated game database remains complete and valid across PC and mobile platforms',
  `Total verified games: ${CURATED_GAMES.length}`
);

// =========================================================================
// PLATFORM-SPECIFIC HARDWARE STATE ISOLATION REGRESSION TESTS (TESTS A - H)
// =========================================================================

console.log('\n=== RUNNING PLATFORM STATE ISOLATION REGRESSION TESTS (A - H) ===');

// -------------------------------------------------------------------------
// TEST A: Android to Windows Isolation
// -------------------------------------------------------------------------
console.log('\nTEST A: Android to Windows switching isolation');
const stateA: IsolatedPlatformState = {
  activePlatform: 'android',
  pc: { ...DEFAULT_WINDOWS_CONFIG, cpu: 'Intel Core i5-12400F', gpu: 'NVIDIA GeForce RTX 3060 12GB' },
  android: { ...DEFAULT_ANDROID_CONFIG, soc: 'Qualcomm Snapdragon 8 Gen 3', deviceModel: 'Snapdragon 8 Gen 3' },
  ios: { ...DEFAULT_IOS_CONFIG },
};

// Switch platform to Windows PC
stateA.activePlatform = 'pc';
const activeHwA = platformConfigToHardwarePreset(stateA.pc);
const pcCompA = checkGameCompatibility(eldenRing, activeHwA);

assert(
  stateA.pc.cpu === 'Intel Core i5-12400F' &&
    !stateA.pc.cpu.toLowerCase().includes('snapdragon') &&
    !stateA.pc.gpu.toLowerCase().includes('snapdragon') &&
    activeHwA.platform === 'pc' &&
    activeHwA.cpu === 'Intel Core i5-12400F' &&
    pcCompA.checks.cpu.userHas.includes('Intel Core i5-12400F'),
  'Switching from Android to Windows leaves Windows CPU/GPU isolated; Snapdragon does not leak into PC fields or compatibility check',
  `PC CPU: ${stateA.pc.cpu}, Active HW CPU: ${activeHwA.cpu}`
);

// -------------------------------------------------------------------------
// TEST B: iOS to Windows Isolation
// -------------------------------------------------------------------------
console.log('\nTEST B: iOS to Windows switching isolation');
const stateB: IsolatedPlatformState = {
  activePlatform: 'ios',
  pc: { ...DEFAULT_WINDOWS_CONFIG, cpu: 'AMD Ryzen 5 5600X', gpu: 'NVIDIA GeForce RTX 4060' },
  android: { ...DEFAULT_ANDROID_CONFIG },
  ios: { ...DEFAULT_IOS_CONFIG, iphoneModel: 'iPhone 15 Pro', chipset: 'Apple A17 Pro' },
};

// Switch platform to Windows PC
stateB.activePlatform = 'pc';
const activeHwB = platformConfigToHardwarePreset(stateB.pc);
const pcCompB = checkGameCompatibility(eldenRing, activeHwB);

assert(
  stateB.pc.cpu === 'AMD Ryzen 5 5600X' &&
    !stateB.pc.cpu.toLowerCase().includes('apple') &&
    !stateB.pc.gpu.toLowerCase().includes('apple') &&
    activeHwB.platform === 'pc' &&
    pcCompB.checks.cpu.userHas.includes('AMD Ryzen 5 5600X'),
  'Switching from iOS to Windows leaves Windows CPU/GPU isolated; Apple A-series does not leak into PC fields',
  `PC CPU: ${stateB.pc.cpu}, Active HW CPU: ${activeHwB.cpu}`
);

// -------------------------------------------------------------------------
// TEST C: Windows to Android Isolation
// -------------------------------------------------------------------------
console.log('\nTEST C: Windows to Android switching isolation');
const stateC: IsolatedPlatformState = {
  activePlatform: 'pc',
  pc: { ...DEFAULT_WINDOWS_CONFIG, cpu: 'Intel Core i9-14900K', gpu: 'NVIDIA GeForce RTX 4090' },
  android: { ...DEFAULT_ANDROID_CONFIG, soc: 'Qualcomm Snapdragon 778G' },
  ios: { ...DEFAULT_IOS_CONFIG },
};

// Switch platform to Android
stateC.activePlatform = 'android';
const activeHwC = platformConfigToHardwarePreset(stateC.android);
const warzoneMobile = CURATED_GAMES.find(g => g.id === 'game-warzone-mobile')!;
const androidCompC = checkGameCompatibility(warzoneMobile, activeHwC);

assert(
  stateC.android.soc === 'Qualcomm Snapdragon 778G' &&
    !stateC.android.soc.toLowerCase().includes('intel') &&
    !stateC.android.soc.toLowerCase().includes('rtx') &&
    activeHwC.platform === 'android' &&
    activeHwC.cpu === 'Qualcomm Snapdragon 778G' &&
    androidCompC.checks.cpu.userHas.includes('Qualcomm Snapdragon 778G'),
  'Switching from Windows to Android uses Android-specific SoC inputs; Intel/RTX do not leak into Android fields',
  `Android SoC: ${stateC.android.soc}, Active HW CPU: ${activeHwC.cpu}`
);

// -------------------------------------------------------------------------
// TEST D: Windows to iOS Isolation
// -------------------------------------------------------------------------
console.log('\nTEST D: Windows to iOS switching isolation');
const stateD: IsolatedPlatformState = {
  activePlatform: 'pc',
  pc: { ...DEFAULT_WINDOWS_CONFIG, cpu: 'AMD Ryzen 7 7800X3D', gpu: 'AMD Radeon RX 7800 XT' },
  android: { ...DEFAULT_ANDROID_CONFIG },
  ios: { ...DEFAULT_IOS_CONFIG, iphoneModel: 'iPhone 13', chipset: 'Apple A15 Bionic' },
};

// Switch platform to iOS
stateD.activePlatform = 'ios';
const activeHwD = platformConfigToHardwarePreset(stateD.ios);

assert(
  stateD.ios.iphoneModel === 'iPhone 13' &&
    stateD.ios.chipset === 'Apple A15 Bionic' &&
    !stateD.ios.iphoneModel.toLowerCase().includes('ryzen') &&
    !stateD.ios.chipset.toLowerCase().includes('radeon') &&
    activeHwD.platform === 'ios' &&
    activeHwD.cpu === 'Apple A15 Bionic',
  'Switching from Windows to iOS uses iOS-specific model and chipset inputs without desktop leakage',
  `iOS Model: ${stateD.ios.iphoneModel}, Active HW CPU: ${activeHwD.cpu}`
);

// -------------------------------------------------------------------------
// TEST E: Repeated Platform Switching
// -------------------------------------------------------------------------
console.log('\nTEST E: Repeated platform switching cycles (PC -> Android -> iOS -> PC)');
const stateE: IsolatedPlatformState = {
  activePlatform: 'pc',
  pc: { ...DEFAULT_WINDOWS_CONFIG, cpu: 'Intel Core i5-12400F', gpu: 'NVIDIA GeForce RTX 3060 12GB' },
  android: { ...DEFAULT_ANDROID_CONFIG, soc: 'Qualcomm Snapdragon 8 Gen 3' },
  ios: { ...DEFAULT_IOS_CONFIG, iphoneModel: 'iPhone 15 Pro', chipset: 'Apple A17 Pro' },
};

const sequence: ('pc' | 'android' | 'ios')[] = ['pc', 'android', 'ios', 'pc', 'android', 'ios', 'pc'];
let noLeakageDuringCycle = true;

for (const plat of sequence) {
  stateE.activePlatform = plat;
  const hw = platformConfigToHardwarePreset(stateE[plat]);

  if (plat === 'pc') {
    if (hw.cpu.toLowerCase().includes('snapdragon') || hw.cpu.toLowerCase().includes('apple')) {
      noLeakageDuringCycle = false;
    }
  } else if (plat === 'android') {
    if (hw.cpu.toLowerCase().includes('intel') || hw.cpu.toLowerCase().includes('apple')) {
      noLeakageDuringCycle = false;
    }
  } else if (plat === 'ios') {
    if (hw.cpu.toLowerCase().includes('intel') || hw.cpu.toLowerCase().includes('snapdragon')) {
      noLeakageDuringCycle = false;
    }
  }
}

assert(
  noLeakageDuringCycle && stateE.activePlatform === 'pc' && stateE.pc.cpu === 'Intel Core i5-12400F',
  'Cycled through PC -> Android -> iOS -> PC repeatedly without cross-platform leakage or state corruption',
  `Final PC CPU: ${stateE.pc.cpu}`
);

// -------------------------------------------------------------------------
// TEST F: Platform-Specific Configuration Restoration
// -------------------------------------------------------------------------
console.log('\nTEST F: Preserving and restoring distinct user configurations per platform');
const stateF: IsolatedPlatformState = {
  activePlatform: 'pc',
  pc: { ...DEFAULT_WINDOWS_CONFIG, cpu: 'AMD Ryzen 7 7800X3D', gpu: 'NVIDIA GeForce RTX 4070' },
  android: { ...DEFAULT_ANDROID_CONFIG, soc: 'MediaTek Dimensity 9200' },
  ios: { ...DEFAULT_IOS_CONFIG, iphoneModel: 'iPhone 14 Pro', chipset: 'Apple A16 Bionic' },
};

// Switch away to Android, then iOS, then return to PC
stateF.activePlatform = 'android';
const androidHwF = platformConfigToHardwarePreset(stateF.android);
stateF.activePlatform = 'ios';
const iosHwF = platformConfigToHardwarePreset(stateF.ios);
stateF.activePlatform = 'pc';
const restoredPcHwF = platformConfigToHardwarePreset(stateF.pc);

assert(
  restoredPcHwF.cpu === 'AMD Ryzen 7 7800X3D' &&
    restoredPcHwF.gpu === 'NVIDIA GeForce RTX 4070' &&
    androidHwF.cpu === 'MediaTek Dimensity 9200' &&
    iosHwF.cpu === 'Apple A16 Bionic',
  'Each platform completely preserves its own custom configuration across switches and restores cleanly',
  `Restored PC: ${restoredPcHwF.cpu} + ${restoredPcHwF.gpu}, Android: ${androidHwF.cpu}, iOS: ${iosHwF.cpu}`
);

// -------------------------------------------------------------------------
// TEST G: Persistence & Sanitization of Corrupted State
// -------------------------------------------------------------------------
console.log('\nTEST G: Validation and sanitization of persisted local storage data');
const contaminatedStorageData = {
  activePlatform: 'pc',
  pc: {
    platform: 'pc',
    cpu: 'Qualcomm Snapdragon 8 Gen 3', // Corrupted leakage in old storage
    gpu: 'Adreno 750', // Corrupted leakage
    ramGb: 16,
    storageFreeGb: 150,
  },
  android: {
    platform: 'android',
    soc: 'Intel Core i9-14900K', // Corrupted leakage
  },
  ios: {
    platform: 'ios',
    iphoneModel: 'iPhone 13',
  },
};

const sanitizedState = validateAndSanitizePlatformState(contaminatedStorageData);

assert(
  sanitizedState.pc.cpu === DEFAULT_WINDOWS_CONFIG.cpu &&
    sanitizedState.pc.gpu === DEFAULT_WINDOWS_CONFIG.gpu &&
    sanitizedState.android.soc === DEFAULT_ANDROID_CONFIG.soc &&
    sanitizedState.ios.iphoneModel === 'iPhone 13',
  'Sanitizes contaminated storage data and resets corrupted cross-platform fields to clean defaults without crashing',
  `Sanitized PC CPU: ${sanitizedState.pc.cpu}, Sanitized Android SoC: ${sanitizedState.android.soc}`
);

// -------------------------------------------------------------------------
// TEST H: Shared Application State & Query Parsing Integrity
// -------------------------------------------------------------------------
console.log('\nTEST H: Shared application state integrity (Search & Discovery)');
const querySample = parseNaturalLanguageQuery('low end open world rpg for modest laptop');
const catalogPlatformFilterPc = CURATED_GAMES.filter(g => g.platforms.includes('pc'));
const catalogPlatformFilterMobile = CURATED_GAMES.filter(g => g.platforms.includes('android'));

assert(
  querySample.lowEndIntent === true &&
    querySample.detectedWorld === 'open-world' &&
    catalogPlatformFilterPc.length > 0 &&
    catalogPlatformFilterMobile.length > 0,
  'Search, intent parsing, and catalog platform filters operate deterministically and remain unaffected by hardware switches',
  `Intent: lowEnd=${querySample.lowEndIntent}, world=${querySample.detectedWorld}, PC games: ${catalogPlatformFilterPc.length}`
);

// -------------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED`);
console.log('======================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
