import { HardwarePreset } from '../types';
import {
  AndroidPlatformConfig,
  IosPlatformConfig,
  IsolatedPlatformState,
  PlatformSpecificConfig,
  WindowsPlatformConfig,
} from '../types/hardware';
import {
  resolveCpuModel,
  resolveGpuModel,
  resolveMobileSoc,
} from '../services/hardwareNormalization';

export interface ComponentOption {
  id: string;
  name: string;
  tier: number; // 1-10 scale
  brand: 'Intel' | 'AMD' | 'NVIDIA' | 'Apple' | 'Qualcomm' | 'MediaTek' | 'Other';
  vramGb?: number;
}

export const CPU_OPTIONS: ComponentOption[] = [
  { id: 'cpu-c2d', name: 'Intel Core 2 Duo / Celeron (Legacy)', tier: 1, brand: 'Intel' },
  { id: 'cpu-i3-2100', name: 'Intel Core i3-2100 / AMD Athlon X4', tier: 2, brand: 'Intel' },
  { id: 'cpu-i5-2500k', name: 'Intel Core i5-2500K / AMD FX-6300', tier: 3, brand: 'Intel' },
  { id: 'cpu-i5-4460', name: 'Intel Core i5-4460 / AMD Ryzen 3 1200', tier: 4, brand: 'Intel' },
  { id: 'cpu-i5-8400', name: 'Intel Core i5-8400 / AMD Ryzen 5 2600', tier: 5, brand: 'Intel' },
  { id: 'cpu-i5-10400', name: 'Intel Core i5-10400 / AMD Ryzen 5 3600', tier: 6, brand: 'Intel' },
  { id: 'cpu-i5-12400', name: 'Intel Core i5-12400F / AMD Ryzen 5 5600X', tier: 7, brand: 'Intel' },
  { id: 'cpu-i5-13600k', name: 'Intel Core i5-13600K / AMD Ryzen 7 7700X', tier: 8, brand: 'Intel' },
  { id: 'cpu-i7-14700k', name: 'Intel Core i7-14700K / AMD Ryzen 7 7800X3D', tier: 9, brand: 'Intel' },
  { id: 'cpu-i9-14900k', name: 'Intel Core i9-14900K / AMD Ryzen 9 7950X3D', tier: 10, brand: 'Intel' },
];

export const GPU_OPTIONS: ComponentOption[] = [
  { id: 'gpu-intel-hd4000', name: 'Intel HD Graphics 4000 / Basic Integrated', tier: 1, brand: 'Intel', vramGb: 1 },
  { id: 'gpu-intel-uhd630', name: 'Intel UHD 620/630 Integrated Graphics', tier: 2, brand: 'Intel', vramGb: 2 },
  { id: 'gpu-gt-1030', name: 'NVIDIA GeForce GT 1030 / AMD Radeon Vega 8', tier: 3, brand: 'NVIDIA', vramGb: 2 },
  { id: 'gpu-gtx-750ti', name: 'NVIDIA GeForce GTX 750 Ti / AMD Radeon RX 550', tier: 3, brand: 'NVIDIA', vramGb: 2 },
  { id: 'gpu-gtx-1050ti', name: 'NVIDIA GeForce GTX 1050 Ti 4GB / RX 560', tier: 4, brand: 'NVIDIA', vramGb: 4 },
  { id: 'gpu-gtx-1650', name: 'NVIDIA GeForce GTX 1650 4GB / RX 570', tier: 5, brand: 'NVIDIA', vramGb: 4 },
  { id: 'gpu-gtx-1060', name: 'NVIDIA GeForce GTX 1060 6GB / RX 580 8GB', tier: 6, brand: 'NVIDIA', vramGb: 6 },
  { id: 'gpu-rtx-2060', name: 'NVIDIA GeForce RTX 2060 6GB / RX 5600 XT', tier: 6, brand: 'NVIDIA', vramGb: 6 },
  { id: 'gpu-rtx-3060', name: 'NVIDIA GeForce RTX 3060 12GB / RX 6600 XT', tier: 7, brand: 'NVIDIA', vramGb: 12 },
  { id: 'gpu-rtx-4060', name: 'NVIDIA GeForce RTX 4060 8GB / RX 7600', tier: 8, brand: 'NVIDIA', vramGb: 8 },
  { id: 'gpu-rtx-3070', name: 'NVIDIA GeForce RTX 3070 / RTX 4060 Ti', tier: 8, brand: 'NVIDIA', vramGb: 8 },
  { id: 'gpu-rtx-4070', name: 'NVIDIA GeForce RTX 4070 12GB / RX 7800 XT', tier: 9, brand: 'NVIDIA', vramGb: 12 },
  { id: 'gpu-rtx-4080', name: 'NVIDIA GeForce RTX 4080 / RTX 4090', tier: 10, brand: 'NVIDIA', vramGb: 16 },
];

