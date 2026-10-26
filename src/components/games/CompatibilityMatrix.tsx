import React from 'react';
import { useHardware } from '../../context/HardwareContext';
import { CompatibilityResult, Game } from '../../types';
import { IconAlert, IconCheck, IconInfo, IconSliders } from '../common/Icons';

interface CompatibilityMatrixProps {
  game: Game;
  compatibility: CompatibilityResult;
}

export const CompatibilityMatrix: React.FC<CompatibilityMatrixProps> = ({ game, compatibility }) => {
  const { hardware, openHardwareModal } = useHardware();

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning' | 'uncertain') => {
    switch (status) {
      case 'pass':
        return (
          <span className="flex items-center gap-1 text-[#2F6B50] bg-[#2F6B50]/10 border border-[#2F6B50]/30 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold">
            <IconCheck className="w-3.5 h-3.5 text-[#2F6B50]" />
            Pass
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[#946A28] bg-[#946A28]/10 border border-[#946A28]/30 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold">
            <IconAlert className="w-3.5 h-3.5 text-[#946A28]" />
            Minimum
          </span>
        );
      case 'fail':
        return (
          <span className="flex items-center gap-1 text-[#B34335] bg-[#B34335]/10 border border-[#B34335]/30 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold">
            <IconAlert className="w-3.5 h-3.5 text-[#B34335]" />
            Below
          </span>
        );
      case 'uncertain':
        return (
          <span className="flex items-center gap-1 text-[#656B73] bg-[#EEEDE7] border border-[#DCDCD4] px-2 py-0.5 rounded-[5px] text-[11px] font-semibold">
            <IconInfo className="w-3.5 h-3.5 text-[#656B73]" />
            Uncertain
          </span>
        );
    }
  };

  const rows = [
    { key: 'cpu', check: compatibility.checks.cpu },
    { key: 'gpu', check: compatibility.checks.gpu },
    { key: 'ram', check: compatibility.checks.ram },
    { key: 'storage', check: compatibility.checks.storage },
    { key: 'os', check: compatibility.checks.os },
  ];

  return (
    <div className="bg-white border border-[#DCDCD4] rounded-[10px] overflow-hidden shadow-xs">
      {/* Header bar */}
      <div className="p-5 border-b border-[#E8E7E0] bg-[#F6F5F1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-[#20211F] tracking-tight">
              Hardware Compatibility Audit
            </h4>
            <span className="text-xs text-[#85867F] font-mono">
              vs {hardware.name}
            </span>
          </div>
          <p className="text-xs text-[#686A64] mt-0.5">
            Evaluated at <span className="font-semibold text-[#20211F] font-mono">{hardware.targetResolution}</span> target resolution.
          </p>
        </div>

        <button
          onClick={openHardwareModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#20211F] bg-white hover:bg-[#EEEDE7] border border-[#DCDCD4] rounded-[8px] transition-colors cursor-pointer"
        >
          <IconSliders className="w-3.5 h-3.5 text-[#C85B38]" />
          Adjust Test Hardware
        </button>
      </div>

      {/* Primary verdict banner */}
      <div className={`p-5 border-b border-[#E8E7E0] ${
        compatibility.status === 'meets_recommended'
          ? 'bg-[#2F6B50]/8 text-[#20211F]'
          : compatibility.status === 'meets_minimum'
          ? 'bg-[#946A28]/8 text-[#20211F]'
          : compatibility.status === 'below_minimum'
          ? 'bg-[#B34335]/8 text-[#20211F]'
          : 'bg-[#EEEDE7] text-[#20211F]'
      }`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {compatibility.status === 'meets_recommended' && <IconCheck className="w-5 h-5 text-[#2F6B50]" />}
            {compatibility.status === 'meets_minimum' && <IconAlert className="w-5 h-5 text-[#946A28]" />}
            {compatibility.status === 'below_minimum' && <IconAlert className="w-5 h-5 text-[#B34335]" />}
            {(compatibility.status === 'uncertain' || compatibility.status === 'unsupported_platform') && <IconInfo className="w-5 h-5 text-[#656B73]" />}
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">
              {compatibility.statusLabel}
            </div>
            <p className="text-xs mt-1 leading-relaxed text-[#686A64]">
              {compatibility.summary}
            </p>
            {compatibility.limitingBottleneck && (
              <div className="mt-2 text-xs font-medium text-[#20211F]">
                Limiting factor: <span className="font-semibold text-[#B34335]">{compatibility.limitingBottleneck}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Specification Comparison Table */}
      <div className="divide-y divide-[#E8E7E0]">
        {rows.map(({ key, check }) => (
          <div key={key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="sm:w-1/4">
              <span className="font-bold text-[#20211F] block">{check.metricLabel}</span>
              <span className="text-[#85867F] text-[11px] font-mono tabular-nums">{check.required}</span>
            </div>

            <div className="sm:w-2/5">
              <span className="text-[#85867F] block text-[11px]">Your Hardware:</span>
              <span className="font-semibold text-[#20211F] font-mono tabular-nums">{check.userHas}</span>
              <p className="text-[11px] text-[#686A64] mt-0.5">{check.message}</p>
              {check.comparisonResult?.comparisonMethod && check.comparisonResult.comparisonMethod !== 'unknown' && (
                <div className="flex items-center gap-2 mt-1 text-[10px] text-[#85867F]">
                  <span className="font-mono bg-[#EEEDE7] px-1.5 py-0.5 rounded-[4px] text-[#686A64] capitalize">
                    {check.comparisonResult.comparisonMethod.replace('-', ' ')}
                  </span>
                  {check.confidence && (
                    <span className="font-mono text-[10px] text-[#85867F]">
                      ({check.confidence} confidence)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="sm:w-1/6 flex items-center sm:justify-end">
              {getStatusIcon(check.status)}
            </div>
          </div>
        ))}
      </div>

      {/* Headroom & Resolution Notes */}
      <div className="p-4 bg-[#F6F5F1] border-t border-[#E8E7E0] text-xs text-[#686A64] space-y-1">
        <div className="flex items-start gap-2">
          <span className="font-semibold text-[#20211F] shrink-0">Performance Headroom:</span>
          <span>{compatibility.headroomDescription}</span>
        </div>
        <div className="flex items-start gap-2 text-[#85867F]">
          <span className="font-semibold text-[#686A64] shrink-0">Operational Note:</span>
          <span>{compatibility.resolutionImpactNote} Meeting minimum requirements represents an operational baseline, not a guarantee of 60 FPS in dense scenes.</span>
        </div>
      </div>
    </div>
  );
};
