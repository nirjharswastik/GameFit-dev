/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CompatibilityMatrix } from '../components/games/CompatibilityMatrix';
import { IconAlert, IconArrowRight, IconCheck, IconInfo, IconMonitor, IconSliders, IconSmartphone } from '../components/common/Icons';
import { useHardware } from '../context/HardwareContext';
import { CURATED_GAMES } from '../data/games';
import { resolveAndroidChipsetTier, resolveCpuTier, resolveGpuTier, resolveIphoneModel } from '../data/hardware';
import { checkGameCompatibility } from '../services/compatibility';
import { getSimilarAndAlternativeGames } from '../services/recommendations';
import { Game, Platform } from '../types';

interface CompatibilityViewProps {
  onSelectGame: (game: Game) => void;
  onViewAlternatives: (game: Game) => void;
}

export const CompatibilityView: React.FC<CompatibilityViewProps> = ({
  onSelectGame,
  onViewAlternatives,
}) => {
  const {
    hardware,
    activePlatform,
    setActivePlatform,
    platformState,
    updateWindowsConfig,
    updateAndroidConfig,
    updateIosConfig,
  } = useHardware();

  const [selectedGameId, setSelectedGameId] = useState<string>(CURATED_GAMES[0].id);

  // String state for storage to prevent stuck "0" when backspacing
  const currentActiveStorage = platformState[activePlatform].storageFreeGb;
  const [storageInput, setStorageInput] = useState<string>(String(currentActiveStorage || 150));

  // Keep storageInput in sync when active platform or underlying profile changes
  useEffect(() => {
    setStorageInput(String(platformState[activePlatform].storageFreeGb || 100));
  }, [activePlatform, platformState]);

  const selectedGame = CURATED_GAMES.find(g => g.id === selectedGameId) || CURATED_GAMES[0];
  const compatibility = checkGameCompatibility(selectedGame, hardware);
  const alternatives = getSimilarAndAlternativeGames(selectedGame, CURATED_GAMES, hardware);

  const handlePlatformChange = (p: Platform) => {
    setActivePlatform(p);
  };

  const handleStorageChange = (val: string) => {
    if (val === '' || /^\d+$/.test(val)) {
      setStorageInput(val);
      const parsed = val.trim() === '' ? 0 : Number(val);
      if (activePlatform === 'pc') {
        updateWindowsConfig({ storageFreeGb: parsed });
      } else if (activePlatform === 'android') {
        updateAndroidConfig({ storageFreeGb: parsed });
      } else if (activePlatform === 'ios') {
        updateIosConfig({ storageFreeGb: parsed });
      }
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-[#DCDCD4] pb-6 space-y-2">
        <div className="text-[11px] font-mono font-semibold uppercase text-[#85867F]">
          TECHNICAL COMPARISON UTILITY
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#20211F] tracking-tight">
          Device compatibility audit
        </h1>
        <p className="text-sm text-[#686A64] max-w-2xl leading-relaxed">
          Compare verified publisher specifications against your computer or mobile device. Understand exact component matches, architectural bottlenecks, and requirements uncertainty.
        </p>
      </div>

      {/* Main Two-Column Workbench (4 cols inputs, 8 cols diagnostic results) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#DCDCD4] rounded-[10px] p-6 space-y-6 shadow-xs">
          {/* Step 1: Platform Selector */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#686A64] mb-2">
              1. Platform
            </h2>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#EEEDE7] rounded-[8px] border border-[#DCDCD4]">
              <button
                type="button"
                onClick={() => handlePlatformChange('pc')}
                className={`py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                  activePlatform === 'pc' ? 'bg-white text-[#20211F] shadow-xs' : 'text-[#686A64] hover:text-[#20211F]'
                }`}
              >
                PC
              </button>
              <button
                type="button"
                onClick={() => handlePlatformChange('android')}
                className={`py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                  activePlatform === 'android' ? 'bg-white text-[#20211F] shadow-xs' : 'text-[#686A64] hover:text-[#20211F]'
                }`}
              >
                Android
              </button>
              <button
                type="button"
                onClick={() => handlePlatformChange('ios')}
                className={`py-1.5 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
                  activePlatform === 'ios' ? 'bg-white text-[#20211F] shadow-xs' : 'text-[#686A64] hover:text-[#20211F]'
                }`}
              >
                Apple iOS
              </button>
            </div>
          </div>

          {/* Step 2: Select Game */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#686A64] mb-2">
              2. Select Game to Check
            </h2>
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="w-full text-xs sm:text-sm bg-[#F6F5F1] border border-[#DCDCD4] rounded-[8px] p-2.5 text-[#20211F] font-medium focus:outline-none focus:border-[#C85B38]"
            >
              {CURATED_GAMES.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.releaseYear}) — {g.platforms.map(p => p.toUpperCase()).join('/')}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Hardware Specifications (Direct Text Entry with Platform Isolation) */}
          <div className="space-y-4 pt-4 border-t border-[#E8E7E0]">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#686A64]">
                3. Enter Your Components
              </h2>
              <span className="font-mono text-[11px] text-[#85867F]">
                {activePlatform === 'pc' ? platformState.pc.targetResolution : activePlatform.toUpperCase()}
              </span>
            </div>

            {/* PC Component Text Inputs - Strictly Isolated to platformState.pc */}
            {activePlatform === 'pc' && (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[#20211F] font-medium">Processor (CPU):</label>
                    <span className="text-[#85867F] font-mono text-[10px]">
                      Tier {resolveCpuTier(platformState.pc.cpu)}/10
                    </span>
                  </div>
                  <input
                    type="text"
                    value={platformState.pc.cpu}
                    onChange={(e) => {
                      const name = e.target.value;
                      const tier = resolveCpuTier(name);
                      updateWindowsConfig({ cpu: name, cpuTier: tier });
                    }}
                    placeholder="e.g. Intel Core i5-12400F, Ryzen 5 5600X..."
                    className="w-full bg-[#F6F5F1] border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F] focus:outline-none focus:border-[#C85B38]"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[#20211F] font-medium">Graphics Card (GPU):</label>
                    <span className="text-[#85867F] font-mono text-[10px]">
                      Tier {resolveGpuTier(platformState.pc.gpu)}/10
                    </span>
                  </div>
                  <input
                    type="text"
                    value={platformState.pc.gpu}
                    onChange={(e) => {
                      const name = e.target.value;
                      const tier = resolveGpuTier(name);
                      updateWindowsConfig({ gpu: name, gpuTier: tier });
                    }}
                    placeholder="e.g. NVIDIA GeForce RTX 3060, GTX 1650..."
                    className="w-full bg-[#F6F5F1] border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F] focus:outline-none focus:border-[#C85B38]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[#20211F] font-medium block mb-1">RAM (GB):</label>
                    <select
                      value={platformState.pc.ramGb}
                      onChange={(e) => updateWindowsConfig({ ramGb: Number(e.target.value) })}
                      className="w-full bg-[#F6F5F1] border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F]"
                    >
                      {[4, 6, 8, 12, 16, 24, 32, 64].map(r => (
                        <option key={r} value={r}>{r} GB</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[#20211F] font-medium block mb-1">Resolution:</label>
                    <select
                      value={platformState.pc.targetResolution}
                      onChange={(e) => updateWindowsConfig({ targetResolution: e.target.value as any })}
                      className="w-full bg-[#F6F5F1] border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F]"
                    >
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                      <option value="1440p">1440p</option>
                      <option value="4k">4K</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[#20211F] font-medium block mb-1">Free Storage (GB):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={storageInput}
                    onChange={(e) => handleStorageChange(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full bg-[#F6F5F1] border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F] font-mono focus:outline-none focus:border-[#C85B38]"
                  />
                </div>
              </div>
            )}

            {/* Android Processor Text Input - Strictly Isolated to platformState.android */}
            {activePlatform === 'android' && (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[#20211F] font-medium">Processor / Chipset Name:</label>
                    <span className="text-[#85867F] font-mono text-[10px]">
                      Tier {resolveAndroidChipsetTier(platformState.android.soc)}/8
                    </span>
                  </div>
                  <input
                    type="text"
                    value={platformState.android.soc}
                    onChange={(e) => {
                      const name = e.target.value;
                      const tier = resolveAndroidChipsetTier(name);
                      updateAndroidConfig({ soc: name, socTier: tier, deviceModel: name });
                    }}
                    placeholder="e.g. Snapdragon 8 Gen 2, Dimensity 1080..."
                    className="w-full bg-[#F6F5F1] border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F] focus:outline-none focus:border-[#C85B38]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[#20211F] font-medium block mb-1">RAM (GB):</label>
                    <select
                      value={platformState.android.ramGb}
                      onChange={(e) => updateAndroidConfig({ ramGb: Number(e.target.value) })}
                      className="w-full bg-[#F6F5F1] border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F]"
                    >
                      {[2, 3, 4, 6, 8, 12, 16].map(r => (
                        <option key={r} value={r}>{r} GB</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[#20211F] font-medium block mb-1">Free Storage (GB):</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={storageInput}
                      onChange={(e) => handleStorageChange(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full bg-[#F6F5F1] border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F] font-mono focus:outline-none focus:border-[#C85B38]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* iOS iPhone Model Text Input - Strictly Isolated to platformState.ios */}
            {activePlatform === 'ios' && (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[#20211F] font-medium">iPhone Model:</label>
                    <span className="text-[#85867F] font-mono text-[10px]">
                      {platformState.ios.chipset} (Tier {platformState.ios.chipsetTier}/8)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={platformState.ios.iphoneModel}
                    onChange={(e) => {
                      const model = e.target.value;
                      const parsed = resolveIphoneModel(model);
                      updateIosConfig({
                        iphoneModel: model,
                        chipset: parsed.cpu,
                        chipsetTier: parsed.cpuTier,
                        gpuDesc: parsed.gpu,
                        ramGb: parsed.defaultRam,
                        os: parsed.os,
                        name: model || 'iPhone',
                      });
                    }}
                    placeholder="e.g. iPhone 13, iPhone 15 Pro, iPhone 12..."
                    className="w-full bg-[#F6F5F1] border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F] focus:outline-none focus:border-[#C85B38]"
                  />
                  <span className="text-[10px] text-[#85867F] mt-1 block">
                    Write your iPhone model. Silicon architecture and memory are resolved automatically.
                  </span>
                </div>

                <div>
                  <label className="text-[#20211F] font-medium block mb-1">Free Storage (GB):</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={storageInput}
                    onChange={(e) => handleStorageChange(e.target.value)}
                    placeholder="e.g. 64"
                    className="w-full bg-[#F6F5F1] border border-[#DCDCD4] rounded-[6px] p-2 text-[#20211F] font-mono focus:outline-none focus:border-[#C85B38]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Diagnostic Results (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Matrix Component */}
          <CompatibilityMatrix game={selectedGame} compatibility={compatibility} />

          {/* Quick Action Bar */}
          <div className="bg-white border border-[#DCDCD4] rounded-[10px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#20211F]">
                Need more performance headroom?
              </div>
              <p className="text-xs text-[#686A64] mt-0.5">
                Explore lightweight alternatives that deliver equivalent gameplay themes on your current hardware.
              </p>
            </div>
            <button
              onClick={() => onViewAlternatives(selectedGame)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#C85B38] hover:bg-[#A9472B] rounded-[8px] transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              Browse Alternatives
              <IconArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Top 3 Alternative Recommendations Preview */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#686A64]">
              Compatibility-Aware Alternatives for {selectedGame.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alternatives.slice(0, 3).map((alt) => (
                <div
                  key={alt.game.id}
                  onClick={() => onSelectGame(alt.game)}
                  className="bg-white border border-[#DCDCD4] hover:border-[#20211F] rounded-[8px] p-4 space-y-2.5 transition-all cursor-pointer shadow-xs group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase text-[#85867F]">
                      {alt.game.platforms.map(p => p.toUpperCase()).join('/')}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] ${
                      alt.hardwareVerdict === 'runs_better'
                        ? 'bg-[#2F6B50]/10 text-[#2F6B50]'
                        : alt.hardwareVerdict === 'runs_same'
                        ? 'bg-[#EEEDE7] text-[#686A64]'
                        : 'bg-[#B34335]/10 text-[#B34335]'
                    }`}>
                      {alt.hardwareVerdict === 'runs_better' ? 'Runs Smoother' : alt.hardwareVerdict === 'runs_same' ? 'Same Tier' : 'More Demanding'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-[#20211F] group-hover:text-[#C85B38] transition-colors line-clamp-1">
                    {alt.game.title}
                  </h4>

                  <p className="text-[11px] text-[#686A64] line-clamp-2">
                    {alt.hardwareSuitabilityMessage}
                  </p>

                  <div className="text-[10px] text-[#85867F] font-mono pt-2 border-t border-[#E8E7E0] flex justify-between">
                    <span>Similarity: {alt.similarityScore}%</span>
                    <span className="text-[#C85B38] font-semibold group-hover:underline">View Spec</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