export const MOBILE_CHIPSETS: ComponentOption[] = [
  { id: 'mob-snap-680', name: 'Qualcomm Snapdragon 680 / Helio G88 (Entry)', tier: 2, brand: 'Qualcomm' },
  { id: 'mob-snap-778g', name: 'Qualcomm Snapdragon 778G / Dimensity 1080 (Midrange)', tier: 4, brand: 'Qualcomm' },
  { id: 'mob-a13', name: 'Apple A13 Bionic (iPhone 11)', tier: 4, brand: 'Apple' },
  { id: 'mob-snap-8g1', name: 'Qualcomm Snapdragon 8 Gen 1 / Dimensity 9000', tier: 6, brand: 'Qualcomm' },
  { id: 'mob-a15', name: 'Apple A15 Bionic (iPhone 13 / 14)', tier: 6, brand: 'Apple' },
  { id: 'mob-snap-8g2', name: 'Qualcomm Snapdragon 8 Gen 2', tier: 7, brand: 'Qualcomm' },
  { id: 'mob-a17', name: 'Apple A17 Pro (iPhone 15 Pro)', tier: 8, brand: 'Apple' },
  { id: 'mob-snap-8g3', name: 'Qualcomm Snapdragon 8 Gen 3', tier: 8, brand: 'Qualcomm' },
];

/**
 * Intelligent deterministic resolvers that parse user-written text inputs
 * backed by the centralized hardware intelligence database.
 */
export function resolveCpuTier(cpuText: string): number {
  const res = resolveCpuModel(cpuText);
  if (res.record) {
    return res.record.tier;
  }

  const t = cpuText.toLowerCase().trim();
  if (!t) return 5;
  if (t.includes('14900') || t.includes('13900') || t.includes('7950') || t.includes('7800x3d') || t.includes('7900x3d')) return 10;
  if (t.includes('14700') || t.includes('13700') || t.includes('7700') || t.includes('7800') || t.includes('5950')) return 9;
  if (t.includes('13600') || t.includes('14600') || t.includes('12700') || t.includes('5900') || t.includes('5800x3d') || t.includes('7600')) return 8;
  if (t.includes('12600') || t.includes('12400') || t.includes('13400') || t.includes('5600') || t.includes('5700') || t.includes('3700') || t.includes('3800') || t.includes('11700')) return 7;
  if (t.includes('10400') || t.includes('10600') || t.includes('10700') || t.includes('3600') || t.includes('8700') || t.includes('9700') || t.includes('9600')) return 6;
  if (t.includes('8400') || t.includes('2600') || t.includes('1600') || t.includes('6700') || t.includes('7700') || t.includes('4790') || t.includes('4770')) return 5;
  if (t.includes('4460') || t.includes('4590') || t.includes('4690') || t.includes('1200') || t.includes('1300') || t.includes('2400g') || t.includes('3400g') || t.includes('3570')) return 4;
  if (t.includes('2500') || t.includes('2400') || t.includes('2300') || t.includes('6300') || t.includes('8350') || t.includes('i3-4') || t.includes('i3-6') || t.includes('i3-7') || t.includes('i3-8') || t.includes('i3-9') || t.includes('i3-10')) return 3;
  if (t.includes('2100') || t.includes('c2d') || t.includes('core 2') || t.includes('celeron') || t.includes('pentium') || t.includes('athlon')) return 1;

  if (t.includes('i9') || t.includes('ryzen 9')) return 9;
  if (t.includes('i7') || t.includes('ryzen 7')) return 8;
  if (t.includes('i5') || t.includes('ryzen 5')) return 6;
  if (t.includes('i3') || t.includes('ryzen 3')) return 4;

  return 5;
}

