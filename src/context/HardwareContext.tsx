/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_ANDROID_CONFIG,
  DEFAULT_IOS_CONFIG,
  DEFAULT_ISOLATED_PLATFORM_STATE,
  DEFAULT_WINDOWS_CONFIG,
  HARDWARE_PRESETS,
  platformConfigToHardwarePreset,
  validateAndSanitizePlatformState,
} from '../data/hardware';
import { checkGameCompatibility } from '../services/compatibility';
import { CompatibilityResult, Game, HardwarePreset, Platform } from '../types';
import {
  AndroidPlatformConfig,
  IosPlatformConfig,
  IsolatedPlatformState,
  WindowsPlatformConfig,
} from '../types/hardware';

interface HardwareContextValue {
  hardware: HardwarePreset;
  activePlatform: Platform;
  setActivePlatform: (platform: Platform) => void;
  platformState: IsolatedPlatformState;
  updateWindowsConfig: (partial: Partial<WindowsPlatformConfig>) => void;
  updateAndroidConfig: (partial: Partial<AndroidPlatformConfig>) => void;
  updateIosConfig: (partial: Partial<IosPlatformConfig>) => void;
  updateHardware: (partial: Partial<HardwarePreset>) => void;
  setHardwarePreset: (presetId: string) => void;
  checkCompatibility: (game: Game) => CompatibilityResult;
  isHardwareModalOpen: boolean;
  openHardwareModal: () => void;
  closeHardwareModal: () => void;
  resetToDefault: () => void;
  resetPlatformToDefault: (platform: Platform) => void;
}

const STORAGE_KEY = 'gamefit_isolated_platforms_v2';

const HardwareContext = createContext<HardwareContextValue | null>(null);

export const HardwareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [platformState, setPlatformState] = useState<IsolatedPlatformState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return validateAndSanitizePlatformState(parsed);
      }
    } catch {
      // ignore storage parsing error
    }
    return DEFAULT_ISOLATED_PLATFORM_STATE;
  });

  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);

  // Sync to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(platformState));
    } catch {
      // ignore storage error
    }
  }, [platformState]);

  // Derived active hardware preset strictly isolated to activePlatform
  const activeConfig = platformState[platformState.activePlatform];
  const hardware: HardwarePreset = platformConfigToHardwarePreset(activeConfig);

  const setActivePlatform = (platform: Platform) => {
    setPlatformState(prev => {
      if (prev.activePlatform === platform) return prev;
      return {
        ...prev,
        activePlatform: platform,
      };
    });
  };

  const updateWindowsConfig = (partial: Partial<WindowsPlatformConfig>) => {
    setPlatformState(prev => {
      const updatedPc: WindowsPlatformConfig = {
        ...prev.pc,
        ...partial,
        name: partial.name || `${partial.gpu || prev.pc.gpu} · ${partial.ramGb || prev.pc.ramGb}GB RAM`,
      };
      return {
        ...prev,
        pc: updatedPc,
      };
    });
  };

  const updateAndroidConfig = (partial: Partial<AndroidPlatformConfig>) => {
    setPlatformState(prev => {
      const socName = partial.soc || prev.android.soc;
      const updatedAndroid: AndroidPlatformConfig = {
        ...prev.android,
        ...partial,
        deviceModel: partial.deviceModel || socName,
        name: partial.name || `Android (${socName})`,
      };
      return {
        ...prev,
        android: updatedAndroid,
      };
    });
  };

  const updateIosConfig = (partial: Partial<IosPlatformConfig>) => {
    setPlatformState(prev => {
      const model = partial.iphoneModel || prev.ios.iphoneModel;
      const updatedIos: IosPlatformConfig = {
        ...prev.ios,
        ...partial,
        name: partial.name || model,
      };
      return {
        ...prev,
        ios: updatedIos,
      };
    });
  };

  // Backward-compatible updateHardware that safely routes to the active platform's config
  const updateHardware = (partial: Partial<HardwarePreset>) => {
    const targetPlatform = partial.platform || platformState.activePlatform;

    if (targetPlatform === 'pc') {
      updateWindowsConfig({
        cpu: partial.cpu,
        cpuTier: partial.cpuTier,
        gpu: partial.gpu,
        gpuTier: partial.gpuTier,
        ramGb: partial.ramGb,
        storageFreeGb: partial.storageFreeGb,
        targetResolution: partial.targetResolution,
        os: partial.os,
        name: partial.name,
      });
      if (platformState.activePlatform !== 'pc') {
        setActivePlatform('pc');
      }
    } else if (targetPlatform === 'android') {
      updateAndroidConfig({
        soc: partial.cpu,
        socTier: partial.cpuTier,
        deviceModel: partial.deviceModel || partial.cpu,
        ramGb: partial.ramGb,
        storageFreeGb: partial.storageFreeGb,
        os: partial.os,
        name: partial.name,
      });
      if (platformState.activePlatform !== 'android') {
        setActivePlatform('android');
      }
    } else if (targetPlatform === 'ios') {
      updateIosConfig({
        iphoneModel: partial.deviceModel || 'iPhone 13',
        chipset: partial.cpu,
        chipsetTier: partial.cpuTier,
        ramGb: partial.ramGb,
        storageFreeGb: partial.storageFreeGb,
        os: partial.os,
        name: partial.name,
      });
      if (platformState.activePlatform !== 'ios') {
        setActivePlatform('ios');
      }
    }
  };

  const setHardwarePreset = (presetId: string) => {
    const found = HARDWARE_PRESETS.find(p => p.id === presetId);
    if (found) {
      updateHardware({ ...found });
    }
  };

  const checkCompatibility = (game: Game) => {
    return checkGameCompatibility(game, hardware);
  };

  const resetPlatformToDefault = (platform: Platform) => {
    setPlatformState(prev => {
      if (platform === 'pc') return { ...prev, pc: DEFAULT_WINDOWS_CONFIG };
      if (platform === 'android') return { ...prev, android: DEFAULT_ANDROID_CONFIG };
      return { ...prev, ios: DEFAULT_IOS_CONFIG };
    });
  };

  const resetToDefault = () => {
    setPlatformState(DEFAULT_ISOLATED_PLATFORM_STATE);
  };

  return (
    <HardwareContext.Provider
      value={{
        hardware,
        activePlatform: platformState.activePlatform,
        setActivePlatform,
        platformState,
        updateWindowsConfig,
        updateAndroidConfig,
        updateIosConfig,
        updateHardware,
        setHardwarePreset,
        checkCompatibility,
        isHardwareModalOpen,
        openHardwareModal: () => setIsHardwareModalOpen(true),
        closeHardwareModal: () => setIsHardwareModalOpen(false),
        resetToDefault,
        resetPlatformToDefault,
      }}
    >
      {children}
    </HardwareContext.Provider>
  );
};

export function useHardware(): HardwareContextValue {
  const ctx = useContext(HardwareContext);
  if (!ctx) {
    throw new Error('useHardware must be used within HardwareProvider');
  }
  return ctx;
}
