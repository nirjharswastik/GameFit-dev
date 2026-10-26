/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useHardware } from '../../context/HardwareContext';
import {
  resolveAndroidChipsetTier,
  resolveCpuTier,
  resolveGpuTier,
  resolveIphoneModel,
} from '../../data/hardware';
import { Platform } from '../../types';
import { IconCheck, IconClose, IconMonitor, IconSmartphone } from '../common/Icons';

export const HardwareModal: React.FC = () => {
  const {
    activePlatform,
    setActivePlatform,
    platformState,
    updateWindowsConfig,
    updateAndroidConfig,
    updateIosConfig,
    isHardwareModalOpen,
    closeHardwareModal,
  } = useHardware();

  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(activePlatform);

  // Isolated Windows draft fields
  const [draftWinCpu, setDraftWinCpu] = useState(platformState.pc.cpu);
  const [draftWinGpu, setDraftWinGpu] = useState(platformState.pc.gpu);
  const [draftWinRam, setDraftWinRam] = useState(platformState.pc.ramGb);
  const [draftWinStorage, setDraftWinStorage] = useState<string>(String(platformState.pc.storageFreeGb || 150));
  const [draftWinResolution, setDraftWinResolution] = useState(platformState.pc.targetResolution);

  // Isolated Android draft fields
  const [draftAndroidProcessor, setDraftAndroidProcessor] = useState(platformState.android.soc);
  const [draftAndroidRam, setDraftAndroidRam] = useState(platformState.android.ramGb);
  const [draftAndroidStorage, setDraftAndroidStorage] = useState<string>(String(platformState.android.storageFreeGb || 64));

  // Isolated iOS draft fields
  const [draftIosModel, setDraftIosModel] = useState(platformState.ios.iphoneModel);
  const [draftIosStorage, setDraftIosStorage] = useState<string>(String(platformState.ios.storageFreeGb || 64));

  // Sync state from isolated platform store whenever modal opens
  useEffect(() => {
    if (isHardwareModalOpen) {
      setSelectedPlatform(activePlatform);

      // Windows isolation
      setDraftWinCpu(platformState.pc.cpu);
      setDraftWinGpu(platformState.pc.gpu);
      setDraftWinRam(platformState.pc.ramGb);
      setDraftWinStorage(String(platformState.pc.storageFreeGb || 150));
      setDraftWinResolution(platformState.pc.targetResolution);

      // Android isolation
      setDraftAndroidProcessor(platformState.android.soc);
      setDraftAndroidRam(platformState.android.ramGb);
      setDraftAndroidStorage(String(platformState.android.storageFreeGb || 64));

      // iOS isolation
      setDraftIosModel(platformState.ios.iphoneModel);
      setDraftIosStorage(String(platformState.ios.storageFreeGb || 64));
    }
  }, [isHardwareModalOpen, activePlatform, platformState]);

  if (!isHardwareModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPlatform === 'pc') {
      const cpuName = draftWinCpu.trim() || 'Modern Quad-Core CPU';
      const gpuName = draftWinGpu.trim() || 'Standard Graphics Card';
      const parsedStorage = draftWinStorage.trim() === '' ? 50 : Math.max(1, Number(draftWinStorage) || 50);
      const cTier = resolveCpuTier(cpuName);
      const gTier = resolveGpuTier(gpuName);

      updateWindowsConfig({
        cpu: cpuName,
        cpuTier: cTier,
        gpu: gpuName,
        gpuTier: gTier,
        ramGb: Number(draftWinRam),
        storageFreeGb: parsedStorage,
        targetResolution: draftWinResolution,
        name: `${gpuName.split('/')[0].trim()} · ${draftWinRam}GB RAM`,
      });
    } else if (selectedPlatform === 'android') {
      const socName = draftAndroidProcessor.trim() || 'Qualcomm Snapdragon';
      const parsedStorage = draftAndroidStorage.trim() === '' ? 32 : Math.max(1, Number(draftAndroidStorage) || 32);
      const procTier = resolveAndroidChipsetTier(socName);

      updateAndroidConfig({
        soc: socName,
        socTier: procTier,
        deviceModel: socName,
        ramGb: Number(draftAndroidRam),
        storageFreeGb: parsedStorage,
        name: `Android (${socName})`,
      });
    } else if (selectedPlatform === 'ios') {
      const model = draftIosModel.trim() || 'iPhone 13';
      const parsedStorage = draftIosStorage.trim() === '' ? 32 : Math.max(1, Number(draftIosStorage) || 32);
      const parsedIos = resolveIphoneModel(model);

      updateIosConfig({
        iphoneModel: model,
        chipset: parsedIos.cpu,
        chipsetTier: parsedIos.cpuTier,
        gpuDesc: parsedIos.gpu,
        ramGb: parsedIos.defaultRam,
        storageFreeGb: parsedStorage,
        os: parsedIos.os,
        name: model,
      });
    }

    // Set the active platform immediately
    setActivePlatform(selectedPlatform);
    closeHardwareModal();
  };

  // Live parsed tier indicator for active tab's feedback
  const liveCpuTier = resolveCpuTier(draftWinCpu);
  const liveGpuTier = resolveGpuTier(draftWinGpu);
  const liveAndroidTier = resolveAndroidChipsetTier(draftAndroidProcessor);
  const liveIosInfo = resolveIphoneModel(draftIosModel);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hardware-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20211F]/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-[#F6F5F1] border border-[#DCDCD4] rounded-[12px] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DCDCD4] bg-white">
          <div>
            <h2 id="hardware-modal-title" className="text-base font-bold text-[#20211F]">
              Configure Device Specifications
            </h2>
            <p className="text-xs text-[#686A64] mt-0.5">
              Enter your hardware component names to test game compatibility.
            </p>
          </div>
          <button
            onClick={closeHardwareModal}
            className="p-1 text-[#85867F] hover:text-[#20211F] rounded-[6px] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1">
          {/* Platform Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#686A64] mb-2">
              Select Device Platform
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#EEEDE7] rounded-[8px] border border-[#DCDCD4]">
              <button
                type="button"
                onClick={() => setSelectedPlatform('pc')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-[6px] transition-all cursor-pointer ${
                  selectedPlatform === 'pc' ? 'bg-white text-[#20211F] shadow-xs' : 'text-[#686A64] hover:text-[#20211F]'
                }`}
              >
                <IconMonitor className="w-4 h-4" />
                Windows PC
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('android')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-[6px] transition-all cursor-pointer ${
                  selectedPlatform === 'android' ? 'bg-white text-[#20211F] shadow-xs' : 'text-[#686A64] hover:text-[#20211F]'
                }`}
              >
                <IconSmartphone className="w-4 h-4" />
                Android
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('ios')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-[6px] transition-all cursor-pointer ${
                  selectedPlatform === 'ios' ? 'bg-white text-[#20211F] shadow-xs' : 'text-[#686A64] hover:text-[#20211F]'
                }`}
              >
                <IconSmartphone className="w-4 h-4" />
                Apple iOS
              </button>
            </div>
          </div>

          {/* PC Inputs (Text Input for CPU and GPU) */}
          {selectedPlatform === 'pc' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#20211F]">
                    Processor (CPU) Name:
                  </label>
                  <span className="text-[11px] font-mono text-[#85867F]">
                    Estimated: Tier {liveCpuTier}/10
                  </span>
                </div>
                <input
                  type="text"
                  value={draftWinCpu}
                  onChange={(e) => setDraftWinCpu(e.target.value)}
                  placeholder="e.g. Intel Core i5-12400F, AMD Ryzen 5 5600X, i7-13700K..."
                  className="w-full text-xs bg-white border border-[#DCDCD4] rounded-[8px] p-2.5 text-[#20211F] placeholder-[#85867F] focus:outline-none focus:border-[#C85B38]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#20211F]">
                    Graphics Card (GPU) Name:
                  </label>
                  <span className="text-[11px] font-mono text-[#85867F]">
                    Estimated: Tier {liveGpuTier}/10
                  </span>
                </div>
                <input
                  type="text"
                  value={draftWinGpu}
                  onChange={(e) => setDraftWinGpu(e.target.value)}
                  placeholder="e.g. NVIDIA GeForce RTX 3060, GTX 1650, AMD RX 6600, Intel UHD 630..."
                  className="w-full text-xs bg-white border border-[#DCDCD4] rounded-[8px] p-2.5 text-[#20211F] placeholder-[#85867F] focus:outline-none focus:border-[#C85B38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#20211F] mb-1">
                    System RAM (GB):
                  </label>
                  <select
                    value={draftWinRam}
                    onChange={(e) => setDraftWinRam(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-[#DCDCD4] rounded-[8px] p-2.5 text-[#20211F] focus:outline-none focus:border-[#C85B38]"
                  >
                    {[4, 6, 8, 12, 16, 24, 32, 64].map(ram => (
                      <option key={ram} value={ram}>{ram} GB RAM</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#20211F] mb-1">
                    Target Resolution:
                  </label>
                  <select
                    value={draftWinResolution}
                    onChange={(e) => setDraftWinResolution(e.target.value as any)}
                    className="w-full text-xs bg-white border border-[#DCDCD4] rounded-[8px] p-2.5 text-[#20211F] focus:outline-none focus:border-[#C85B38]"
                  >
                    <option value="720p">720p (Laptop / Low load)</option>
                    <option value="1080p">1080p (Standard Full HD)</option>
                    <option value="1440p">1440p (2K Quad HD)</option>
                    <option value="4k">4K (2160p Ultra HD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20211F] mb-1">
                  Available Free Storage (GB):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={draftWinStorage}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setDraftWinStorage(val);
                    }
                  }}
                  placeholder="e.g. 150"
                  className="w-full text-xs bg-white border border-[#DCDCD4] rounded-[8px] p-2.5 text-[#20211F] font-mono focus:outline-none focus:border-[#C85B38]"
                />
                <span className="text-[10px] text-[#85867F] mt-0.5 block">
                  Free space available on your drive for game installation.
                </span>
              </div>
            </div>
          )}

          {/* Android Inputs */}
          {selectedPlatform === 'android' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#20211F]">
                    Processor / Chipset Name:
                  </label>
                  <span className="text-[11px] font-mono text-[#85867F]">
                    Estimated: Tier {liveAndroidTier}/8
                  </span>
                </div>
                <input
                  type="text"
                  value={draftAndroidProcessor}
                  onChange={(e) => setDraftAndroidProcessor(e.target.value)}
                  placeholder="e.g. Snapdragon 8 Gen 2, Dimensity 1080, Snapdragon 778G..."
                  className="w-full text-xs bg-white border border-[#DCDCD4] rounded-[8px] p-2.5 text-[#20211F] placeholder-[#85867F] focus:outline-none focus:border-[#C85B38]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#20211F] mb-1">
                    Device RAM (GB):
                  </label>
                  <select
                    value={draftAndroidRam}
                    onChange={(e) => setDraftAndroidRam(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-[#DCDCD4] rounded-[8px] p-2.5 text-[#20211F] focus:outline-none focus:border-[#C85B38]"
                  >
                    {[2, 3, 4, 6, 8, 12, 16].map(ram => (
                      <option key={ram} value={ram}>{ram} GB</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#20211F] mb-1">
                    Free Storage (GB):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={draftAndroidStorage}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d+$/.test(val)) {
                        setDraftAndroidStorage(val);
                      }
                    }}
                    placeholder="e.g. 50"
                    className="w-full text-xs bg-white border border-[#DCDCD4] rounded-[8px] p-2.5 text-[#20211F] font-mono focus:outline-none focus:border-[#C85B38]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* iOS Inputs */}
          {selectedPlatform === 'ios' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#20211F]">
                    iPhone Model:
                  </label>
                  <span className="text-[11px] font-mono text-[#85867F]">
                    Detected: {liveIosInfo.cpu} (Tier {liveIosInfo.cpuTier}/8)
                  </span>
                </div>
                <input
                  type="text"
                  value={draftIosModel}
                  onChange={(e) => setDraftIosModel(e.target.value)}
                  placeholder="e.g. iPhone 13, iPhone 15 Pro, iPhone 12, iPhone XR..."
                  className="w-full text-xs bg-white border border-[#DCDCD4] rounded-[8px] p-2.5 text-[#20211F] placeholder-[#85867F] focus:outline-none focus:border-[#C85B38]"
                />
                <span className="text-[10px] text-[#85867F] mt-1 block">
                  Write your model (e.g., iPhone 14 Pro, iPhone 13). Chipset architecture and RAM are automatically configured.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#20211F] mb-1">
                  Free Storage Space (GB):
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={draftIosStorage}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setDraftIosStorage(val);
                    }
                  }}
                  placeholder="e.g. 64"
                  className="w-full text-xs bg-white border border-[#DCDCD4] rounded-[8px] p-2.5 text-[#20211F] font-mono focus:outline-none focus:border-[#C85B38]"
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 text-xs sm:text-sm font-semibold text-white bg-[#C85B38] hover:bg-[#A9472B] rounded-[8px] transition-colors cursor-pointer shadow-xs"
            >
              Apply Hardware Specifications
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#EEEDE7] border-t border-[#DCDCD4] text-[11px] text-[#85867F] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <IconCheck className="w-3.5 h-3.5 text-[#2F6B50]" />
            Specifications are verified against real manufacturer benchmarks.
          </span>
          <span className="font-mono text-[10px]">GameFit Engine v2</span>
        </div>
      </div>
    </div>
  );
};