export function resolveGpuTier(gpuText: string): number {
  const res = resolveGpuModel(gpuText);
  if (res.record) {
    return res.record.tier;
  }

  const t = gpuText.toLowerCase().trim();
  if (!t) return 5;
  if (t.includes('5090') || t.includes('5080') || t.includes('4090') || t.includes('4080') || t.includes('7900 xtx') || t.includes('7900 xt')) return 10;
  if (t.includes('5070') || t.includes('4070 ti') || t.includes('4070 super') || t.includes('4070') || t.includes('3090') || t.includes('3080 ti') || t.includes('3080') || t.includes('7900 gre') || t.includes('7800 xt') || t.includes('6950') || t.includes('6900')) return 9;
  if (t.includes('5060') || t.includes('4060 ti') || t.includes('3070 ti') || t.includes('3070') || t.includes('2080 ti') || t.includes('2080 super') || t.includes('2080') || t.includes('6800 xt') || t.includes('6800') || t.includes('7700 xt') || t.includes('a770') || t.includes('a750')) return 8;
  if (t.includes('4060') || t.includes('3060 ti') || t.includes('3060') || t.includes('2070 super') || t.includes('2070') || t.includes('6700 xt') || t.includes('6700') || t.includes('7600 xt') || t.includes('7600') || t.includes('5700 xt') || t.includes('a580')) return 7;
  if (t.includes('2060 super') || t.includes('2060') || t.includes('1080 ti') || t.includes('1080') || t.includes('1070 ti') || t.includes('1070') || t.includes('1660 ti') || t.includes('1660 super') || t.includes('1660') || t.includes('6600 xt') || t.includes('6600') || t.includes('5600 xt')) return 6;
  if (t.includes('1650 super') || t.includes('1650') || t.includes('1060') || t.includes('rx 580') || t.includes('rx 570') || t.includes('rx 480') || t.includes('rx 470') || t.includes('rx 5500') || t.includes('gtx 980') || t.includes('gtx 970')) return 5;
  if (t.includes('1050 ti') || t.includes('1050') || t.includes('rx 560') || t.includes('rx 460') || t.includes('gtx 960') || t.includes('gtx 780') || t.includes('gtx 770')) return 4;
  if (t.includes('gtx 750 ti') || t.includes('gtx 750') || t.includes('gt 1030') || t.includes('rx 550') || t.includes('vega 8') || t.includes('vega 7') || t.includes('vega 11') || t.includes('gtx 660') || t.includes('mx450') || t.includes('mx350')) return 3;
  if (t.includes('uhd') || t.includes('intel hd') || t.includes('iris') || t.includes('integrated') || t.includes('hd 630') || t.includes('hd 620') || t.includes('hd 4000') || t.includes('vega 3') || t.includes('radeon graphics')) return 2;
  if (t.includes('9800') || t.includes('hd 3000') || t.includes('gma')) return 1;

  if (t.includes('rtx 50')) return 8;
  if (t.includes('rtx 40')) return 8;
  if (t.includes('rtx 30')) return 7;
  if (t.includes('rtx 20')) return 6;
  if (t.includes('gtx 16')) return 5;
  if (t.includes('gtx 10')) return 5;

  return 5;
}

