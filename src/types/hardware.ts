/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HardwareType = 'desktop-gpu' | 'desktop-cpu' | 'mobile-soc';

export type Manufacturer = 'NVIDIA' | 'AMD' | 'Intel' | 'Qualcomm' | 'MediaTek' | 'Apple' | 'Samsung' | 'Google' | 'Other';

export interface BenchmarkRecord {
  benchmarkName: 
    | '3dmark-timespy-graphics' 
    | '3dmark-firestrike' 
    | '3dmark-wildlife-extreme' 
    | 'geekbench6-single' 
    | 'geekbench6-multi' 
    | 'passmark-g3d' 
    | 'passmark-cpu';
  score: number;
  unit: string;
  testType: 'synthetic-graphics' | 'synthetic-cpu' | 'gaming-aggregate' | 'mobile-compute';
  sourceIdentifier: string;
  captureDate: string;
  confidence: 'high' | 'medium' | 'estimated';
}

export interface GpuSpecifications {
  vramGb: number;
  vramType?: 'GDDR7' | 'GDDR6X' | 'GDDR6' | 'GDDR5' | 'Shared' | 'HBM2';
  directXFeatureLevel: '12_2' | '12_1' | '12_0' | '11_1' | '11_0' | '10_0';
  vulkanVersion: '1.3' | '1.2' | '1.1' | 'None';
  hardwareRayTracing: boolean;
  shaderModel: '6.7' | '6.6' | '6.5' | '6.4' | '6.3' | '6.2' | '6.0' | '5.1' | '5.0';
  tdpWatts?: number;
}

export interface CpuSpecifications {
  cores: number;
  threads: number;
  baseClockGhz: number;
  boostClockGhz: number;
  instructionSets: ('AVX2' | 'AVX-512' | 'AVX' | 'SSE4.2')[];
  architecture: string;
}

export interface MobileSocSpecifications {
  cpuCluster: string;
  gpuModel: string;
  vulkanVersion: '1.3' | '1.2' | '1.1' | 'None';
  processNodeNm: number;
}

export interface NormalizedHardwareRecord {
  id: string;
  canonicalName: string;
  manufacturer: Manufacturer;
  hardwareType: HardwareType;
  family: string;
  modelIdentifier: string;
  architecture: string;
  generation?: number;
  aliases: string[];
  specifications: {
    gpu?: GpuSpecifications;
    cpu?: CpuSpecifications;
    mobileSoc?: MobileSocSpecifications;
  };
  benchmarks: BenchmarkRecord[];
  sourceReferences: string[];
  confidence: 'high' | 'medium' | 'low';
  lastVerifiedAt: string;
  performanceIndex: number; // 1-100 baseline comparative index
  tier: number; // 1-10 scale for UI convenience
}

export type ComparisonMethod = 
  | 'direct-benchmark' 
  | 'normalized-performance' 
  | 'verified-compatibility' 
  | 'architecture-capability' 
  | 'unknown';

export interface ComponentComparisonResult {
  status: 'meets' | 'below' | 'uncertain' | 'unsupported';
  confidence: 'high' | 'medium' | 'low';
  userHardware: string;
  userRecord?: NormalizedHardwareRecord;
  requiredHardware: string;
  requiredRecord?: NormalizedHardwareRecord;
  comparisonMethod: ComparisonMethod;
  explanation: string;
  relativePerformanceRatio?: number;
  missingFeatures?: string[];
  sourceReferences: string[];
  limitations?: string;
}

export interface WindowsPlatformConfig {
  platform: 'pc';
  cpu: string;
  cpuTier: number;
  gpu: string;
  gpuTier: number;
  ramGb: number;
  storageFreeGb: number;
  targetResolution: '720p' | '1080p' | '1440p' | '4k';
  os: string;
  name: string;
}

export interface AndroidPlatformConfig {
  platform: 'android';
  deviceModel: string;
  soc: string;
  socTier: number;
  gpuDesc: string;
  ramGb: number;
  storageFreeGb: number;
  os: string;
  name: string;
}

export interface IosPlatformConfig {
  platform: 'ios';
  iphoneModel: string;
  chipset: string;
  chipsetTier: number;
  gpuDesc: string;
  ramGb: number;
  storageFreeGb: number;
  os: string;
  name: string;
}

export type PlatformSpecificConfig = WindowsPlatformConfig | AndroidPlatformConfig | IosPlatformConfig;

export interface IsolatedPlatformState {
  activePlatform: 'pc' | 'android' | 'ios';
  pc: WindowsPlatformConfig;
  android: AndroidPlatformConfig;
  ios: IosPlatformConfig;
}