export function resolveAndroidChipsetTier(chipsetText: string): number {
  const res = resolveMobileSoc(chipsetText);
  if (res.record) {
    return res.record.tier;
  }

  const t = chipsetText.toLowerCase().trim();
  if (!t) return 4;

  if (t.includes('8s gen 3') || t.includes('8sgen3')) return 7;
  if (t.includes('7s gen 2') || t.includes('7sgen2')) return 4;
  if (t.includes('7s gen 3') || t.includes('7sgen3')) return 5;

  if (t.includes('gen 3') || t.includes('gen 4') || t.includes('dimensity 9300') || t.includes('dimensity 9400')) return 8;
  if (t.includes('gen 2') || t.includes('dimensity 9200') || t.includes('tensor g4') || t.includes('tensor g3')) return 7;
  if (t.includes('gen 1') || t.includes('8+ gen 1') || t.includes('dimensity 9000') || t.includes('888') || t.includes('tensor g2') || t.includes('tensor')) return 6;
  if (t.includes('870') || t.includes('865') || t.includes('860') || t.includes('855') || t.includes('dimensity 8200') || t.includes('dimensity 8100') || t.includes('dimensity 1200')) return 5;
  if (t.includes('7+ gen 2') || t.includes('7 gen 1') || t.includes('778') || t.includes('780') || t.includes('778g') || t.includes('dimensity 1080') || t.includes('dimensity 7050') || t.includes('dimensity 920') || t.includes('845')) return 4;
  if (t.includes('695') || t.includes('750') || t.includes('730') || t.includes('720') || t.includes('712') || t.includes('dimensity 700') || t.includes('dimensity 800') || t.includes('helio g99')) return 3;
  if (t.includes('680') || t.includes('665') || t.includes('660') || t.includes('helio g88') || t.includes('helio g85') || t.includes('helio p') || t.includes('snapdragon 4')) return 2;

  return 4;
}

export function resolveIphoneModel(modelText: string): {
  cpu: string;
  cpuTier: number;
  gpu: string;
  gpuTier: number;
  defaultRam: number;
  os: string;
} {
  const t = modelText.toLowerCase().trim();

  if (t.includes('16 pro') || t.includes('16 pro max')) {
    return { cpu: 'Apple A18 Pro', cpuTier: 8, gpu: 'Apple 6-core GPU', gpuTier: 8, defaultRam: 8, os: 'iOS 18' };
  }
  if (t.includes('16') || t.includes('16 plus')) {
    return { cpu: 'Apple A18', cpuTier: 8, gpu: 'Apple 5-core GPU', gpuTier: 8, defaultRam: 8, os: 'iOS 18' };
  }
  if (t.includes('15 pro') || t.includes('15 pro max')) {
    return { cpu: 'Apple A17 Pro', cpuTier: 8, gpu: 'Apple 6-core GPU', gpuTier: 8, defaultRam: 8, os: 'iOS 17' };
  }
  if (t.includes('15') || t.includes('15 plus') || t.includes('14 pro') || t.includes('14 pro max')) {
    return { cpu: 'Apple A16 Bionic', cpuTier: 7, gpu: 'Apple 5-core GPU', gpuTier: 7, defaultRam: 6, os: 'iOS 17' };
  }
  if (t.includes('14') || t.includes('14 plus') || t.includes('13 pro') || t.includes('13 pro max')) {
    return { cpu: 'Apple A15 Bionic (5-core GPU)', cpuTier: 6, gpu: 'Apple 5-core GPU', gpuTier: 6, defaultRam: 6, os: 'iOS 17' };
  }
  if (t.includes('13') || t.includes('13 mini') || t.includes('se 3') || t.includes('se (3rd')) {
    return { cpu: 'Apple A15 Bionic', cpuTier: 6, gpu: 'Apple 4-core GPU', gpuTier: 6, defaultRam: 4, os: 'iOS 17' };
  }
  if (t.includes('12 pro') || t.includes('12 pro max')) {
    return { cpu: 'Apple A14 Bionic', cpuTier: 5, gpu: 'Apple 4-core GPU', gpuTier: 5, defaultRam: 6, os: 'iOS 16' };
  }
  if (t.includes('12') || t.includes('12 mini')) {
    return { cpu: 'Apple A14 Bionic', cpuTier: 5, gpu: 'Apple 4-core GPU', gpuTier: 5, defaultRam: 4, os: 'iOS 16' };
  }
  if (t.includes('11 pro') || t.includes('11 pro max')) {
    return { cpu: 'Apple A13 Bionic', cpuTier: 4, gpu: 'Apple 4-core GPU', gpuTier: 4, defaultRam: 4, os: 'iOS 16' };
  }
  if (t.includes('11') || t.includes('se 2') || t.includes('se (2nd')) {
    return { cpu: 'Apple A13 Bionic', cpuTier: 4, gpu: 'Apple 4-core GPU', gpuTier: 4, defaultRam: 4, os: 'iOS 15' };
  }
  if (t.includes('xs') || t.includes('xr') || t.includes('x max')) {
    return { cpu: 'Apple A12 Bionic', cpuTier: 3, gpu: 'Apple 4-core GPU', gpuTier: 3, defaultRam: 3, os: 'iOS 15' };
  }
  if (t.includes('x') || t.includes('8 plus') || t.includes('8')) {
    return { cpu: 'Apple A11 Bionic', cpuTier: 2, gpu: 'Apple 3-core GPU', gpuTier: 2, defaultRam: 3, os: 'iOS 14' };
  }

  // Default modern iPhone
  return {
    cpu: `Apple A-Series (${modelText || 'iPhone'})`,
    cpuTier: 6,
    gpu: 'Apple GPU',
    gpuTier: 6,
    defaultRam: 6,
    os: 'iOS 17',
  };
}

// Platform-Specific Default Configurations
export const DEFAULT_WINDOWS_CONFIG: WindowsPlatformConfig = {
  platform: 'pc',
  cpu: 'Intel Core i5-12400F',
  cpuTier: 7,
  gpu: 'NVIDIA GeForce RTX 3060 12GB',
  gpuTier: 7,
  ramGb: 16,
  storageFreeGb: 150,
  targetResolution: '1080p',
  os: 'Windows 11 64-bit',
  name: 'Custom PC Rig (RTX 3060)',
};

export const DEFAULT_ANDROID_CONFIG: AndroidPlatformConfig = {
  platform: 'android',
  deviceModel: 'Snapdragon 778G',
  soc: 'Qualcomm Snapdragon 778G',
  socTier: 4,
  gpuDesc: 'Adreno 642L',
  ramGb: 6,
  storageFreeGb: 64,
  os: 'Android 13 / 14',
  name: 'Android (Snapdragon 778G)',
};

export const DEFAULT_IOS_CONFIG: IosPlatformConfig = {
  platform: 'ios',
  iphoneModel: 'iPhone 13',
  chipset: 'Apple A15 Bionic',
  chipsetTier: 6,
  gpuDesc: 'Apple 4-core GPU',
  ramGb: 4,
  storageFreeGb: 64,
  os: 'iOS 17',
  name: 'iPhone 13',
};

export const DEFAULT_ISOLATED_PLATFORM_STATE: IsolatedPlatformState = {
  activePlatform: 'pc',
  pc: DEFAULT_WINDOWS_CONFIG,
  android: DEFAULT_ANDROID_CONFIG,
  ios: DEFAULT_IOS_CONFIG,
};

/**
 * Transforms an isolated platform configuration into the standardized HardwarePreset
 * used by the UI and comparison engine.
 */
export function platformConfigToHardwarePreset(config: PlatformSpecificConfig): HardwarePreset {
  if (config.platform === 'pc') {
    return {
      id: 'pc-rig',
      name: config.name || `${config.gpu} · ${config.ramGb}GB RAM`,
      category: 'pc',
      tagline: `${config.gpu} · ${config.cpu} · ${config.ramGb}GB RAM · ${config.targetResolution}`,
      platform: 'pc',
      cpu: config.cpu,
      cpuTier: config.cpuTier,
      gpu: config.gpu,
      gpuTier: config.gpuTier,
      ramGb: config.ramGb,
      os: config.os,
      storageFreeGb: config.storageFreeGb,
      targetResolution: config.targetResolution,
    };
  } else if (config.platform === 'android') {
    return {
      id: 'android-rig',
      name: config.name || `Android (${config.soc})`,
      category: 'mobile',
      tagline: `${config.soc} · ${config.ramGb}GB RAM · ${config.os}`,
      platform: 'android',
      cpu: config.soc,
      cpuTier: config.socTier,
      gpu: config.gpuDesc || 'Adreno / Mali GPU',
      gpuTier: config.socTier,
      ramGb: config.ramGb,
      os: config.os,
      storageFreeGb: config.storageFreeGb,
      targetResolution: '1080p',
      deviceModel: config.deviceModel || config.soc,
    };
  } else {
    return {
      id: 'ios-rig',
      name: config.name || config.iphoneModel,
      category: 'mobile',
      tagline: `${config.iphoneModel} · ${config.chipset} · ${config.ramGb}GB RAM`,
      platform: 'ios',
      cpu: config.chipset,
      cpuTier: config.chipsetTier,
      gpu: config.gpuDesc || 'Apple GPU',
      gpuTier: config.chipsetTier,
      ramGb: config.ramGb,
      os: config.os,
      storageFreeGb: config.storageFreeGb,
      targetResolution: '1080p',
      deviceModel: config.iphoneModel,
    };
  }
}

/**
 * Validates and sanitizes platform state, purging cross-platform leakage
 */
export function validateAndSanitizePlatformState(saved: any): IsolatedPlatformState {
  if (!saved || typeof saved !== 'object') {
    return DEFAULT_ISOLATED_PLATFORM_STATE;
  }

  const activePlatform: 'pc' | 'android' | 'ios' =
    saved.activePlatform === 'android' || saved.activePlatform === 'ios' ? saved.activePlatform : 'pc';

  // Sanitize PC
  let pc: WindowsPlatformConfig = { ...DEFAULT_WINDOWS_CONFIG, ...(saved.pc || {}) };
  const pcCpuLower = (pc.cpu || '').toLowerCase();
  const pcGpuLower = (pc.gpu || '').toLowerCase();
  // Check if PC CPU/GPU contains mobile chipsets
  if (
    pcCpuLower.includes('snapdragon') ||
    pcCpuLower.includes('apple') ||
    pcCpuLower.includes('dimensity') ||
    pcCpuLower.includes('helio') ||
    pcCpuLower.includes('tensor') ||
    pcCpuLower.includes('bionic') ||
    pcGpuLower.includes('adreno') ||
    pcGpuLower.includes('mali') ||
    pcGpuLower.includes('apple')
  ) {
    pc = { ...DEFAULT_WINDOWS_CONFIG };
  }

  // Sanitize Android
  let android: AndroidPlatformConfig = { ...DEFAULT_ANDROID_CONFIG, ...(saved.android || {}) };
  const androidSocLower = (android.soc || '').toLowerCase();
  if (
    androidSocLower.includes('intel') ||
    androidSocLower.includes('geforce') ||
    androidSocLower.includes('rtx') ||
    androidSocLower.includes('gtx') ||
    androidSocLower.includes('radeon rx')
  ) {
    android = { ...DEFAULT_ANDROID_CONFIG };
  }

  // Sanitize iOS
  let ios: IosPlatformConfig = { ...DEFAULT_IOS_CONFIG, ...(saved.ios || {}) };
  const iosModelLower = (ios.iphoneModel || '').toLowerCase();
  if (
    iosModelLower.includes('intel') ||
    iosModelLower.includes('snapdragon') ||
    iosModelLower.includes('geforce') ||
    iosModelLower.includes('rtx')
  ) {
    ios = { ...DEFAULT_IOS_CONFIG };
  }

  return {
    activePlatform,
    pc,
    android,
    ios,
  };
}

// Initial default custom rig
export const DEFAULT_HARDWARE: HardwarePreset = platformConfigToHardwarePreset(DEFAULT_WINDOWS_CONFIG);

export const HARDWARE_PRESETS: HardwarePreset[] = [
  DEFAULT_HARDWARE,
];
